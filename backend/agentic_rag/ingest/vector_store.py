import os
import logging
import chromadb
from django.conf import settings
from agentic_rag.services.embedding import EmbeddingService

logger = logging.getLogger(__name__)

# Persistence path for vector database
CHROMA_DIR = os.path.join(settings.BASE_DIR, "chroma_db_data")

class VectorStoreManager:
    _client = None
    _collection = None
    _is_ingested = None
    COLLECTION_NAME = "oasis_stays"

    @classmethod
    def get_client(cls):
        """
        Singleton persistent ChromaDB client.
        """
        if cls._client is None:
            logger.info(f"Initializing persistent ChromaDB client at: {CHROMA_DIR}")
            cls._client = chromadb.PersistentClient(path=CHROMA_DIR)
        return cls._client

    @classmethod
    def get_collection(cls):
        """
        Gets or creates the default collection.
        """
        if cls._collection is None:
            client = cls.get_client()
            cls._collection = client.get_or_create_collection(name=cls.COLLECTION_NAME)
        return cls._collection

    @classmethod
    def ingest_all(cls):
        """
        Ingests all cities, hotels, and rooms from the SQLite DB into ChromaDB.
        """
        from api.models import City, Hotel, Room
        
        logger.info("Starting database ingestion to vector store...")
        collection = cls.get_collection()
        
        # Clear existing items to start fresh
        try:
            count = collection.count()
            if count > 0:
                logger.info(f"Clearing {count} existing records in collection...")
                # Fetch all ids and delete them
                all_items = collection.get()
                if all_items and all_items['ids']:
                    collection.delete(ids=all_items['ids'])
        except Exception as e:
            logger.warning(f"Failed to clear existing collection: {e}")

        # Batch aggregators for optimized insertion
        batch_ids = []
        batch_embeddings = []
        batch_metadatas = []
        batch_documents = []

        # Process Cities
        cities = City.objects.all()
        for city in cities:
            desc = city.description or f"A beautiful city named {city.name} located in Egypt."
            doc_text = f"City: {city.name}. Description: {desc}"
            
            batch_ids.append(f"city_{city.id}")
            batch_metadatas.append({"type": "city", "id": city.id, "name": city.name})
            batch_documents.append(doc_text)
            logger.info(f"Processed City: {city.name}")

        # Process Hotels
        hotels = Hotel.objects.select_related('city').all()
        for hotel in hotels:
            city_name = hotel.city.name if hotel.city else "Egypt"
            doc_text = f"Hotel: {hotel.title} in {city_name}. Location: {hotel.location}. Description: {hotel.description}. Rating: {hotel.rate}/10."
            
            batch_ids.append(f"hotel_{hotel.id}")
            batch_metadatas.append({
                "type": "hotel", 
                "id": hotel.id, 
                "title": hotel.title, 
                "city_id": hotel.city.id if hotel.city else 0,
                "city_name": city_name
            })
            batch_documents.append(doc_text)
            logger.info(f"Processed Hotel: {hotel.title}")

        # Process Rooms
        rooms = Room.objects.select_related('hotel', 'hotel__city').all()
        for room in rooms:
            hotel_title = room.hotel.title
            city_name = room.hotel.city.name if room.hotel.city else "Egypt"
            doc_text = f"Room: {room.title} at {hotel_title} in {city_name}. Price: EGP {room.price_per_night} per night. Description: {room.description}. Rating: {room.rate}/10."
            
            batch_ids.append(f"room_{room.id}")
            batch_metadatas.append({
                "type": "room", 
                "id": room.id, 
                "title": room.title, 
                "hotel_id": room.hotel.id,
                "hotel_title": hotel_title,
                "price": float(room.price_per_night)
            })
            batch_documents.append(doc_text)
            logger.info(f"Processed Room: {room.title} at {hotel_title}")
            
        # Compute embeddings in batch for massive speedup
        if batch_documents:
            logger.info("Computing batch embeddings...")
            batch_embeddings = EmbeddingService.get_embeddings(batch_documents)
            
        # Bulk Insert
        if batch_ids:
            collection.add(
                ids=batch_ids,
                embeddings=batch_embeddings,
                metadatas=batch_metadatas,
                documents=batch_documents
            )
            logger.info(f"Bulk ingested {len(batch_ids)} items successfully.")
            
        logger.info("Ingestion completed successfully.")

    @classmethod
    def similarity_search(cls, query_text: str, limit: int = 5, item_type: str = None):
        """
        Queries ChromaDB for similar items. Optional type filter (city, hotel, room).
        """
        collection = cls.get_collection()
        
        # Optimize disk I/O: Only check count once per app lifecycle
        if cls._is_ingested is None:
            if collection.count() == 0:
                logger.info("Vector collection is empty. Auto-ingesting database models...")
                cls.ingest_all()
            cls._is_ingested = True

        query_embedding = EmbeddingService.get_embedding(query_text)
        
        where_filter = {}
        if item_type:
            where_filter = {"type": item_type}

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=limit,
            where=where_filter if where_filter else None
        )
        
        formatted_results = []
        if results and results['ids'] and len(results['ids'][0]) > 0:
            for idx in range(len(results['ids'][0])):
                formatted_results.append({
                    "id": results['ids'][0][idx],
                    "document": results['documents'][0][idx],
                    "metadata": results['metadatas'][0][idx],
                    "distance": results['distances'][0][idx] if 'distances' in results else 0.0
                })
        return formatted_results
