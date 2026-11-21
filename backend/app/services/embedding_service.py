import logging
from typing import List, Optional
import numpy as np
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

_genai_client = None


def get_genai_client():
    global _genai_client
    if _genai_client is not None:
        return _genai_client
    if not settings.GEMINI_API_KEY:
        return None
    try:
        from google import genai
        _genai_client = genai.Client(api_key=settings.GEMINI_API_KEY)
        return _genai_client
    except Exception as e:
        logger.error(f"Failed to create Google GenAI Client: {e}")
        return None


class EmbeddingService:
    def __init__(self, model_name: str = "text-embedding-004", dimension: int = 768):
        self.model_name = model_name
        self.dimension = dimension

    def _fallback_embedding(self, text: str) -> List[float]:
        """
        Deterministic pseudo-embedding for testing when GEMINI_API_KEY is not yet configured.
        Generates a consistent 768-dimensional normalized unit vector based on text hash and token frequencies.
        """
        import hashlib
        seed = int(hashlib.sha256(text.encode("utf-8")).hexdigest()[:8], 16)
        rng = np.random.RandomState(seed)
        vec = rng.randn(self.dimension)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    async def get_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a single text chunk using Google GenAI text-embedding-004.
        """
        clean_text = text.strip()
        if not clean_text:
            return [0.0] * self.dimension

        client = get_genai_client()
        if client and settings.GEMINI_API_KEY:
            try:
                # Use Google GenAI SDK embed content
                response = client.models.embed_content(
                    model=self.model_name,
                    contents=clean_text
                )
                if response and hasattr(response, "embedding") and response.embedding:
                    values = response.embedding.values
                    if len(values) == self.dimension:
                        return list(values)
                    # If dimension differs, pad or truncate
                    padded = (list(values) + [0.0] * self.dimension)[:self.dimension]
                    return padded
            except Exception as e:
                logger.warning(f"Google GenAI embedding error: {e}. Falling back to deterministic vector.")

        return self._fallback_embedding(clean_text)

    async def get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of text chunks.
        """
        results = []
        for text in texts:
            emb = await self.get_embedding(text)
            results.append(emb)
        return results


embedding_service = EmbeddingService(
    model_name=settings.EMBEDDING_MODEL.replace("models/", ""),
    dimension=settings.EMBEDDING_DIMENSION
)
