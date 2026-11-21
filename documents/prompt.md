# MASTER PROJECT PROMPT: CareGuide AI – Patient Information Companion

Act as a senior full-stack developer, AI/ML engineer, GenAI architect, and UI/UX designer.

Your task is to design and develop a complete, production-minded Generative AI application named **CareGuide AI – Patient Information Companion**.

This is a healthcare education assistant that helps patients understand publicly available healthcare information through simple, personalized, AI-generated explanations.

IMPORTANT: Build a fully functional application with real backend integrations. Do not create a static UI, fake chatbot, hardcoded AI responses, or simulated database operations.

---

# 1. PROJECT OBJECTIVE

Build an AI-powered healthcare information companion that:

1. Collects healthcare information from trusted public healthcare websites using Firecrawl.
2. Uses Retrieval-Augmented Generation (RAG) to retrieve relevant information.
3. Uses Google Gemini API to generate understandable healthcare explanations.
4. Uses Memento for persistent conversational memory and patient preferences.
5. Provides citations and links to the original healthcare sources.
6. Maintains conversation continuity across multiple sessions.
7. Personalizes explanations based on the patient's preferred explanation style and previously requested topics.

The application is strictly for general healthcare education, NOT medical diagnosis, emergency treatment, or prescribing medication.

# 2. TECHNOLOGY STACK

Use the following technology stack.

Frontend:
- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Lucide React icons

Backend:
- Python
- FastAPI
- Pydantic
- REST APIs

Generative AI:
- Google Gemini API
- LangChain for AI orchestration where useful
- Retrieval-Augmented Generation (RAG)

Information collection:
- Firecrawl Python SDK
- Restrict ingestion to trusted healthcare domains.

Memory:
- Memento persistent memory integration.
- First identify the exact Memento product/SDK intended by the project requirements.
- Consult its official documentation before implementing.
- Do not invent APIs, SDK methods, or integration behavior.
- If the exact Memento implementation cannot be established, create a clean memory adapter interface and document what configuration is required.

Database:
- Supabase PostgreSQL
- pgvector for vector similarity search
- Supabase Authentication

Embeddings:
- Google embedding model compatible with the selected Gemini API.
- Keep the embedding model configurable.

Deployment:
- Frontend: Vercel
- Backend: Render
- Database and authentication: Supabase

Version control:
- Git and GitHub

# 3. APPLICATION DESIGN AND USER EXPERIENCE

Create a premium, modern, clean healthcare SaaS interface.

Design direction:
- Light theme.
- White and soft ivory backgrounds.
- Soft blue and teal accents.
- Clean typography.
- Rounded corners.
- Subtle shadows.
- Professional spacing.
- Minimal gradients.
- Smooth animations.
- Responsive layouts.

Avoid:
- Dark backgrounds.
- Excessive gradients.
- Overly colorful dashboards.
- Unnecessary cards.
- Cluttered layouts.
- Generic AI-generated-looking interfaces.

The application should feel like a professional healthcare technology product.

# 4. REQUIRED FRONTEND PAGES

A. Landing Page

Create an attractive landing page containing:

- CareGuide AI branding.
- Navigation bar.
- Hero section with headline:
  "Understand Your Health, One Conversation at a Time."
- Supporting description.
- Get Started button.
- How It Works section.
- Key Features section.
- Trusted Healthcare Information section.
- Privacy and Safety section.
- Footer.

B. Authentication

Implement:
- Sign up.
- Login.
- Logout.
- Supabase authentication.
- Protected dashboard routes.

C. Patient Dashboard

Create a dashboard containing:
- Welcome message.
- AI assistant introduction.
- Start New Conversation.
- Recent Conversations.
- Previously Discussed Topics.
- Patient explanation preferences.
- Quick healthcare topic suggestions.

D. AI Chat Interface

This is the most important component.

Implement:
- Modern conversational interface.
- Message input.
- Send button.
- Loading indicator.
- Streaming responses if supported by the selected backend implementation.
- Conversation history.
- New conversation button.
- Source citations.
- Suggested follow-up questions.
- Clear conversation option.

The chat interface should feel similar to modern AI assistants.

E. Patient Preferences

Allow users to configure:
- Preferred explanation style: Simple, Detailed, Technical.
- Preferred response length: Short, Medium, Long.
- Previously discussed topics.
- Memory preferences.
- Clear or disable persistent memory.

# 5. CORE AI FUNCTIONALITY

Implement the following backend pipeline.

