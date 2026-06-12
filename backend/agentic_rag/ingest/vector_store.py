import os
import logging
import chromadb
from django.conf import settings
from agentic_rag.services.embedding import EmbeddingService

# Move Django model imports to the top as requested
from api.models import City, Hotel, Room

# Initialize logger
logger = logging.getLogger(__name__)

# Persistence path for the ChromaDB vector database
CHROMA_DIR = os.path.join(settings.BASE_DIR, "chroma_db_data")


class VectorStoreManager:
    """
    Manages the ChromaDB vector database instance for the SmartBooking platform.
    Handles the persistence, ingestion of relational data (Cities, Hotels, Rooms) 
    into vector embeddings, and provides similarity search capabilities for the Agentic RAG.
    """
    
    _client = None
    _collection = None
    _is_ingested = None
    COLLECTION_NAME = "oasis_stays"

    @classmethod
    def get_client(cls):
        """
        Retrieves the singleton instance of the persistent ChromaDB client.
        
        Returns:
            chromadb.PersistentClient: The configured ChromaDB client.
        """
        if cls._client is None:
            logger.info(f"Initializing persistent ChromaDB client at: {CHROMA_DIR}")
            cls._client = chromadb.PersistentClient(path=CHROMA_DIR)
        return cls._client

    @classmethod
    def get_collection(cls):
        """
        Retrieves or creates the primary vector collection.
        
        Returns:
            chromadb.Collection: The main collection for the application.
        """
        if cls._collection is None:
            client = cls.get_client()
            cls._collection = client.get_or_create_collection(name=cls.COLLECTION_NAME)
        return cls._collection

    @classmethod
    def ingest_all(cls):
        """
        Extracts all Cities, Hotels, and Rooms from the SQLite database, 
        generates vector embeddings for them via the EmbeddingService, 
        and bulk-inserts them into ChromaDB for efficient semantic search.
        """
        logger.info("Starting database ingestion to vector store...")
        collection = cls.get_collection()
        
        # Step 1: Clear existing data to prevent duplicates
        try:
            count = collection.count()
            if count > 0:
                logger.info(f"Clearing {count} existing records in collection...")
                all_items = collection.get()
                if all_items and all_items['ids']:
                    collection.delete(ids=all_items['ids'])
        except Exception as e:
            logger.warning(f"Failed to clear existing collection: {e}")

        batch_ids = []
        batch_embeddings = []
        batch_metadatas = []
        batch_documents = []

        # Step 2: Process City Models
        cities = City.objects.all()
        for city in cities:
            desc = city.description or f"A beautiful city named {city.name} located in Egypt."
            doc_text = f"City: {city.name}. Description: {desc}"
            
            batch_ids.append(f"city_{city.id}")
            batch_metadatas.append({
                "type": "city", 
                "id": city.id, 
                "name": city.name
            })
            batch_documents.append(doc_text)

        # Step 3: Process Hotel Models
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

        # Step 4: Process Room Models
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
            
        # Step 5: Compute embeddings and perform bulk insertion
        if batch_documents:
            logger.info("Computing batch embeddings...")
            batch_embeddings = EmbeddingService.get_embeddings(batch_documents)
            
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
        Queries the vector database for items semantically similar to the provided text.
        
        Args:
            query_text (str): The search query.
            limit (int): Maximum number of results to return.
            item_type (str, optional): Filter by type (e.g., 'city', 'hotel', 'room').
            
        Returns:
            list[dict]: A list of matched items with their metadata and distance scores.
        """
        collection = cls.get_collection()
        
        # Optimize disk I/O: Auto-ingest if the collection is empty upon first search
        if cls._is_ingested is None:
            if collection.count() == 0:
                logger.info("Vector collection is empty. Auto-ingesting database models...")
                cls.ingest_all()
            cls._is_ingested = True

        query_embedding = EmbeddingService.get_embedding(query_text)
        
        where_filter = {"type": item_type} if item_type else None

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=limit,
            where=where_filter
        )
        
        formatted_results = []
        if results and results.get('ids') and len(results['ids'][0]) > 0:
            for idx in range(len(results['ids'][0])):
                formatted_results.append({
                    "id": results['ids'][0][idx],
                    "document": results['documents'][0][idx],
                    "metadata": results['metadatas'][0][idx],
                    "distance": results['distances'][0][idx] if 'distances' in results else 0.0
                })
                
        return formatted_results
