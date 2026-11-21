# CareGuide AI – Setup and Installation Guide

This guide walks you through setting up and running CareGuide AI locally or deploying to production on Vercel, Render, and Supabase.

---

## Prerequisites

- **Python 3.10+** (with `pip`)
- **Node.js 18+** (with `npm` or `pnpm`)
- **Git**
- Optional credentials for live external APIs:
  - Google Gemini API Key: [Google AI Studio](https://aistudio.google.com/)
  - Firecrawl API Key: [Firecrawl.dev](https://www.firecrawl.dev/)
  - Supabase Project: [Supabase.com](https://supabase.com/)

> **Note:** CareGuide AI is built with resilient offline and test fallbacks. If API keys are not yet provided, the backend automatically initializes verified seeded healthcare knowledge, local semantic cosine retrieval, and mock authentication so you can test all features immediately!

---

## 1. Database Setup (Supabase PostgreSQL + pgvector)

1. Create a new project in [Supabase](https://supabase.com/).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Open `database/migrations/001_initial_schema.sql` from this repository.
4. Copy and paste the SQL script into the Supabase SQL Editor and click **Run**.
5. This creates:
   - `vector` extension and `uuid-ossp`
   - `profiles`, `conversations`, `messages`
   - `health_documents`, `document_chunks` (with 768-dim vector embeddings and HNSW index)
   - `user_preferences`, `patient_memories`
   - `match_document_chunks` RPC semantic similarity function
   - Row Level Security (RLS) policies

---

## 2. Backend Setup (FastAPI)

1. Open a terminal in the project root:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Fill in your API keys in `backend/.env`:
   - `GEMINI_API_KEY`: Your Google AI Studio API key
   - `FIRECRAWL_API_KEY`: Your Firecrawl API key
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role key
5. Start the backend server:
   ```bash
   python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   The backend will be live at `http://localhost:8000`.
   Interactive Swagger documentation is available at `http://localhost:8000/docs`.

---

## 3. Frontend Setup (Next.js)

1. Open a new terminal in the project root:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Set:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 4. Running Backend Tests

Run the comprehensive integration test suite verifying health, RAG retrieval, citations, emergency guardrails, Memento memory, and domain allowlists:
```bash
python backend/tests/run_tests.py
```

---

## 5. Production Deployment

### Frontend (Vercel)
1. Push code to GitHub.
2. In Vercel, import the repository and set root directory to `frontend`.
3. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL` (your Render backend URL)
4. Deploy.

### Backend (Render)
1. Create a new **Web Service** on Render.
2. Connect your GitHub repository.
3. Configure:
   - **Root Directory**: `backend` (or root with Python environment)
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `python -m uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
4. Set environment variables in Render dashboard:
   - `GEMINI_API_KEY`
   - `FIRECRAWL_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CORS_ORIGINS` (your Vercel frontend URL)
5. Deploy.
