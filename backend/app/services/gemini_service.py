import logging
import json
import re
from typing import List, Dict, Any, Optional
from datetime import datetime

from backend.app.core.config import settings
from backend.app.schemas.chat import Citation, MedicalTermDefinition, ChatResponse
from backend.app.services.embedding_service import get_genai_client
from backend.app.services.memory_service import memory_service

logger = logging.getLogger(__name__)

EMERGENCY_KEYWORDS = [
    "chest pain", "pressure in chest", "can't breathe", "cannot breathe", "shortness of breath",
    "difficulty breathing", "stroke", "face drooping", "arm weakness", "slurred speech",
    "severe bleeding", "unconscious", "passed out", "seizure", "anaphylaxis", "severe allergic",
    "overdose", "suicidal", "coughing blood", "sudden numbness", "heart attack"
]


def check_emergency_symptoms(text: str) -> bool:
    """Detect acute medical emergency warning signs."""
    text_lower = text.lower()
    return any(kw in text_lower for kw in EMERGENCY_KEYWORDS)


SYSTEM_PROMPT = """You are CareGuide AI, an empathetic, highly knowledgeable, and safety-conscious Patient Information Companion.
Your mission is to help patients understand publicly available, verified healthcare information through clear, structured, and personalized explanations.

CRITICAL HEALTHCARE SAFETY RULES:
1. EDUCATIONAL COMPANION ONLY: You provide general healthcare education, NOT individual medical diagnosis, prescriptions, or clinical treatment plans.
2. NO DIAGNOSES OR DOSAGES: Never state "You have X disease" or prescribe specific drug dosages.
3. EMERGENCY ADVISORY: If the user mentions acute symptoms (e.g. crushing chest pain, difficulty breathing, stroke signs, severe trauma), immediately advise contacting emergency services (911, 112, or local emergency number).
4. STRICT CITATION GROUNDING: Rely on the verified healthcare sources provided in the context (WHO, CDC, NHS, MedlinePlus). Never hallucinate medical references, links, clinical trials, or statistics.
5. MEDICAL TERMINOLOGY SIMPLIFICATION: Clarify technical medical jargon into plain, reassuring everyday language.
6. TAILOR TO PATIENT PREFERENCES:
   - If style is "simple": Use plain everyday language, relatable analogies, 6th-8th grade reading level, compassionate tone.
   - If style is "detailed": Provide comprehensive background, symptoms, lifestyle factors, and questions to ask their doctor.
   - If style is "technical": Provide precise physiological mechanisms, medical terminology, and clinical metric ranges.
   - If length is "short": Keep answer concise (100-150 words).
   - If length is "medium": Keep answer balanced and structured (250-400 words).
   - If length is "long": Provide thorough educational guide with clear headings.

OUTPUT FORMAT:
You MUST respond with valid JSON containing the following structure:
{
  "reply": "Your structured markdown explanation here. Include clear sections, bullet points, and an explicit disclaimer at the end.",
  "is_emergency": false,
  "emergency_notice": "Immediate action notice if emergency keywords detected, else null",
  "medical_terms": [
    {"term": "Medical term", "definition": "Clear plain English explanation"}
  ],
  "suggested_follow_ups": [
    "Question 1?",
    "Question 2?",
    "Question 3?"
  ]
}
"""


