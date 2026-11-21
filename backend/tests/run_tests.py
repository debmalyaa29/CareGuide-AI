import os
import sys
import asyncio

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import httpx
from backend.app.main import app

async def run_all_checks():
    print("Initializing test runner with ASGITransport...", flush=True)
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        print("1. Testing GET /health...", flush=True)
        r = await client.get("/health")
        assert r.status_code == 200, f"Health check failed: {r.status_code}"
        data = r.json()
        print("   Health check passed! Status:", data["status"], flush=True)

        print("2. Testing POST /api/chat (Simple Diabetes Query)...", flush=True)
        r = await client.post("/api/chat", json={
            "message": "What is Type 2 Diabetes? Can you explain it simply?",
            "explanation_style": "simple",
            "response_length": "medium"
        })
        assert r.status_code == 200, f"Chat failed: {r.status_code} - {r.text}"
        chat_data = r.json()
        print("   Chat response received!", flush=True)
        print("   - Reply snippet:", chat_data["reply"][:80], "...", flush=True)
        print("   - Citations count:", len(chat_data["citations"]), flush=True)
        print("   - Medical terms:", [t["term"] for t in chat_data["medical_terms"]], flush=True)
        print("   - Follow ups:", chat_data["suggested_follow_ups"], flush=True)

        print("3. Testing Safety Guardrails (Emergency Symptom)...", flush=True)
        r = await client.post("/api/chat", json={
            "message": "I have sudden severe chest pain and cannot breathe",
            "explanation_style": "simple"
        })
        assert r.status_code == 200
        emerg_data = r.json()
        assert emerg_data["is_emergency"] is True, "Emergency not flagged"
        print("   Emergency successfully detected! Notice:", emerg_data["emergency_notice"][:60], "...", flush=True)

        print("4. Testing Memento Persistent Memory...", flush=True)
        r = await client.get("/api/memory")
        assert r.status_code == 200
        mem_data = r.json()
        print("   Tracked topics in memory:", mem_data["topics"], flush=True)
        assert len(mem_data["topics"]) > 0, "No topics recorded in memory"

        r = await client.delete("/api/memory")
        assert r.status_code == 200
        print("   Memory cleared. Deleted records:", r.json()["cleared_count"], flush=True)

        print("5. Testing Healthcare Sources & Ingestion Allowlist...", flush=True)
        r = await client.get("/api/sources")
        assert r.status_code == 200
        sources_data = r.json()
        print("   Total indexed documents:", sources_data["total_documents"], flush=True)
        print("   Allowed domains:", sources_data["allowed_domains"], flush=True)

        bad_crawl = await client.post("/api/ingestion/crawl", json={"url": "https://untrusted-blog.xyz/article"})
        assert bad_crawl.status_code == 400
        print("   Successfully blocked non-allowlisted domain!", flush=True)

        print("6. Testing Patient Preferences...", flush=True)
        r = await client.put("/api/preferences", json={
            "preferred_explanation_style": "technical",
            "preferred_response_length": "short",
            "memory_enabled": True
        })
        assert r.status_code == 200
        pref_data = r.json()
        assert pref_data["preferred_explanation_style"] == "technical"
        print("   Preferences updated successfully to:", pref_data, flush=True)

    print("\nALL BACKEND INTEGRATION TESTS PASSED PERFECTLY!", flush=True)

if __name__ == "__main__":
    asyncio.run(run_all_checks())
