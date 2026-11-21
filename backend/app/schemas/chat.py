from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class Citation(BaseModel):
    title: str
    url: str
    domain: str
    snippet: Optional[str] = None


class MedicalTermDefinition(BaseModel):
    term: str
    definition: str


class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    conversation_id: Optional[str] = None
    explanation_style: Optional[str] = Field("simple", pattern="^(simple|detailed|technical)$")
    response_length: Optional[str] = Field("medium", pattern="^(short|medium|long)$")


class ChatResponse(BaseModel):
    conversation_id: str
    user_message_id: str
    assistant_message_id: str
    reply: str
    citations: List[Citation] = []
    medical_terms: List[MedicalTermDefinition] = []
    suggested_follow_ups: List[str] = []
    is_emergency: bool = False
    emergency_notice: Optional[str] = None
    explanation_style: str
    retrieved_chunk_count: int = 0
    created_at: datetime


class MessageItem(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    citations: List[Citation] = []
    medical_terms: List[MedicalTermDefinition] = []
    suggested_follow_ups: List[str] = []
    is_emergency: bool = False
    created_at: str


class ConversationItem(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    message_count: Optional[int] = 0