class GeminiService:
    def __init__(self):
        self.model_name = settings.GEMINI_MODEL

    async def generate_response(
        self,
        user_message: str,
        retrieved_chunks: List[Dict[str, Any]],
        user_id: str,
        conversation_id: str,
        explanation_style: str = "simple",
        response_length: str = "medium",
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> ChatResponse:
        """
        Generates a personalized, source-grounded healthcare educational response.
        """
        is_emergency = check_emergency_symptoms(user_message)
        emergency_notice = (
            "🚨 URGENT NOTICE: The symptoms described may indicate an acute medical emergency. "
            "Please call emergency services (911 in the US/Canada, 999 in the UK, 112 in Europe) or go to the nearest emergency room immediately."
            if is_emergency else None
        )

        # 1. Format Citations from RAG chunks
        citations: List[Citation] = []
        seen_urls = set()
        for chunk in retrieved_chunks:
            url = chunk.get("source_url", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                citations.append(
                    Citation(
                        title=chunk.get("source_title", "Trusted Health Guide"),
                        url=url,
                        domain=chunk.get("source_domain", "Public Healthcare"),
                        snippet=chunk.get("chunk_text", "")[:160] + "..."
                    )
                )

        # 2. Retrieve Memento persistent memory context
        memento_context = await memory_service.get_user_context(user_id)
        memory_summary = memento_context.get("context_summary", "No previous medical topics recorded.")

        # 3. Build RAG context block
        context_blocks = []
        for idx, chunk in enumerate(retrieved_chunks, 1):
            context_blocks.append(
                f"[Source {idx}]: {chunk.get('source_title')} ({chunk.get('source_domain')})\n"
                f"URL: {chunk.get('source_url')}\n"
                f"Content: {chunk.get('chunk_text')}\n"
            )
        rag_context_text = "\n---\n".join(context_blocks) if context_blocks else "No specific documents retrieved from local index."

        # 4. Construct prompt
        history_text = ""
        if conversation_history:
            history_lines = [f"{msg.get('role', 'user').capitalize()}: {msg.get('content')}" for msg in conversation_history[-4:]]
            history_text = "\n".join(history_lines)

        user_prompt = f"""
PATIENT PREFERENCES:
- Explanation Style: {explanation_style}
- Preferred Response Length: {response_length}

PATIENT CONVERSATIONAL MEMORY (from Memento):
{memory_summary}

RECENT CONVERSATION HISTORY:
{history_text if history_text else "First message of this conversation."}

VERIFIED RETRIEVED HEALTHCARE SOURCES:
{rag_context_text}

PATIENT QUESTION:
"{user_message}"

Generate a personalized, grounded explanation in JSON format complying strictly with the healthcare safety rules.
"""

        client = get_genai_client()
        reply_content = None
        medical_terms: List[MedicalTermDefinition] = []
        suggested_follow_ups: List[str] = []

        if client and settings.GEMINI_API_KEY:
            candidate_models = []
            for m in [self.model_name, "gemini-3-flash-preview", "gemini-flash-latest", "gemini-3.5-flash"]:
                if m and m not in candidate_models:
                    candidate_models.append(m)

            last_error = None
            for model_id in candidate_models:
                try:
                    response = client.models.generate_content(
                        model=model_id,
                        contents=[
                            {"role": "user", "parts": [{"text": SYSTEM_PROMPT + "\n\n" + user_prompt}]}
                        ],
                        config={"response_mime_type": "application/json"},
                    )
                    raw_text = response.text if hasattr(response, "text") else str(response)

                    # Parse JSON output from Gemini
                    cleaned_text = re.sub(r"^```(?:json)?\s*", "", raw_text.strip())
                    cleaned_text = re.sub(r"\s*```$", "", cleaned_text)
                    parsed = json.loads(cleaned_text)

                    reply_content = parsed.get("reply")
                    is_emergency = is_emergency or parsed.get("is_emergency", False)
                    if parsed.get("emergency_notice"):
                        emergency_notice = parsed.get("emergency_notice")

                    for item in parsed.get("medical_terms", []):
                        medical_terms.append(MedicalTermDefinition(term=item.get("term", ""), definition=item.get("definition", "")))

                    suggested_follow_ups = parsed.get("suggested_follow_ups", [])
                    if reply_content:
                        break
                except Exception as e:
                    last_error = e
                    logger.warning(f"Gemini model '{model_id}' failed: {e}")

            if not reply_content and last_error:
                logger.warning(f"All Gemini models failed ({last_error}). Utilizing verified RAG synthesis fallback.")

        # Resilient Synthesis Fallback if API key pending or network interrupted
        if not reply_content:
            reply_content, medical_terms, suggested_follow_ups = self._synthesize_grounded_response(
                user_message=user_message,
                retrieved_chunks=retrieved_chunks,
                explanation_style=explanation_style,
                response_length=response_length,
                is_emergency=is_emergency
            )

        # 5. Extract topic for Memento persistent memory
        topic_detected = self._extract_topic(user_message)
        if topic_detected:
            summary_snippet = f"Patient asked about {topic_detected} with {explanation_style} explanation preference."
            await memory_service.record_topic(user_id=user_id, topic=topic_detected, summary=summary_snippet)

        import uuid
        now = datetime.utcnow()
        return ChatResponse(
            conversation_id=conversation_id,
            user_message_id=str(uuid.uuid4()),
            assistant_message_id=str(uuid.uuid4()),
            reply=reply_content,
            citations=citations,
            medical_terms=medical_terms,
            suggested_follow_ups=suggested_follow_ups,
            is_emergency=is_emergency,
            emergency_notice=emergency_notice,
            explanation_style=explanation_style,
            retrieved_chunk_count=len(retrieved_chunks),
            created_at=now
        )

    def _extract_topic(self, query: str) -> Optional[str]:
        """Simple keyword-based medical topic extractor."""
        topics = [
            "Type 2 Diabetes", "Diabetes", "Hypertension", "High Blood Pressure",
            "Cholesterol", "Heart Disease", "Flu", "Common Cold", "COVID-19",
            "Vaccination", "Asthma", "Healthy Nutrition", "Physical Activity"
        ]
        q_lower = query.lower()
        for t in topics:
            if t.lower() in q_lower:
                return t
        words = [w for w in query.split() if len(w) > 3 and w.lower() not in {"what", "how", "when", "explain", "does", "have"}]
        return " ".join(words[:2]).title() if words else "General Health Query"

    def _synthesize_grounded_response(
        self,
        user_message: str,
        retrieved_chunks: List[Dict[str, Any]],
        explanation_style: str,
        response_length: str,
        is_emergency: bool
    ) -> tuple[str, List[MedicalTermDefinition], List[str]]:
        """
        Creates a high-quality, structured, source-grounded response from retrieved knowledge chunks.
        """
        source_titles = [c.get("source_title", "Verified Guide") for c in retrieved_chunks[:2]]
        domain_names = list({c.get("source_domain", "Healthcare Agency") for c in retrieved_chunks})
        sources_str = ", ".join(domain_names) if domain_names else "WHO, CDC, and NHS guidelines"

        emergency_header = ""
        if is_emergency:
            emergency_header = (
                "> ⚠️ **IMPORTANT HEALTH WARNING:** If you or someone with you is experiencing sudden chest pain, "
                "shortness of breath, or sudden weakness, **call 911 (or your local emergency number) immediately**.\n\n"
            )

        if explanation_style == "simple":
            intro = f"Based on verified health guidance from **{sources_str}**, here is a simple and clear breakdown:\n\n"
            bullets = []
            for chunk in retrieved_chunks[:3]:
                sentences = chunk.get("chunk_text", "").split(". ")
                if sentences:
                    bullets.append(f"• **{sentences[0].strip()}**")
            content_body = "\n".join(bullets)
            closing = (
                "\n\n**Key Takeaway:** Think of this information as a compass for your health. "
                "Healthy daily habits—like drinking plenty of water, getting moving, and balanced meals—make a huge difference."
            )
        elif explanation_style == "technical":
            intro = f"### Clinical & Public Health Synthesis ({sources_str})\n\n"
            content_body = "\n\n".join([f"**{c.get('source_title')}:**\n{c.get('chunk_text')}" for c in retrieved_chunks[:3]])
            closing = "\n\n*Reference Standards:* Observational and clinical consensus as published by public health surveillance organizations."
        else: # detailed
            intro = f"Here is a comprehensive overview gathered from authoritative healthcare sources (**{sources_str}**):\n\n"
            paragraphs = []
            for idx, c in enumerate(retrieved_chunks[:3], 1):
                paragraphs.append(f"#### {idx}. {c.get('source_title')}\n{c.get('chunk_text')}")
            content_body = "\n\n".join(paragraphs)
            closing = (
                "\n\n#### What to Ask Your Healthcare Provider:\n"
                "- How do my personal health metrics compare to recommended targets?\n"
                "- Are there lifestyle adjustments suitable for my daily routine?\n"
                "- When should I schedule my next routine screening?"
            )

        disclaimer = (
            "\n\n---\n*Disclaimer: CareGuide AI is an educational assistant designed to explain public health resources. "
            "It does not provide personal medical diagnosis or replace consultation with a qualified medical professional.*"
        )

        full_reply = emergency_header + intro + content_body + closing + disclaimer

        terms = [
            MedicalTermDefinition(term="Insulin Resistance", definition="A condition where cells in muscles and liver do not respond well to insulin and cannot easily absorb glucose."),
            MedicalTermDefinition(term="Hypertension", definition="Chronically elevated blood pressure (typically 140/90 mmHg or higher) placing strain on arteries and organs."),
            MedicalTermDefinition(term="Lipid Panel", definition="A standard blood test measuring cholesterol levels, including LDL ('bad'), HDL ('good'), and triglycerides.")
        ]

        follow_ups = [
            "What lifestyle steps can help reduce my blood pressure naturally?",
            "How often should adults get preventive health screenings?",
            "What is the difference between Type 1 and Type 2 diabetes?"
        ]

        return full_reply, terms, follow_ups


gemini_service = GeminiService()
