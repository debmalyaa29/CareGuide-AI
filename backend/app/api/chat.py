import logging
import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Header, HTTPException, Query, Depends
from datetime import datetime

from backend.app.core.auth import require_authenticated_user
from backend.app.schemas.chat import (
    ChatMessageRequest,
    ChatResponse,
    ConversationItem,
    MessageItem,
    Citation,
    MedicalTermDefinition
)
from backend.app.services.rag_service import rag_service
from backend.app.services.gemini_service import gemini_service
from backend.app.services.memory_service import memory_service
from backend.app.database.supabase_client import get_supabase_client, get_supabase_admin_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Chat & Conversations"])

# In-memory storage fallback for local development / testing without active Supabase instance
_conversations_db: Dict[str, Dict[str, Any]] = {}
_messages_db: Dict[str, List[Dict[str, Any]]] = {}


def get_user_id_from_header(authorization: Optional[str] = Header(None)) -> str:
    """
    Deprecated helper: Use require_authenticated_user dependency.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "").strip()
        client = get_supabase_client()
        if client:
            try:
                user_res = client.auth.get_user(token)
                if user_res and user_res.user:
                    return str(user_res.user.id)
            except Exception:
                pass
        try:
            import jwt
            decoded = jwt.decode(token, options={"verify_signature": False})
            if "sub" in decoded:
                return str(decoded["sub"])
        except Exception:
            pass
    return "demo-patient-001"


@router.post("/chat", response_model=ChatResponse)
async def post_chat(
    req: ChatMessageRequest,
    user_id: str = Depends(require_authenticated_user)
):
    conv_id = req.conversation_id or str(uuid.uuid4())
    now_iso = datetime.utcnow().isoformat()

    # 1. Ensure conversation exists
    if conv_id not in _conversations_db:
        _conversations_db[conv_id] = {
            "id": conv_id,
            "user_id": user_id,
            "title": req.message[:45] + ("..." if len(req.message) > 45 else ""),
            "created_at": now_iso,
            "updated_at": now_iso
        }
        _messages_db[conv_id] = []

    # 2. Store user message
    user_msg_id = str(uuid.uuid4())
    user_msg_entry = {
        "id": user_msg_id,
        "conversation_id": conv_id,
        "role": "user",
        "content": req.message,
        "citations": [],
        "medical_terms": [],
        "suggested_follow_ups": [],
        "is_emergency": False,
        "created_at": now_iso
    }
    _messages_db[conv_id].append(user_msg_entry)

    # 3. RAG Retrieval from verified healthcare documents
    relevant_chunks = await rag_service.retrieve_relevant_chunks(
        query=req.message,
        limit=4,
        threshold=0.20
    )

    # 4. Generate Gemini grounded response
    history = [
        {"role": m["role"], "content": m["content"]}
        for m in _messages_db[conv_id][-6:]
    ]

    response = await gemini_service.generate_response(
        user_message=req.message,
        retrieved_chunks=relevant_chunks,
        user_id=user_id,
        conversation_id=conv_id,
        explanation_style=req.explanation_style or "simple",
        response_length=req.response_length or "medium",
        conversation_history=history
    )

    # 5. Store assistant message
    asst_msg_entry = {
        "id": response.assistant_message_id,
        "conversation_id": conv_id,
        "role": "assistant",
        "content": response.reply,
        "citations": [c.model_dump() for c in response.citations],
        "medical_terms": [t.model_dump() for t in response.medical_terms],
        "suggested_follow_ups": response.suggested_follow_ups,
        "is_emergency": response.is_emergency,
        "created_at": response.created_at.isoformat()
    }
    _messages_db[conv_id].append(asst_msg_entry)
    _conversations_db[conv_id]["updated_at"] = response.created_at.isoformat()

    # 6. Save to Supabase if available
    client = get_supabase_admin_client() or get_supabase_client()
    if client:
        try:
            client.table("conversations").upsert({
                "id": conv_id,
                "user_id": user_id,
                "title": _conversations_db[conv_id]["title"],
                "updated_at": response.created_at.isoformat()
            }).execute()

            client.table("messages").insert([
                {
                    "id": user_msg_id,
                    "conversation_id": conv_id,
                    "role": "user",
                    "content": req.message
                },
                {
                    "id": response.assistant_message_id,
                    "conversation_id": conv_id,
                    "role": "assistant",
                    "content": response.reply,
                    "citations": [c.model_dump() for c in response.citations],
                    "medical_terms": [t.model_dump() for t in response.medical_terms],
                    "suggested_follow_ups": response.suggested_follow_ups,
                    "is_emergency": response.is_emergency
                }
            ]).execute()
        except Exception as e:
            logger.debug(f"Supabase persistence error: {e}")

    return response


@router.get("/conversations", response_model=List[ConversationItem])
async def get_conversations(user_id: str = Depends(require_authenticated_user)):

    # Try Supabase first
    client = get_supabase_client()
    if client:
        try:
            res = client.table("conversations").select("*").eq("user_id", user_id).order("updated_at", desc=True).execute()
            if res.data:
                return [
                    ConversationItem(
                        id=str(row["id"]),
                        title=row.get("title", "Conversation"),
                        created_at=str(row.get("created_at", "")),
                        updated_at=str(row.get("updated_at", "")),
                        message_count=0
                    )
                    for row in res.data
                ]
        except Exception as e:
            logger.debug(f"Supabase get_conversations: {e}")

    # Fallback to local
    user_convs = [
        c for c in _conversations_db.values()
        if c.get("user_id") == user_id
    ]
    user_convs.sort(key=lambda x: x.get("updated_at", ""), reverse=True)

    return [
        ConversationItem(
            id=c["id"],
            title=c["title"],
            created_at=c["created_at"],
            updated_at=c["updated_at"],
            message_count=len(_messages_db.get(c["id"], []))
        )
        for c in user_convs
    ]


@router.get("/conversations/{conversation_id}", response_model=List[MessageItem])
async def get_conversation_messages(
    conversation_id: str,
    user_id: str = Depends(require_authenticated_user)
):

    # Supabase check
    client = get_supabase_client()
    if client:
        try:
            res = client.table("messages").select("*").eq("conversation_id", conversation_id).order("created_at", asc=True).execute()
            if res.data:
                return [
                    MessageItem(
                        id=str(m["id"]),
                        conversation_id=str(m["conversation_id"]),
                        role=m["role"],
                        content=m["content"],
                        citations=[Citation(**c) for c in m.get("citations", [])],
                        medical_terms=[MedicalTermDefinition(**t) for t in m.get("medical_terms", [])],
                        suggested_follow_ups=m.get("suggested_follow_ups", []),
                        is_emergency=m.get("is_emergency", False),
                        created_at=str(m.get("created_at", ""))
                    )
                    for m in res.data
                ]
        except Exception as e:
            logger.debug(f"Supabase get_conversation_messages: {e}")

    messages = _messages_db.get(conversation_id, [])
    return [
        MessageItem(
            id=m["id"],
            conversation_id=m["conversation_id"],
            role=m["role"],
            content=m["content"],
            citations=[Citation(**c) for c in m.get("citations", [])],
            medical_terms=[MedicalTermDefinition(**t) for t in m.get("medical_terms", [])],
            suggested_follow_ups=m.get("suggested_follow_ups", []),
            is_emergency=m.get("is_emergency", False),
            created_at=m.get("created_at", "")
        )
        for m in messages
    ]


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user_id: str = Depends(require_authenticated_user)
):

    if conversation_id in _conversations_db:
        del _conversations_db[conversation_id]
    if conversation_id in _messages_db:
        del _messages_db[conversation_id]

    client = get_supabase_admin_client() or get_supabase_client()
    if client:
        try:
            client.table("conversations").delete().eq("id", conversation_id).execute()
        except Exception as e:
            logger.debug(f"Supabase delete conversation: {e}")

    return {"status": "success", "message": f"Conversation {conversation_id} deleted."}
