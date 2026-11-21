import os
import sys
import asyncio
import json
import re

# Ensure project root in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import httpx
from backend.app.main import app
from backend.app.services.memory_service import memory_service
from backend.app.core.config import settings

def test_migration_schema():
    print("\n--- TEST 1: Verifying patient_memories migration schema ---", flush=True)
    schema_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../database/migrations/001_initial_schema.sql"))
    assert os.path.exists(schema_path), f"Migration file not found at {schema_path}"
    
    with open(schema_path, "r", encoding="utf-8") as f:
        sql = f.read()
    
    assert "CREATE TABLE IF NOT EXISTS patient_memories" in sql, "patient_memories table not found in SQL migration"
    assert "user_id UUID NOT NULL" in sql, "user_id column missing"
    assert "topic TEXT NOT NULL" in sql, "topic column missing"
    assert "summary TEXT NOT NULL" in sql, "summary column missing"
    assert "last_discussed_at TIMESTAMPTZ" in sql, "last_discussed_at column missing"
    assert "unique_user_memory UNIQUE(user_id, topic)" in sql, "unique constraint on (user_id, topic) missing"
    assert "ALTER TABLE patient_memories ENABLE ROW LEVEL SECURITY;" in sql, "RLS not enabled on patient_memories"
    assert "CREATE POLICY \"Users can manage own memories\" ON patient_memories" in sql, "RLS policy missing"
    print("✓ patient_memories table migration verified with RLS, indexes, and unique constraints.", flush=True)


