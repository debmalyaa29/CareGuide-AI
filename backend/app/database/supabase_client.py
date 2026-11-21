from typing import Optional, Dict, Any, List
import logging
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

try:
    from supabase import create_client, Client
except ImportError:
    Client = None
    create_client = None

_supabase_client: Optional[Client] = None
_supabase_admin_client: Optional[Client] = None


def get_supabase_client() -> Optional[Client]:
    """
    Returns an initialized Supabase client using Anon Key.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        logger.warning(
            "Supabase URL or Anon Key is missing. Using in-memory fallback storage until configured."
        )
        return None

    try:
        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
        return _supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None


def get_supabase_admin_client() -> Optional[Client]:
    """
    Returns an initialized Supabase client using Service Role Key (for administrative vector ops / bypass RLS).
    """
    global _supabase_admin_client
    if _supabase_admin_client is not None:
        return _supabase_admin_client

    key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
    if not settings.SUPABASE_URL or not key:
        return None

    try:
        _supabase_admin_client = create_client(settings.SUPABASE_URL, key)
        return _supabase_admin_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase admin client: {e}")
        return None


def is_supabase_configured() -> bool:
    return bool(settings.SUPABASE_URL and (settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY))
