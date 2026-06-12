import logging
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

logger = logging.getLogger(__name__)

class LLMService:
    _client = None
    MODEL_NAME = os.getenv("LONGCAT_MODEL_NAME", "LongCat-2.0-Preview")
    API_KEY = os.getenv("LONGCAT_API_KEY", "")
    BASE_URL = os.getenv("LONGCAT_BASE_URL", "https://api.longcat.chat/openai")

    @classmethod
    def get_client(cls):
        """
        Singleton initialization of the OpenAI client configured for LongCat API.
        """
        if cls._client is None:
            logger.info("Initializing OpenAI client for LongCat API...")
            cls._client = OpenAI(
                api_key=cls.API_KEY,
                base_url=cls.BASE_URL
            )
        return cls._client

    @classmethod
    def chat_completion(cls, messages, tools=None, tool_choice=None):
        """
        Sends messages to the LongCat LLM with optional tool calling schemas.
        """
        client = cls.get_client()
        try:
            params = {
                "model": cls.MODEL_NAME,
                "messages": messages,
                "temperature": 0.2
            }
            if tools:
                params["tools"] = tools
                if tool_choice:
                    params["tool_choice"] = tool_choice
                else:
                    params["tool_choice"] = "auto"

            response = client.chat.completions.create(**params)
            return response.choices[0].message
        except Exception as e:
            logger.error(f"Error during LLM chat completion: {str(e)}")
            raise e
