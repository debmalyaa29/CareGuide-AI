import logging
from typing import Optional
from fastapi import APIRouter, Header, Depends
from backend.app.schemas.preferences import UserPreferencesResponse, UserPreferencesUpdate
from backend.app.core.auth import require_authenticated_user
from backend.app.services.memory_service import memory_service
from backend.app.database.supabase_client import get_supabase_client, get_supabase_admin_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/preferences", tags=["Patient Preferences"])

_preferences_store = {}


@router.get("", response_model=UserPreferencesResponse)
async def get_preferences(user_id: str = Depends(require_authenticated_user)):
    memory_enabled = await memory_service.is_memory_enabled(user_id)

    client = get_supabase_client()
    if client:
        try:
            res = client.table("profiles").select("*").eq("user_id", user_id).execute()
            if res.data and len(res.data) > 0:
                p = res.data[0]
                return UserPreferencesResponse(
                    user_id=user_id,
                    preferred_explanation_style=p.get("preferred_explanation_style", "simple"),
                    preferred_response_length=p.get("preferred_response_length", "medium"),
                    memory_enabled=p.get("memory_enabled", True)
                )
        except Exception as e:
            logger.debug(f"Supabase get_preferences error: {e}")

    cached = _preferences_store.get(user_id, {
        "preferred_explanation_style": "simple",
        "preferred_response_length": "medium",
        "memory_enabled": memory_enabled
    })

    return UserPreferencesResponse(
        user_id=user_id,
        preferred_explanation_style=cached.get("preferred_explanation_style", "simple"),
        preferred_response_length=cached.get("preferred_response_length", "medium"),
        memory_enabled=cached.get("memory_enabled", True)
    )


@router.put("", response_model=UserPreferencesResponse)
async def update_preferences(
    payload: UserPreferencesUpdate,
    user_id: str = Depends(require_authenticated_user)
):

    current = _preferences_store.get(user_id, {
        "preferred_explanation_style": "simple",
        "preferred_response_length": "medium",
        "memory_enabled": True
    })

    if payload.preferred_explanation_style is not None:
        current["preferred_explanation_style"] = payload.preferred_explanation_style
    if payload.preferred_response_length is not None:
        current["preferred_response_length"] = payload.preferred_response_length
    if payload.memory_enabled is not None:
        current["memory_enabled"] = payload.memory_enabled
        await memory_service.set_memory_enabled(user_id, payload.memory_enabled)

    _preferences_store[user_id] = current

    client = get_supabase_admin_client() or get_supabase_client()
    if client:
        try:
            client.table("profiles").upsert({
                "user_id": user_id,
                "preferred_explanation_style": current["preferred_explanation_style"],
                "preferred_response_length": current["preferred_response_length"],
                "memory_enabled": current["memory_enabled"]
            }, on_conflict="user_id").execute()
        except Exception as e:
            logger.debug(f"Supabase upsert profile error: {e}")

    return UserPreferencesResponse(
        user_id=user_id,
        preferred_explanation_style=current["preferred_explanation_style"],
        preferred_response_length=current["preferred_response_length"],
        memory_enabled=current["memory_enabled"]
    )
