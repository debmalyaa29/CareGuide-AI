import logging
from typing import Optional
from fastapi import APIRouter, Header, Depends
from backend.app.schemas.memory import MemoryListResponse, ClearMemoryResponse
from backend.app.core.auth import require_authenticated_user
from backend.app.services.memory_service import memory_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/memory", tags=["Memento Persistent Memory"])


@router.get("", response_model=MemoryListResponse)
async def get_memories(user_id: str = Depends(require_authenticated_user)):
    """
    Retrieve Memento persistent memory, tracked topics, and preferences for the authenticated patient.
    """
    is_enabled = await memory_service.is_memory_enabled(user_id)
    memories = await memory_service.get_memories(user_id)
    topics = [m.topic for m in memories]

    return MemoryListResponse(
        user_id=user_id,
        memory_enabled=is_enabled,
        memories=memories,
        topics=topics
    )


@router.delete("", response_model=ClearMemoryResponse)
async def clear_memories(user_id: str = Depends(require_authenticated_user)):
    """
    Clear all Memento conversational memory for the authenticated patient.
    """
    cleared = await memory_service.clear_memories(user_id)

    return ClearMemoryResponse(
        status="success",
        message="Patient memory cleared successfully.",
        cleared_count=cleared
    )
