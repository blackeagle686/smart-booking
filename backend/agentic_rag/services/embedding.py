import logging
from functools import lru_cache
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

class EmbeddingService:
    _model_instance = None

    @classmethod
    def get_model(cls):
        """
        Singleton initialization of the local SentenceTransformer model.
        Optimized for CPU inference.
        """
        if cls._model_instance is None:
            logger.info("Initializing local embedding model 'all-MiniLM-L6-v2' (this may take a few seconds on first run)...")
            try:
                # Explicitly set device to cpu for optimization on standard servers
                cls._model_instance = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')
                logger.info("Local embedding model loaded successfully.")
            except Exception as e:
                logger.error(f"Failed to load embedding model: {str(e)}")
                raise e
        return cls._model_instance

    @classmethod
    @lru_cache(maxsize=1024)
    def _cached_encode(cls, text: str):
        model = cls.get_model()
        # convert_to_tensor=False is faster as it returns numpy arrays directly
        return model.encode(text, convert_to_tensor=False).tolist()

    @classmethod
    def get_embedding(cls, text: str):
        """
        Generates embedding vector (list of floats) for the given input text,
        using an LRU cache to avoid recomputing the same queries.
        """
        return cls._cached_encode(text)

    @classmethod
    def get_embeddings(cls, texts: list):
        """
        Generates embeddings for a batch of texts simultaneously.
        This is significantly faster than generating them one by one.
        """
        model = cls.get_model()
        return model.encode(texts, convert_to_tensor=False).tolist()
