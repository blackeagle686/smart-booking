from rest_framework import serializers
from .models import User, City, CityImage, Hotel, Room, Booking

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name', 'is_staff', 'phone_number')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', '')
        )
        return user

class RoomBookingDatesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ('check_in_date', 'check_out_date')

class RoomSerializer(serializers.ModelSerializer):
    booked_dates = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = '__all__'

    def get_booked_dates(self, obj):
        bookings = obj.bookings.all()
        return RoomBookingDatesSerializer(bookings, many=True).data

class CityImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CityImage
        fields = ('id', 'image')

class CitySerializer(serializers.ModelSerializer):
    gallery = CityImageSerializer(many=True, read_only=True)

    class Meta:
        model = City
        fields = '__all__'

class HotelSerializer(serializers.ModelSerializer):
    rooms = RoomSerializer(many=True, read_only=True)
    city_details = CitySerializer(source='city', read_only=True)

    class Meta:
        model = Hotel
        fields = '__all__'

class BookingSerializer(serializers.ModelSerializer):
    room_details = RoomSerializer(source='room', read_only=True)
    user_details = UserSerializer(source='user', read_only=True)
    hotel_name = serializers.CharField(source='room.hotel.title', read_only=True)
    city_name = serializers.CharField(source='room.hotel.city.name', read_only=True)

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ('user', 'is_approved', 'created_at')

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)
