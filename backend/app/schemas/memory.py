from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime


class MemoryItem(BaseModel):
    id: str
    user_id: str
    topic: str
    summary: str
    category: str = "general"
    last_discussed_at: str
    created_at: str


class MemoryListResponse(BaseModel):
    user_id: str
    memory_enabled: bool
    memories: List[MemoryItem]
    topics: List[str]


class ClearMemoryResponse(BaseModel):
    status: str
    message: str
    cleared_count: int
