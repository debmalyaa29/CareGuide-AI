import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import settings
from backend.app.api.health import router as health_router
from backend.app.api.chat import router as chat_router
from backend.app.api.preferences import router as preferences_router
from backend.app.api.memory import router as memory_router
from backend.app.api.ingestion import router as ingestion_router
from backend.app.services.rag_service import rag_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] - %(name)s - %(message)s"
)
logger = logging.getLogger("careguide-ai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing CareGuide AI Knowledge Base & Services...")
    try:
        await rag_service.seed_verified_healthcare_knowledge()
        logger.info("CareGuide AI verified healthcare knowledge base seeded successfully.")
    except Exception as e:
        logger.error(f"Error seeding knowledge base during startup: {e}")
    yield
    logger.info("CareGuide AI server shutting down.")


app = FastAPI(
    title="CareGuide AI – Patient Information Companion",
    description=(
        "Production-minded Generative AI healthcare education assistant that helps patients "
        "understand publicly available healthcare information through simple, personalized explanations."
    ),
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
origins = settings.cors_origin_list
if "*" not in origins and "http://localhost:3000" not in origins:
    origins.extend(["http://localhost:3000", "http://127.0.0.1:3000"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health_router)
app.include_router(chat_router)
app.include_router(preferences_router)
app.include_router(memory_router)
app.include_router(ingestion_router)


@app.get("/")
async def root():
    return {
        "app": "CareGuide AI – Patient Information Companion",
        "documentation": "/docs",
        "health": "/health",
        "status": "online"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
