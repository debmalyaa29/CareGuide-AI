import logging
import uuid
import re
from typing import List, Dict, Any, Optional
import numpy as np
from datetime import datetime

from backend.app.core.config import settings
from backend.app.database.supabase_client import get_supabase_admin_client, get_supabase_client
from backend.app.services.embedding_service import embedding_service
from backend.app.schemas.chat import Citation
from backend.app.schemas.ingestion import HealthDocumentResponse

logger = logging.getLogger(__name__)


def chunk_text(text: str, chunk_size: int = 600, overlap: int = 100) -> List[str]:
    """
    Splits text into chunks of roughly chunk_size characters with overlap,
    respecting sentence boundaries where possible.
    """
    clean = text.strip()
    if not clean:
        return []
    if len(clean) <= chunk_size:
        return [clean]

    sentences = re.split(r'(?<=[.!?])\s+', clean)
    chunks = []
    current_chunk = []
    current_length = 0

    for sentence in sentences:
        s_len = len(sentence)
        if current_length + s_len > chunk_size and current_chunk:
            combined = " ".join(current_chunk)
            chunks.append(combined)
            # Maintain overlap with the end of the previous chunk
            overlap_sentences = []
            accum_overlap = 0
            for prev_s in reversed(current_chunk):
                if accum_overlap + len(prev_s) <= overlap:
                    overlap_sentences.insert(0, prev_s)
                    accum_overlap += len(prev_s)
                else:
                    break
            current_chunk = overlap_sentences
            current_length = sum(len(s) for s in current_chunk)

        current_chunk.append(sentence)
        current_length += s_len

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks


