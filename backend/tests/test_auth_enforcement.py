import os
import sys
import asyncio

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import httpx
from backend.app.main import app

async def test_auth_enforcement():
    print("Testing backend endpoint authentication enforcement...", flush=True)
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # 1. Unauthenticated requests should be rejected with 401
        print("1. Testing unauthenticated POST /api/chat -> Expected 401...", flush=True)
        r = await client.post("/api/chat", json={"message": "What is diabetes?"})
        assert r.status_code == 401, f"Expected 401, got {r.status_code}"
        assert "Authentication required" in r.json()["detail"]
        print("   ✓ Rejected unauthenticated chat request with HTTP 401", flush=True)

        print("2. Testing unauthenticated GET /api/conversations -> Expected 401...", flush=True)
        r = await client.get("/api/conversations")
        assert r.status_code == 401, f"Expected 401, got {r.status_code}"
        print("   ✓ Rejected unauthenticated conversations request with HTTP 401", flush=True)

        print("3. Testing unauthenticated GET /api/preferences -> Expected 401...", flush=True)
        r = await client.get("/api/preferences")
        assert r.status_code == 401, f"Expected 401, got {r.status_code}"
        print("   ✓ Rejected unauthenticated preferences request with HTTP 401", flush=True)

        print("4. Testing unauthenticated GET /api/memory -> Expected 401...", flush=True)
        r = await client.get("/api/memory")
        assert r.status_code == 401, f"Expected 401, got {r.status_code}"
        print("   ✓ Rejected unauthenticated memory request with HTTP 401", flush=True)

        print("5. Testing unauthenticated POST /api/ingestion/crawl -> Expected 401...", flush=True)
        r = await client.post("/api/ingestion/crawl", json={"url": "https://www.who.int"})
        assert r.status_code == 401, f"Expected 401, got {r.status_code}"
        print("   ✓ Rejected unauthenticated crawl request with HTTP 401", flush=True)

        # 6. Public endpoints should remain accessible
        print("6. Testing public GET /health -> Expected 200...", flush=True)
        r = await client.get("/health")
        assert r.status_code == 200
        print("   ✓ Public health endpoint is accessible without login", flush=True)

        print("7. Testing public GET /api/sources -> Expected 200...", flush=True)
        r = await client.get("/api/sources")
        assert r.status_code == 200
        print("   ✓ Public sources catalog is accessible without login", flush=True)

        # 8. Authenticated request with Bearer token should succeed
        print("8. Testing authenticated POST /api/chat with Bearer token -> Expected 200...", flush=True)
        auth_headers = {"Authorization": "Bearer demo-session-token"}
        r = await client.post("/api/chat", json={"message": "What is diabetes?"}, headers=auth_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        print("   ✓ Authenticated chat request succeeded with HTTP 200", flush=True)

        print("9. Testing authenticated GET /api/preferences -> Expected 200...", flush=True)
        r = await client.get("/api/preferences", headers=auth_headers)
        assert r.status_code == 200
        print("   ✓ Authenticated preferences request succeeded with HTTP 200", flush=True)

        print("10. Testing authenticated GET /api/memory -> Expected 200...", flush=True)
        r = await client.get("/api/memory", headers=auth_headers)
        assert r.status_code == 200
        print("   ✓ Authenticated memory request succeeded with HTTP 200", flush=True)

    print("\nALL AUTHENTICATION ENFORCEMENT CHECKS PASSED!", flush=True)

if __name__ == "__main__":
    asyncio.run(test_auth_enforcement())