STEP 1: USER QUESTION

The patient asks a healthcare-related question.

Example:
"What is diabetes? Explain it in simple language."

STEP 2: QUESTION PROCESSING

The FastAPI backend receives the question and identifies its context.

Retrieve relevant patient preferences and previous conversation context from Memento.

STEP 3: INFORMATION RETRIEVAL USING FIRECRAWL

Use Firecrawl to collect healthcare information from trusted public websites.

Initial trusted source allowlist:
- who.int
- cdc.gov
- nhs.uk
- medlineplus.gov

Important:
- Do not scrape arbitrary websites.
- Preserve source URLs.
- Extract page titles and relevant text.
- Handle failed requests and rate limits.
- Do not scrape the entire web on every chat request.
- Implement a separate ingestion workflow that collects and indexes healthcare documents.
- Allow controlled updates to the knowledge base.

STEP 4: DOCUMENT PROCESSING

Implement:
- Text cleaning.
- Document chunking.
- Metadata extraction.
- Source URL preservation.
- Embedding generation.

Store the chunks and embeddings in Supabase PostgreSQL with pgvector.

Each document chunk should preserve:
- Document ID.
- Source title.
- Original URL.
- Publication or update date when available.
- Relevant metadata.

STEP 5: RAG RETRIEVAL

When a user asks a question:
- Convert the question into an embedding.
- Search relevant document chunks using pgvector.
- Retrieve the most relevant information.
- Pass the retrieved information to Gemini.

STEP 6: GEMINI RESPONSE GENERATION

Use Gemini API to generate:
- Easy-to-understand explanations.
- Clear definitions of medical terminology.
- Structured responses.
- Important precautions where supported by sources.
- References to retrieved documents.

The response should be personalized using the user's selected explanation style and relevant memory.

STEP 7: SOURCE ATTRIBUTION

Display the sources used for the answer.

Every citation must correspond to an actual retrieved document.

Never fabricate:
- Medical references.
- Source URLs.
- Research papers.
- Medical statistics.
- Clinical recommendations.

STEP 8: MEMORY STORAGE

Use Memento to maintain useful long-term conversational context.

Examples:
- Previously discussed healthcare topics.
- Preferred explanation style.
- Relevant learning preferences.

Memory requirements:
- Keep information associated with the correct authenticated user.
- Respect user consent.
- Do not store unnecessary sensitive medical information.
- Do not infer or retain diagnoses from ordinary conversations.
- Provide memory controls.
- Allow users to clear their stored memory.
- Do not use one patient's memory in another patient's conversation.

# 6. HEALTHCARE SAFETY

This is an educational application.

Implement the following safeguards:

1. Clearly communicate that the assistant does not replace a qualified healthcare professional.
2. Do not diagnose medical conditions.
3. Do not prescribe medicines or dosages.
4. Do not generate unsupported treatment recommendations.
5. If a question requires professional medical advice, recommend consulting a qualified healthcare professional.
6. For potential emergencies, advise contacting local emergency services immediately.
7. Keep medical explanations grounded in retrieved trusted sources.
8. Clearly indicate when sufficient reliable information is unavailable.
9. Do not claim that retrieved content has been medically verified when it has not.
10. Protect patient data and implement appropriate access controls.

# 7. DATABASE DESIGN

Create the necessary database tables.

Suggested tables:

1. profiles
   - id
   - user_id
   - preferred_explanation_style
   - preferred_response_length
   - created_at

2. conversations
   - id
   - user_id
   - title
   - created_at
   - updated_at

3. messages
   - id
   - conversation_id
   - role
   - content
   - created_at

4. health_documents
   - id
   - title
   - source_url
   - source_domain
   - metadata
   - created_at

5. document_chunks
   - id
   - document_id
   - chunk_text
   - embedding
   - metadata

6. user_preferences
   - id
   - user_id
   - preference_key
   - preference_value

Implement appropriate:
- Foreign keys.
- Indexes.
- Row Level Security (RLS).
- User-level access restrictions.
- Vector indexes.

Memento should manage its own memory storage according to its actual supported integration. Do not duplicate or falsely represent its memory functionality in the database.

# 8. BACKEND API STRUCTURE

Create these FastAPI endpoints:

Authentication:
- Integrate Supabase authentication securely.

Chat:
- POST /api/chat
- GET /api/conversations
- GET /api/conversations/{conversation_id}
- DELETE /api/conversations/{conversation_id}

Preferences:
- GET /api/preferences
- PUT /api/preferences

