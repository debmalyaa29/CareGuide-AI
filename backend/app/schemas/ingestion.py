from typing import List, Optional, Dict, Any
from pydantic import BaseModel, HttpUrl, Field


class CrawlRequest(BaseModel):
    url: str = Field(..., description="Target healthcare URL from an allowed domain (who.int, cdc.gov, nhs.uk, medlineplus.gov)")
    limit: Optional[int] = Field(1, ge=1, le=10)


class DocumentIndexRequest(BaseModel):
    title: str = Field(..., min_length=2)
    source_url: str = Field(...)
    source_domain: str = Field(...)
    content: str = Field(..., min_length=20)
    metadata: Optional[Dict[str, Any]] = None


class HealthDocumentResponse(BaseModel):
    id: str
    title: str
    source_url: str
    source_domain: str
    summary: Optional[str] = None
    chunks_count: Optional[int] = 0
    created_at: str


class SourcesListResponse(BaseModel):
    documents: List[HealthDocumentResponse]
    allowed_domains: List[str]
    total_documents: int