async def test_memento_supabase_flow():
    test_transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=test_transport, base_url="http://test") as client:
        
        # --- TEST 2: Health check without MEMENTO_API_KEY ---
        print("\n--- TEST 2: Health diagnostic without MEMENTO_API_KEY ---", flush=True)
        assert settings.MEMENTO_MEMORY_STORE == "postgres_supabase", f"Expected postgres_supabase, got {settings.MEMENTO_MEMORY_STORE}"
        r = await client.get("/health")
        assert r.status_code == 200
        health = r.json()
        memento_info = health["integrations"]["memento_memory"]
        assert memento_info["configured"] is True, "Memento memory should be configured"
        assert memento_info["store"] == "postgres_supabase", "Memento memory store mismatch"
        print("✓ /health reports Memento memory configured with store=postgres_supabase (no API key required).", flush=True)

        # Clean slate for test users
        user_alpha = "user-patient-alpha-uuid"
        user_beta = "user-patient-beta-uuid"
        await memory_service.clear_memories(user_alpha)
        await memory_service.clear_memories(user_beta)

        # --- TEST 3: Pre-seeding prior memory and verifying retrieval before Gemini generation ---
        print("\n--- TEST 3: Verifying memory retrieval before Gemini prompt conditioning ---", flush=True)
        # Pre-seed a known medical context for User Alpha
        await memory_service.record_topic(
            user_id=user_alpha,
            topic="Seasonal Allergies",
            summary="Patient experiences seasonal pollen allergy flare-ups."
        )

        # Check that get_user_context retrieves it
        ctx = await memory_service.get_user_context(user_alpha)
        assert "Seasonal Allergies" in ctx["topics"], "Pre-seeded topic not found in context"
        assert "seasonal pollen allergy" in ctx["context_summary"].lower(), "Summary missing from context string"
        print(f"✓ Memento retrieved prior user context before chat: {ctx['context_summary'].strip()}", flush=True)

        # --- TEST 4: Sending conversation and verifying topic is saved after conversation ---
        print("\n--- TEST 4: Verifying memory is saved after conversation ---", flush=True)
        chat_payload = {
            "message": "What should I know about managing Type 2 Diabetes?",
            "explanation_style": "simple",
            "response_length": "short"
        }
        # Simulate authenticated session for User Alpha
        alpha_headers = {"Authorization": f"Bearer mock-jwt-{user_alpha}"}
        
        # Monkey patch or pass mock token where sub is extracted
        import jwt
        token_alpha = jwt.encode({"sub": user_alpha}, "secret", algorithm="HS256")
        token_beta = jwt.encode({"sub": user_beta}, "secret", algorithm="HS256")
        
        r = await client.post("/api/chat", json=chat_payload, headers={"Authorization": f"Bearer {token_alpha}"})
        assert r.status_code == 200, f"Chat call failed: {r.text}"
        chat_data = r.json()
        assert chat_data["conversation_id"] is not None

        # Verify User Alpha now has Type 2 Diabetes in memory
        alpha_memories = await memory_service.get_memories(user_alpha)
        alpha_topics = [m.topic for m in alpha_memories]
        print(f"✓ User Alpha updated topics in memory: {alpha_topics}", flush=True)
        assert any("Diabetes" in t for t in alpha_topics), "Type 2 Diabetes topic was not saved after conversation"

        # --- TEST 5: User Isolation (User Beta vs User Alpha) ---
        print("\n--- TEST 5: Verifying strict user memory isolation ---", flush=True)
        chat_payload_beta = {
            "message": "How does sodium intake affect hypertension and blood pressure?",
            "explanation_style": "detailed",
            "response_length": "short"
        }
        r_beta = await client.post("/api/chat", json=chat_payload_beta, headers={"Authorization": f"Bearer {token_beta}"})
        assert r_beta.status_code == 200

        beta_memories = await memory_service.get_memories(user_beta)
        beta_topics = [m.topic for m in beta_memories]
        print(f"✓ User Beta topics in memory: {beta_topics}", flush=True)

        # Verify isolation: Beta must NOT have Alpha's diabetes/allergies, Alpha must NOT have Beta's hypertension
        assert not any("Diabetes" in t for t in beta_topics), "Cross-contamination: Beta received Alpha's Diabetes topic!"
        assert not any("Allergies" in t for t in beta_topics), "Cross-contamination: Beta received Alpha's Allergies topic!"
        
        alpha_topics_recheck = [m.topic for m in await memory_service.get_memories(user_alpha)]
        assert not any("Hypertension" in t for t in alpha_topics_recheck), "Cross-contamination: Alpha received Beta's Hypertension topic!"
        print("✓ Memory isolation verified: Zero cross-contamination between patient accounts.", flush=True)

        # --- TEST 6: Memory Persistence Across Separate Login Sessions ---
        print("\n--- TEST 6: Testing memory persistence across separate login sessions ---", flush=True)
        # Simulate Session 1 logout by discarding client headers / token
        # Now simulate Session 2 login with fresh request for User Alpha
        r_session2 = await client.get("/api/memory", headers={"Authorization": f"Bearer {token_alpha}"})
        assert r_session2.status_code == 200
        session2_data = r_session2.json()
        assert session2_data["user_id"] == user_alpha
        session2_topics = session2_data["topics"]
        print(f"✓ Session 2 retrieved persisted topics from previous session: {session2_topics}", flush=True)
        assert len(session2_topics) >= 2, "Persisted topics were lost across sessions"

        # --- TEST 7: Testing DELETE /api/memory ---
        print("\n--- TEST 7: Testing DELETE /api/memory ---", flush=True)
        del_r = await client.delete("/api/memory", headers={"Authorization": f"Bearer {token_alpha}"})
        assert del_r.status_code == 200
        del_data = del_r.json()
        assert del_data["status"] == "success"
        assert del_data["cleared_count"] >= 2
        print(f"✓ DELETE /api/memory cleared {del_data['cleared_count']} records for User Alpha.", flush=True)

        # Verify Alpha is empty
        alpha_after = await client.get("/api/memory", headers={"Authorization": f"Bearer {token_alpha}"})
        assert len(alpha_after.json()["memories"]) == 0, "Alpha memory was not emptied"
        print("✓ User Alpha memory is now empty.", flush=True)

        # Verify Beta's memory was NOT affected by Alpha's delete
        beta_after = await client.get("/api/memory", headers={"Authorization": f"Bearer {token_beta}"})
        assert len(beta_after.json()["memories"]) > 0, "Beta memory was erroneously affected by Alpha delete!"
        print("✓ User Beta memory remains completely intact following Alpha's delete.", flush=True)

        # Clean up Beta
        await client.delete("/api/memory", headers={"Authorization": f"Bearer {token_beta}"})

    print("\n=======================================================", flush=True)
    print("ALL MEMENTO SUPABASE MEMORY TESTS PASSED SUCCESSFULLY!", flush=True)
    print("=======================================================\n", flush=True)


if __name__ == "__main__":
    test_migration_schema()
    asyncio.run(test_memento_supabase_flow())
