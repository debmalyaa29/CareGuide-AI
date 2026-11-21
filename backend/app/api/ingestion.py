import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Header, Depends
from backend.app.schemas.ingestion import (
    CrawlRequest,
    DocumentIndexRequest,
    HealthDocumentResponse,
    SourcesListResponse
)
from backend.app.core.auth import require_authenticated_user
from backend.app.services.firecrawl_service import firecrawl_service
from backend.app.services.rag_service import rag_service
from backend.app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Healthcare Ingestion & RAG Sources"])


@router.post("/ingestion/crawl", response_model=HealthDocumentResponse)
async def crawl_healthcare_source(
    req: CrawlRequest,
    user_id: str = Depends(require_authenticated_user)
):
    """
    Collects healthcare information from trusted public healthcare websites using Firecrawl.
    Restricted to allowlist: who.int, cdc.gov, nhs.uk, medlineplus.gov.
    """
    if not firecrawl_service.validate_domain(req.url):
        raise HTTPException(
            status_code=400,
            detail=f"Domain not permitted. Ingestion is restricted to trusted healthcare sources: {', '.join(firecrawl_service.ALLOWED_DOMAINS)}"
        )

    try:
        scraped = await firecrawl_service.scrape_url(req.url)
        # Automatically index crawled content into RAG vector store
        indexed_doc = await rag_service.index_document(
            title=scraped["title"],
            source_url=scraped["source_url"],
            source_domain=scraped["source_domain"],
            content=scraped["content"],
            metadata=scraped.get("metadata", {})
        )
        return indexed_doc
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        logger.error(f"Ingestion crawl failed: {e}")
        raise HTTPException(status_code=500, detail=f"Crawl and indexing error: {str(e)}")


@router.post("/ingestion/index", response_model=HealthDocumentResponse)
async def index_healthcare_document(
    req: DocumentIndexRequest,
    user_id: str = Depends(require_authenticated_user)
):
    """
    Manually index a verified public healthcare document into pgvector.
    Validates source domain allowlist.
    """
    if not firecrawl_service.validate_domain(req.source_url):
        raise HTTPException(
            status_code=400,
            detail=f"Source URL domain not allowed. Must belong to: {', '.join(firecrawl_service.ALLOWED_DOMAINS)}"
        )

    try:
        doc = await rag_service.index_document(
            title=req.title,
            source_url=req.source_url,
            source_domain=req.source_domain,
            content=req.content,
            metadata=req.metadata or {}
        )
        return doc
    except Exception as e:
        logger.error(f"Manual document indexing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sources", response_model=SourcesListResponse)
async def get_trusted_sources():
    """
    Returns all indexed trusted healthcare documents and domain allowlist.
    """
    docs = await rag_service.list_sources()
    return SourcesListResponse(
        documents=docs,
        allowed_domains=firecrawl_service.ALLOWED_DOMAINS,
        total_documents=len(docs)
    )
