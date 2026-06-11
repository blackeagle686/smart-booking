from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, City, CityImage, Hotel, Room, Booking
from .serializers import UserSerializer, CitySerializer, HotelSerializer, RoomSerializer, BookingSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)

class RegisterView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': serializer.data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class CityViewSet(viewsets.ModelViewSet):
    queryset = City.objects.prefetch_related('gallery').all()
    serializer_class = CitySerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        city = City.objects.get(id=response.data['id'])
        for img in request.FILES.getlist('gallery'):
            CityImage.objects.create(city=city, image=img)
        return response

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        city = self.get_object()
        if request.FILES.getlist('gallery'):
            for img in request.FILES.getlist('gallery'):
                CityImage.objects.create(city=city, image=img)
        return response

    @action(detail=True, methods=['post'], url_path='remove_image')
    def remove_image(self, request, pk=None):
        city = self.get_object()
        image_url = request.data.get('image_url')
        if not image_url:
            return Response({'error': 'image_url is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Check gallery images
        for img in city.gallery.all():
            if img.image and img.image.url in image_url:
                img.delete()
                return Response({'status': 'gallery image deleted'})
                
        # Check main image
        if city.image and city.image.url in image_url:
            city.image = None
            city.save()
            return Response({'status': 'main image removed'})
            
        return Response({'error': f'Image not found in this city. Provided: {image_url}'}, status=status.HTTP_404_NOT_FOUND)

class HotelViewSet(viewsets.ModelViewSet):
    queryset = Hotel.objects.select_related('city').prefetch_related('rooms__bookings').all()
    serializer_class = HotelSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['location', 'city']
    search_fields = ['title', 'location', 'city__name']

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.select_related('hotel').prefetch_related('bookings').all()
    serializer_class = RoomSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['hotel']

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        base_qs = Booking.objects.select_related('user', 'room', 'room__hotel', 'room__hotel__city').all()
        if self.request.user.is_staff:
            return base_qs
        return base_qs.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, pk=None):
        booking = self.get_object()
        is_approved = request.data.get('is_approved', True)
        booking.is_approved = is_approved
        booking.save()
        return Response({'status': 'Booking approval updated', 'is_approved': booking.is_approved})

import redis
import hashlib
import json
from rest_framework.views import APIView
import numpy as np

# Initialize Redis Client
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

def _cosine_similarity(vec1, vec2):
    v1, v2 = np.array(vec1), np.array(vec2)
    norm = np.linalg.norm(v1) * np.linalg.norm(v2)
    return np.dot(v1, v2) / norm if norm > 0 else 0.0


class AgenticRagChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Retrieve the user's chat history from the Redis memory layer."""
        user_id = request.user.id
        memory_key = f"chat_memory:{user_id}"
        server_history = json.loads(redis_client.get(memory_key) or "[]")
        return Response({"history": server_history}, status=status.HTTP_200_OK)

    def post(self, request):
        message = request.data.get("message")
        history = request.data.get("history", [])
        if isinstance(history, str):
            try:
                history = json.loads(history)
            except:
                history = []
        
        # Handling custom message replies
        reply_to = request.data.get("reply_to", None)
        if reply_to:
            message = f"Replying to: '{reply_to}' -> {message}"
            
        check_in = request.data.get("check_in")
        check_out = request.data.get("check_out")
        screenshot = request.FILES.get("screenshot")
        
        screenshot_path = ""
        if screenshot:
            from django.core.files.storage import FileSystemStorage
            fs = FileSystemStorage(location='media/payments/')
            filename = fs.save(screenshot.name, screenshot)
            screenshot_path = f"payments/{filename}"
            
        context = []
        if check_in and check_out:
            context.append(f"Check-in: {check_in}, Check-out: {check_out}")
        if screenshot_path:
            context.append(f"Screenshot uploaded at path: '{screenshot_path}'")
            
        if context:
            message += f"\n\n[SYSTEM INFO: The user has attached the following data via UI widgets: {', '.join(context)}]"

        if not message:
            return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user_id = request.user.id
            
            bypass_cache = bool(context) # bypass cache if there is system context
            current_emb = None
            semantic_cache_key = f"semantic_cag:{user_id}"
            
            if not bypass_cache:
                from agentic_rag.services.embedding import EmbeddingService
                current_emb = EmbeddingService.get_embedding(message)
                
                # Redis holds a list of dicts: [{"emb": [...], "response": "..."}, ...]
                semantic_cache = json.loads(redis_client.get(semantic_cache_key) or "[]")
                
                cached_response = None
                for item in semantic_cache:
                    sim = _cosine_similarity(current_emb, item['emb'])
                    if sim > 0.92:  # 92% semantic similarity threshold
                        cached_response = item['response']
                        break
                        
                if cached_response:
                    self._update_user_memory(user_id, message, cached_response)
                    return Response({"response": cached_response, "cached": True})
            
            # --- MEMORY LAYER ---
            # Retrieve persistent server-side history from Redis
            memory_key = f"chat_memory:{user_id}"
            server_history = json.loads(redis_client.get(memory_key) or "[]")
            
            # Combine provided short-term client history with long-term server memory
            combined_history = server_history + history
            
            # Execute Agent
            from agentic_rag.query.agent import AgenticRagAgent
            response = AgenticRagAgent.run(user=request.user, user_message=message, chat_history=combined_history[-15:])
            
            # Save to Semantic CAG Cache
            if not bypass_cache and current_emb is not None:
                semantic_cache = json.loads(redis_client.get(semantic_cache_key) or "[]")
                semantic_cache.append({
                    "emb": current_emb,
                    "response": response
                })
                # Keep last 20 queries to prevent memory bloat
                redis_client.set(semantic_cache_key, json.dumps(semantic_cache[-20:]))
                redis_client.expire(semantic_cache_key, 3600)  # expire in 1 hour
            
            # Update Server-side persistent memory
            self._update_user_memory(user_id, message, response)
            
            return Response({"response": response, "cached": False})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _update_user_memory(self, user_id, message, response):
        """Helper to manage accurate context window in Redis."""
        memory_key = f"chat_memory:{user_id}"
        server_history = json.loads(redis_client.get(memory_key) or "[]")
        server_history.append({"role": "user", "content": message})
        server_history.append({"role": "assistant", "content": response})
        # Keep only the last 10 messages for efficient persistent memory
        redis_client.set(memory_key, json.dumps(server_history[-10:]))

class VectorIngestView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        try:
            from agentic_rag.ingest.vector_store import VectorStoreManager
            VectorStoreManager.ingest_all()
            return Response({"status": "Success", "message": "Successfully reindexed database models to vector store."})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