class RAGService:
    def __init__(self):
        # In-memory document and chunk storage fallback
        self._documents: Dict[str, Dict[str, Any]] = {}
        self._chunks: List[Dict[str, Any]] = []
        self._seeded = False

    async def seed_verified_healthcare_knowledge(self) -> None:
        """
        Seeds the verified healthcare knowledge base with authoritative articles
        from WHO, CDC, NHS, and MedlinePlus.
        """
        if self._seeded or len(self._documents) > 0:
            return

        verified_seeds = [
            {
                "title": "Type 2 Diabetes Overview, Causes and Daily Management",
                "source_url": "https://www.nhs.uk/conditions/type-2-diabetes/",
                "source_domain": "nhs.uk",
                "summary": "Clinical overview of Type 2 diabetes, insulin resistance, risk factors, blood sugar targets, and balanced diet tips.",
                "content": (
                    "Type 2 diabetes is a common condition that causes the level of glucose (sugar) in the blood to become too high. "
                    "In type 2 diabetes, the body either doesn't produce enough insulin, or the cells become resistant to insulin's effects. "
                    "Insulin is a vital hormone produced by the pancreas that allows cells to absorb glucose from food to use as energy. "
                    "Common symptoms include: feeling more thirsty than usual, urinating frequently (especially at night), feeling very tired, "
                    "unexplained weight loss, cuts or wounds that take a long time to heal, and blurred vision. "
                    "Management involves healthy eating with whole grains and reduced refined sugars, regular physical activity of at least 150 minutes a week, "
                    "routine blood sugar checks (such as HbA1c tests), and in many cases, prescribed oral medications such as metformin. "
                    "Preventive lifestyle steps can delay or even reverse early stage insulin resistance."
                )
            },
            {
                "title": "Hypertension (High Blood Pressure) Guidelines and Health Risks",
                "source_url": "https://www.who.int/news-room/fact-sheets/detail/hypertension",
                "source_domain": "who.int",
                "summary": "World Health Organization guidelines on high blood pressure, prevention, dietary sodium reduction, and cardiovascular protection.",
                "content": (
                    "Hypertension, commonly known as high blood pressure, is a significant medical condition that substantially increases the risks "
                    "of heart disease, encephalopathy, kidney failure, and stroke. Blood pressure is recorded as two numbers: systolic pressure "
                    "(pressure in blood vessels when the heart contracts) over diastolic pressure (pressure when the heart rests between beats). "
                    "According to WHO clinical benchmarks, hypertension is diagnosed when systolic blood pressure on two different days is >=140 mmHg "
                    "and/or diastolic blood pressure on both days is >=90 mmHg. "
                    "Hypertension is frequently termed a 'silent killer' because most individuals experience no obvious symptoms until damage occurs. "
                    "Key preventive habits include reducing salt intake to less than 5 grams daily, eating more fresh vegetables and fruits, "
                    "avoiding saturated and trans fats, eliminating tobacco consumption, moderating alcohol, and maintaining physical activity."
                )
            },
            {
                "title": "Preventive Healthcare: Blood Pressure and Cholesterol Screenings",
                "source_url": "https://www.cdc.gov/cholesterol/about/index.html",
                "source_domain": "cdc.gov",
                "summary": "CDC guidance on blood cholesterol, LDL vs HDL, lipid panels, and heart-healthy living habits.",
                "content": (
                    "Cholesterol is a waxy, fat-like substance that your body needs to build healthy cells, but having too much of it increases "
                    "your risk of heart disease and ischemic events. Low-density lipoprotein (LDL) is often called 'bad cholesterol' because "
                    "it contributes to plaque buildup in arteries (atherosclerosis). High-density lipoprotein (HDL) is known as 'good cholesterol' "
                    "because it carries cholesterol from other parts of the body back to the liver for removal. "
                    "A simple blood test called a lipid panel checks total cholesterol, LDL, HDL, and triglycerides. "
                    "Adults aged 20 and older with low cardiovascular risk should have their cholesterol checked at least every 4 to 6 years. "
                    "Lifestyle habits that optimize cholesterol include choosing foods low in saturated fat, quitting smoking, and engaging "
                    "in aerobic exercise."
                )
            },
            {
                "title": "Respiratory Infections: Distinguishing the Common Cold, Flu, and Viral Illnesses",
                "source_url": "https://medlineplus.gov/flu.html",
                "source_domain": "medlineplus.gov",
                "summary": "MedlinePlus educational guide on influenza, transmission, incubation, hydration, and when to seek urgent evaluation.",
                "content": (
                    "Influenza (flu) is a contagious respiratory illness caused by influenza viruses that infect the nose, throat, and sometimes lungs. "
                    "Unlike the common cold which typically begins gradually with a runny nose and mild scratchy throat, flu symptoms often appear abruptly. "
                    "Symptoms include high fever, chills, persistent dry cough, sore throat, runny or stuffy nose, muscle or body aches, headaches, and fatigue. "
                    "For most healthy individuals, recovery occurs within one to two weeks with rest, abundant fluids, and fever-reducing care. "
                    "However, emergency warning signs that warrant immediate emergency medical care include: difficulty breathing or shortness of breath, "
                    "persistent pain or pressure in the chest, sudden dizziness or confusion, severe muscle pain, and bluish lips or face."
                )
            },
            {
                "title": "Healthy Living and Nutrition Essentials for Chronic Disease Prevention",
                "source_url": "https://www.who.int/initiatives/behealthy/healthy-diet",
                "source_domain": "who.int",
                "summary": "WHO dietary guidelines for chronic disease prevention, fiber intake, sodium reduction, and hydration.",
                "content": (
                    "A balanced diet is central to safeguarding health and warding off noncommunicable diseases including diabetes, heart disease, "
                    "stroke, and certain cancers. A healthy dietary pattern for adults includes: at least 400 grams (5 portions) of fruits and vegetables "
                    "daily, legumes (e.g. lentils, beans), nuts, and whole grains (e.g. unprocessed maize, oats, wheat, and brown rice). "
                    "Free sugars should represent less than 10% of total energy intake, and saturated fats should be limited in favor of unsaturated fats. "
                    "Adequate daily water intake supports kidney filtration, cognitive performance, and joint lubrication."
                )
            }
        ]

        for item in verified_seeds:
            await self.index_document(
                title=item["title"],
                source_url=item["source_url"],
                source_domain=item["source_domain"],
                content=item["content"],
                summary=item["summary"]
            )
        self._seeded = True
        logger.info(f"Seeded {len(verified_seeds)} verified healthcare educational documents.")

    async def index_document(
        self,
        title: str,
        source_url: str,
        source_domain: str,
        content: str,
        summary: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> HealthDocumentResponse:
        """
        Indexes a full healthcare document: chunks it, generates embeddings,
        and saves both the document and chunks into Supabase (and local store).
        """
        doc_id = str(uuid.uuid4())
        now_iso = datetime.utcnow().isoformat()
        metadata = metadata or {}

        # 1. Chunk document
        chunks = chunk_text(content)
        if not chunks:
            chunks = [content]

        # 2. Generate embeddings
        embeddings = await embedding_service.get_embeddings_batch(chunks)

        # 3. Store in local cache
        self._documents[doc_id] = {
            "id": doc_id,
            "title": title,
            "source_url": source_url,
            "source_domain": source_domain,
            "summary": summary or (content[:180] + "..."),
            "metadata": metadata,
            "created_at": now_iso,
            "chunks_count": len(chunks)
        }

        for idx, (chunk, emb) in enumerate(zip(chunks, embeddings)):
            self._chunks.append({
                "id": str(uuid.uuid4()),
                "document_id": doc_id,
                "chunk_index": idx,
                "chunk_text": chunk,
                "embedding": emb,
                "source_title": title,
                "source_url": source_url,
                "source_domain": source_domain,
                "metadata": metadata,
                "created_at": now_iso
            })

        # 4. Store in Supabase if configured
        client = get_supabase_admin_client()
        if client:
            try:
                # Upsert health_documents
                doc_payload = {
                    "id": doc_id,
                    "title": title,
                    "source_url": source_url,
                    "source_domain": source_domain,
                    "summary": summary,
                    "metadata": metadata
                }
                client.table("health_documents").upsert(doc_payload, on_conflict="source_url").execute()

                # Insert chunks
                chunk_records = [
                    {
                        "document_id": doc_id,
                        "chunk_index": idx,
                        "chunk_text": chunk,
                        "embedding": emb,
                        "metadata": metadata
                    }
                    for idx, (chunk, emb) in enumerate(zip(chunks, embeddings))
                ]
                client.table("document_chunks").insert(chunk_records).execute()
            except Exception as e:
                logger.warning(f"Failed to persist document to Supabase pgvector: {e}")

        return HealthDocumentResponse(
            id=doc_id,
            title=title,
            source_url=source_url,
            source_domain=source_domain,
            summary=summary,
            chunks_count=len(chunks),
            created_at=now_iso
        )

    async def retrieve_relevant_chunks(
        self,
        query: str,
        limit: int = 4,
        threshold: float = 0.05
    ) -> List[Dict[str, Any]]:
        """
        Performs semantic vector search across document chunks.
        First tries Supabase pgvector RPC `match_document_chunks`,
        then falls back to in-memory cosine similarity calculation.
        """
        await self.seed_verified_healthcare_knowledge()
        query_embedding = await embedding_service.get_embedding(query)

        # Try Supabase RPC
        client = get_supabase_client() or get_supabase_admin_client()
        if client:
            try:
                rpc_response = client.rpc(
                    "match_document_chunks",
                    {
                        "query_embedding": query_embedding,
                        "match_threshold": threshold,
                        "match_count": limit
                    }
                ).execute()
                if rpc_response.data and len(rpc_response.data) > 0:
                    return rpc_response.data
            except Exception as e:
                logger.debug(f"Supabase RPC match_document_chunks error: {e}")

        # In-memory cosine similarity with hybrid lexical weighting
        results = []
        q_vec = np.array(query_embedding, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)

        keywords = [w.lower() for w in re.findall(r'\b[a-zA-Z]{3,}\b', query)]
        stopwords = {"what", "when", "where", "which", "with", "from", "that", "this", "have", "explain", "about", "could", "would", "tell"}
        meaningful_keywords = [k for k in keywords if k not in stopwords]

        for chunk_item in self._chunks:
            c_vec = np.array(chunk_item["embedding"], dtype=np.float32)
            c_norm = np.linalg.norm(c_vec)
            if q_norm > 0 and c_norm > 0:
                sim = float(np.dot(q_vec, c_vec) / (q_norm * c_norm))
            else:
                sim = 0.0

            # Lexical keyword boost
            text_lower = (chunk_item["chunk_text"] + " " + chunk_item["source_title"]).lower()
            if meaningful_keywords:
                matches = sum(1 for kw in meaningful_keywords if kw in text_lower)
                sim += 0.45 * (matches / len(meaningful_keywords))

            results.append({
                "id": chunk_item["id"],
                "document_id": chunk_item["document_id"],
                "chunk_text": chunk_item["chunk_text"],
                "similarity": sim,
                "source_title": chunk_item["source_title"],
                "source_url": chunk_item["source_url"],
                "source_domain": chunk_item["source_domain"],
                "metadata": chunk_item["metadata"]
            })

        # Sort descending by similarity
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:limit]

    async def list_sources(self) -> List[HealthDocumentResponse]:
        await self.seed_verified_healthcare_knowledge()

        client = get_supabase_client()
        if client:
            try:
                res = client.table("health_documents").select("*").order("created_at", desc=True).execute()
                if res.data:
                    return [
                        HealthDocumentResponse(
                            id=row["id"],
                            title=row["title"],
                            source_url=row["source_url"],
                            source_domain=row["source_domain"],
                            summary=row.get("summary"),
                            chunks_count=row.get("chunks_count", 0),
                            created_at=row.get("created_at", "")
                        )
                        for row in res.data
                    ]
            except Exception as e:
                logger.debug(f"Supabase query health_documents: {e}")

        return [
            HealthDocumentResponse(
                id=doc["id"],
                title=doc["title"],
                source_url=doc["source_url"],
                source_domain=doc["source_domain"],
                summary=doc.get("summary"),
                chunks_count=doc.get("chunks_count", 0),
                created_at=doc["created_at"]
            )
            for doc in self._documents.values()
        ]


rag_service = RAGService()