Memory:
- GET /api/memory
- DELETE /api/memory

Healthcare information:
- POST /api/ingestion/crawl
- POST /api/ingestion/index
- GET /api/sources

Health:
- GET /health

Protect sensitive endpoints with authentication and appropriate authorization.

# 9. PROJECT STRUCTURE

Use a clean monorepo structure:

careguide-ai/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   │   ├── firecrawl_service.py
│   │   │   ├── gemini_service.py
│   │   │   ├── rag_service.py
│   │   │   ├── memory_service.py
│   │   │   └── embedding_service.py
│   │   └── database/
│   ├── requirements.txt
│   └── .env.example
│
├── database/
│   └── migrations/
│
├── docs/
│   ├── architecture.md
│   └── setup.md
│
├── .gitignore
└── README.md

You may improve the structure if necessary, but maintain clear separation between frontend, backend, database, and AI services.

# 10. ENVIRONMENT VARIABLES

Create .env.example files.

Include placeholders for:

Frontend:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_API_URL

Backend:
- GEMINI_API_KEY
- FIRECRAWL_API_KEY
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_DB_URL
- MEMENTO_API_KEY (only if required by the actual Memento SDK)
- MEMENTO configuration required by its official documentation.

Never expose private API keys in frontend code.

Never commit actual .env files.

# 11. IMPLEMENTATION PROCESS

Follow these stages.

PHASE 1: Project Setup
- Inspect the existing workspace.
- Initialize frontend and backend.
- Install dependencies.
- Configure environment variables.
- Establish the project structure.

PHASE 2: Frontend
- Build landing page.
- Build authentication.
- Build dashboard.
- Build chat interface.
- Build preferences page.
- Make the interface responsive.

PHASE 3: Backend
- Set up FastAPI.
- Configure Supabase.
- Implement authentication verification.
- Implement conversation and message management.

PHASE 4: Firecrawl and RAG
- Integrate Firecrawl.
- Create the healthcare ingestion pipeline.
- Implement document chunking.
- Generate embeddings.
- Configure pgvector.
- Implement semantic retrieval.

PHASE 5: Gemini Integration
- Integrate Gemini.
- Build the RAG-based answer generation pipeline.
- Implement source attribution.
- Add safety instructions.

PHASE 6: Memento Integration
- Verify the exact Memento SDK and official documentation.
- Implement persistent memory.
- Implement memory retrieval and updates.
- Implement user-specific memory controls.
- Test continuity across sessions.

PHASE 7: Integration and Testing
- Connect frontend and backend.
- Test authentication.
- Test actual AI responses.
- Test document retrieval.
- Verify citations.
- Test persistent memory.
- Test user isolation.
- Test failure handling.

PHASE 8: Documentation and Deployment
- Create a detailed README.
- Document local setup.
- Document API endpoints.
- Document environment variables.
- Provide database migrations.
- Prepare Vercel and Render deployment configurations.

# 12. DEVELOPMENT RULES

Follow these rules throughout implementation:

1. Do not generate the entire application as a single unstructured code file.
2. Do not create fake AI responses.
3. Do not use hardcoded sample conversations as actual backend functionality.
4. Use modular and reusable components.
5. Use proper error handling.
6. Use asynchronous operations where appropriate.
7. Keep API keys secure.
8. Follow TypeScript and Python best practices.
9. Make the application responsive.
10. Test every major feature before moving to the next phase.
11. Do not silently skip any required integration.
12. Do not claim a feature is complete until it has been tested.
13. If an external integration requires credentials, build the integration and clearly explain which credentials are needed.
14. If an SDK or API is incompatible, investigate its official documentation and implement a supported alternative only after documenting the limitation.
15. Do not modify unrelated files in an existing workspace.

# 13. FINAL EXPECTED RESULT

Deliver a working CareGuide AI application with:

- Professional healthcare SaaS frontend.
- Authentication and patient dashboard.
- Functional AI chatbot.
- Firecrawl-powered healthcare information collection.
- RAG pipeline using pgvector.
- Gemini-powered personalized explanations.
- Memento persistent memory.
- Actual source attribution.
- Conversation history.
- Patient preferences.
- Healthcare safety measures.
- Secure database integration.
- Setup and deployment documentation.

Start by inspecting the workspace and preparing a concise implementation plan.

Then implement the project phase by phase.

Do not stop after generating the UI. The final objective is a fully integrated, working Generative AI healthcare information companion.