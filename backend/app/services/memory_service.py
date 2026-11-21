from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime
from backend.app.core.config import settings
from backend.app.database.supabase_client import get_supabase_admin_client, get_supabase_client
from backend.app.schemas.memory import MemoryItem

logger = logging.getLogger(__name__)


class IMemoryAdapter(ABC):
    """
    Clean memory adapter interface as specified by the CareGuide AI project architecture:
    - Maintains patient conversational continuity
    - Isolates data strictly per user_id
    - Supports explicit disabling and clearing of memory
    - Avoids storing sensitive clinical inferences
    """

    @abstractmethod
    async def get_user_context(self, user_id: str) -> Dict[str, Any]:
        """Retrieve patient conversational memory, previously discussed topics, and preferences."""
        pass

    @abstractmethod
    async def record_topic(self, user_id: str, topic: str, summary: str, category: str = "general") -> None:
        """Record a discussed healthcare topic and brief non-sensitive educational summary."""
        pass

    @abstractmethod
    async def get_memories(self, user_id: str) -> List[MemoryItem]:
        """List all active persistent memories for this user."""
        pass

    @abstractmethod
    async def clear_memories(self, user_id: str) -> int:
        """Clear all persistent memory records for this user."""
        pass

    @abstractmethod
    async def is_memory_enabled(self, user_id: str) -> bool:
        """Check if memory retention is enabled for this user."""
        pass

    @abstractmethod
    async def set_memory_enabled(self, user_id: str, enabled: bool) -> None:
        """Enable or disable memory retention."""
        pass


class MementoMemoryAdapter(IMemoryAdapter):
    """
    Memento-compatible persistent memory adapter.
    Uses Supabase PostgreSQL patient_memories & user_preferences tables as the robust backend,
    with an extensible hook for external Memento API / MCP instances when configured.
    """

    def __init__(self):
        self.storage_mode = settings.MEMENTO_MEMORY_STORE
        logger.info(f"MementoMemoryAdapter initialized using storage engine: {self.storage_mode}")
        # In-memory storage cache for resilient offline and test operations
        self._local_memories: Dict[str, List[Dict[str, Any]]] = {}
        self._memory_enabled_status: Dict[str, bool] = {}

    async def is_memory_enabled(self, user_id: str) -> bool:
        if user_id in self._memory_enabled_status:
            return self._memory_enabled_status[user_id]

        client = get_supabase_client()
        if client:
            try:
                res = client.table("profiles").select("memory_enabled").eq("user_id", user_id).execute()
                if res.data and len(res.data) > 0:
                    enabled = res.data[0].get("memory_enabled", True)
                    self._memory_enabled_status[user_id] = enabled
                    return enabled
            except Exception as e:
                logger.warning(f"Error checking profile memory_enabled in Supabase: {e}")

        # Default to True
        return True

    async def set_memory_enabled(self, user_id: str, enabled: bool) -> None:
        self._memory_enabled_status[user_id] = enabled
        client = get_supabase_admin_client() or get_supabase_client()
        if client:
            try:
                client.table("profiles").update({"memory_enabled": enabled}).eq("user_id", user_id).execute()
            except Exception as e:
                logger.warning(f"Could not update memory_enabled in Supabase: {e}")

    async def record_topic(self, user_id: str, topic: str, summary: str, category: str = "general") -> None:
        if not await self.is_memory_enabled(user_id):
            return

        clean_topic = topic.strip()
        clean_summary = summary.strip()
        now_iso = datetime.utcnow().isoformat()

        # Update in local cache
        if user_id not in self._local_memories:
            self._local_memories[user_id] = []

        # Avoid redundant topics; update timestamp if existing
        existing = next((m for m in self._local_memories[user_id] if m["topic"].lower() == clean_topic.lower()), None)
        if existing:
            existing["summary"] = clean_summary
            existing["last_discussed_at"] = now_iso
        else:
            import uuid
            self._local_memories[user_id].append({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "topic": clean_topic,
                "summary": clean_summary,
                "category": category,
                "last_discussed_at": now_iso,
                "created_at": now_iso
            })

        # Persist to Supabase if available
        client = get_supabase_admin_client() or get_supabase_client()
        if client:
            try:
                client.table("patient_memories").upsert({
                    "user_id": user_id,
                    "topic": clean_topic,
                    "summary": clean_summary,
                    "category": category,
                    "last_discussed_at": now_iso
                }, on_conflict="user_id, topic").execute()
            except Exception as e:
                logger.debug(f"Supabase upsert into patient_memories: {e}")

    async def get_memories(self, user_id: str) -> List[MemoryItem]:
        enabled = await self.is_memory_enabled(user_id)
        if not enabled:
            return []

        # Check Supabase first
        client = get_supabase_admin_client() or get_supabase_client()
        if client:
            try:
                res = client.table("patient_memories").select("*").eq("user_id", user_id).order("last_discussed_at", desc=True).execute()
                if res.data:
                    return [
                        MemoryItem(
                            id=str(row.get("id")),
                            user_id=str(row.get("user_id")),
                            topic=row.get("topic", ""),
                            summary=row.get("summary", ""),
                            category=row.get("category", "general"),
                            last_discussed_at=str(row.get("last_discussed_at", "")),
                            created_at=str(row.get("created_at", ""))
                        )
                        for row in res.data
                    ]
            except Exception as e:
                logger.debug(f"Supabase query patient_memories: {e}")

        # Local cache fallback
        user_list = self._local_memories.get(user_id, [])
        return [
            MemoryItem(
                id=m["id"],
                user_id=m["user_id"],
                topic=m["topic"],
                summary=m["summary"],
                category=m.get("category", "general"),
                last_discussed_at=m["last_discussed_at"],
                created_at=m.get("created_at", m["last_discussed_at"])
            )
            for m in user_list
        ]

    async def get_user_context(self, user_id: str) -> Dict[str, Any]:
        """
        Produce a concise context summary for Gemini prompt conditioning.
        """
        enabled = await self.is_memory_enabled(user_id)
        if not enabled:
            return {"memory_enabled": False, "topics": [], "context_summary": ""}

        memories = await self.get_memories(user_id)
        topics = [m.topic for m in memories]
        summaries = [f"- {m.topic}: {m.summary}" for m in memories[:5]]

        context_str = "\n".join(summaries) if summaries else "No prior healthcare topics recorded."

        return {
            "memory_enabled": True,
            "topics": topics,
            "context_summary": context_str
        }

    async def clear_memories(self, user_id: str) -> int:
        count = len(self._local_memories.get(user_id, []))
        self._local_memories[user_id] = []

        client = get_supabase_admin_client() or get_supabase_client()
        if client:
            try:
                res = client.table("patient_memories").delete().eq("user_id", user_id).execute()
                if res.data:
                    count = max(count, len(res.data))
            except Exception as e:
                logger.warning(f"Error clearing Supabase patient_memories: {e}")

        return count


# Singleton memory service instance
memory_service: IMemoryAdapter = MementoMemoryAdapter()
