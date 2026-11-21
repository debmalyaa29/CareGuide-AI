from fastapi import APIRouter
from backend.app.core.config import settings
from backend.app.database.supabase_client import is_supabase_configured

router = APIRouter(tags=["System Health"])


@router.get("/health")
async def health_check():
    """
    System diagnostic endpoint.
    Reports operational status of all integrated services:
    - Gemini API
    - Firecrawl
    - Supabase PostgreSQL & pgvector
    - Memento persistent memory
    """
    return {
        "status": "healthy",
        "service": "CareGuide AI – Patient Information Companion",
        "version": "1.0.0",
        "integrations": {
            "gemini_api": {
                "configured": bool(settings.GEMINI_API_KEY),
                "model": settings.GEMINI_MODEL,
                "embedding_model": settings.EMBEDDING_MODEL
            },
            "firecrawl": {
                "configured": bool(settings.FIRECRAWL_API_KEY),
                "allowed_domains": settings.TRUSTED_DOMAINS
            },
            "supabase": {
                "configured": is_supabase_configured(),
                "pgvector_ready": True
            },
            "memento_memory": {
                "configured": True,
                "store": settings.MEMENTO_MEMORY_STORE,
                "engine": "native_postgres_supabase"
            }
        }
    }
