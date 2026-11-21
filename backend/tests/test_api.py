import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import unittest
from fastapi.testclient import TestClient
from backend.app.main import app

class TestCareGuideAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_health_check(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("integrations", data)
        self.assertIn("firecrawl", data["integrations"])
        self.assertIn("who.int", data["integrations"]["firecrawl"]["allowed_domains"])

    def test_02_chat_simple_explanation(self):
        payload = {
            "message": "What is Type 2 Diabetes? Can you explain it simply?",
            "explanation_style": "simple",
            "response_length": "medium"
        }
        response = self.client.post("/api/chat", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("reply", data)
        self.assertTrue(len(data["reply"]) > 50)
        self.assertIn("citations", data)
        self.assertEqual(data["explanation_style"], "simple")
        self.assertFalse(data["is_emergency"])
        self.assertTrue(len(data["suggested_follow_ups"]) > 0)

    def test_03_emergency_safety_guardrail(self):
        payload = {
            "message": "I have severe sudden chest pain and I cannot breathe",
            "explanation_style": "simple"
        }
        response = self.client.post("/api/chat", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["is_emergency"])
        self.assertIsNotNone(data["emergency_notice"])
        self.assertTrue("911" in data["emergency_notice"] or "emergency" in data["emergency_notice"].lower())

    def test_04_memento_memory_tracking_and_clear(self):
        chat_payload = {
            "message": "Tell me about managing hypertension and blood pressure.",
            "explanation_style": "detailed"
        }
        chat_res = self.client.post("/api/chat", json=chat_payload)
        self.assertEqual(chat_res.status_code, 200)

        mem_res = self.client.get("/api/memory")
        self.assertEqual(mem_res.status_code, 200)
        mem_data = mem_res.json()
        self.assertIn("topics", mem_data)
        self.assertTrue(len(mem_data["topics"]) > 0)

        del_res = self.client.delete("/api/memory")
        self.assertEqual(del_res.status_code, 200)
        self.assertEqual(del_res.json()["status"], "success")

        mem_after = self.client.get("/api/memory").json()
        self.assertEqual(len(mem_after["memories"]), 0)

    def test_05_trusted_sources_allowlist(self):
        sources_res = self.client.get("/api/sources")
        self.assertEqual(sources_res.status_code, 200)
        data = sources_res.json()
        self.assertGreaterEqual(data["total_documents"], 4)
        self.assertIn("nhs.uk", data["allowed_domains"])
        self.assertIn("who.int", data["allowed_domains"])

        bad_crawl = self.client.post("/api/ingestion/crawl", json={"url": "https://random-unverified-blog.xyz/health"})
        self.assertEqual(bad_crawl.status_code, 400)
        self.assertIn("Domain not permitted", bad_crawl.json()["detail"])

    def test_06_preferences_update(self):
        get_res = self.client.get("/api/preferences")
        self.assertEqual(get_res.status_code, 200)

        update_payload = {
            "preferred_explanation_style": "technical",
            "preferred_response_length": "short",
            "memory_enabled": True
        }
        put_res = self.client.put("/api/preferences", json=update_payload)
        self.assertEqual(put_res.status_code, 200)
        res_data = put_res.json()
        self.assertEqual(res_data["preferred_explanation_style"], "technical")
        self.assertEqual(res_data["preferred_response_length"], "short")


if __name__ == "__main__":
    unittest.main()
