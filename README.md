# CareGuide AI – Patient Information Companion

CareGuide AI is a production-minded Generative AI healthcare education platform that helps patients understand publicly available healthcare information through simple, personalized explanations.

> **Strict Healthcare Safety Notice:** CareGuide AI is strictly for general health education. It does NOT provide individual medical diagnoses, emergency care, or prescription medication advice.

---

## Key Highlights

- **Verified Public Sources Only:** Information is collected via Firecrawl exclusively from trusted healthcare authorities (`who.int`, `cdc.gov`, `nhs.uk`, `medlineplus.gov`).
- **Semantic RAG with pgvector:** High-speed cosine distance similarity search using Google's `text-embedding-004` and Supabase PostgreSQL with `pgvector`.
- **Google Gemini Personalized Explanations:** Explanations dynamically adapt to patient preferences:
  - **Simple:** Everyday words, helpful analogies, 6th-grade reading level.
  - **Detailed:** Comprehensive overview, symptoms, and questions to ask your doctor.
  - **Technical:** Precise clinical metrics, pathophysiology, and formal medical terms.
- **Memento Persistent Memory:** Remembers previously discussed topics and explanation preferences across sessions with strict patient isolation and one-click clear controls.
- **Transparent Citations:** Every answer links directly to verified medical publications from WHO, CDC, NHS, and MedlinePlus.
- **Acute Emergency Guardrails:** Detects acute red-flag symptoms (e.g. crushing chest pain, difficulty breathing, stroke indicators) and immediately directs patients to emergency services (911 / 999 / 112).
- **Medical Terms Simplified:** Automatically extracts complex jargon and renders plain-English definition cards in the chat UI.

---

## Technology Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide React icons
- **Backend:** Python 3.10, FastAPI, Pydantic, Uvicorn, HTTPX
- **GenAI & Embeddings:** Google Gemini API (`gemini-1.5-flash`), Google `text-embedding-004`
- **Web Extraction:** Firecrawl Python SDK (`firecrawl-py`) with strict domain allowlist
- **Persistent Memory:** Memento Memory Adapter architecture
- **Database & Auth:** Supabase PostgreSQL with `pgvector` & Supabase Authentication

---

## Project Structure

```
SEM_5_GENAI_PROJECT/
├── frontend/                   # Next.js 14 App Router Frontend
│   ├── app/
│   │   ├── layout.tsx          # Root Layout with Navbar & Footer
│   │   ├── page.tsx            # Healthcare Landing Page
│   │   ├── login/page.tsx      # Sign In (Supabase + Guest Demo)
│   │   ├── signup/page.tsx     # Sign Up
│   │   ├── dashboard/page.tsx  # Patient Dashboard
│   │   ├── chat/page.tsx       # AI Chat Companion Interface
│   │   ├── preferences/page.tsx# Explanation Style & Memento Memory Controls
│   │   └── sources/page.tsx    # Knowledge Base & Firecrawl Ingestion Tester
│   ├── components/             # Reusable UI Components (Navbar, Footer)
│   ├── lib/                    # Supabase client & Backend API SDK
│   ├── types/                  # TypeScript Data Models
│   ├── package.json
│   └── tailwind.config.js
│
├── backend/                    # FastAPI Backend Service
│   ├── app/
│   │   ├── main.py             # FastAPI App Entrypoint & CORS
│   │   ├── api/
│   │   │   ├── chat.py         # POST /api/chat, GET/DELETE /api/conversations
│   │   │   ├── preferences.py  # GET/PUT /api/preferences
│   │   │   ├── memory.py       # GET/DELETE /api/memory
│   │   │   ├── ingestion.py    # POST /api/ingestion/crawl, GET /api/sources
│   │   │   └── health.py       # GET /health System Diagnostics
│   │   ├── core/
│   │   │   └── config.py       # Pydantic Settings & Domain Allowlist
│   │   ├── database/
│   │   │   └── supabase_client.py # Supabase & pgvector Client
│   │   ├── schemas/            # Pydantic Request/Response Models
│   │   └── services/
│   │       ├── gemini_service.py    # Gemini Prompt Engineering & Safety
│   │       ├── rag_service.py       # Chunking & Semantic Search
│   │       ├── embedding_service.py # Google text-embedding-004
│   │       ├── firecrawl_service.py # Firecrawl Trusted Web Scraper
│   │       └── memory_service.py    # Memento Memory Adapter
│   ├── requirements.txt
│   ├── tests/
│   │   └── run_tests.py        # Comprehensive Integration Test Suite
│   └── .env.example
│
├── database/
│   └── migrations/
│       └── 001_initial_schema.sql # Complete Supabase pgvector Migration
│
├── docs/
│   ├── architecture.md         # Architecture Diagrams & Flowcharts
│   └── setup.md                # Step-by-Step Local & Deployment Guide
│
└── README.md
```

---

## Quick Start (Local Setup)

### 1. Run the Backend (FastAPI)
```bash
# In backend directory
pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --port 8000 --reload
```
API Documentation will be available at: `http://localhost:8000/docs`

### 2. Run Backend Integration Tests
```bash
python backend/tests/run_tests.py
```

### 3. Run the Frontend (Next.js)
```bash
# In frontend directory
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to interact with CareGuide AI.

---

## License

This project is created for educational and academic Generative AI development purposes.
