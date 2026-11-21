import logging
import re
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse
from backend.app.core.config import settings

logger = logging.getLogger(__name__)


class FirecrawlService:
    """
    Firecrawl integration service for extracting healthcare information
    strictly restricted to verified trusted public healthcare domains.
    """

    ALLOWED_DOMAINS = ["who.int", "cdc.gov", "nhs.uk", "medlineplus.gov"]

    def __init__(self):
        self.api_key = settings.FIRECRAWL_API_KEY
        self._app = None

    def _get_app(self):
        if self._app is not None:
            return self._app
        if not self.api_key:
            return None
        try:
            from firecrawl import FirecrawlApp
            self._app = FirecrawlApp(api_key=self.api_key)
            return self._app
        except Exception as e:
            logger.error(f"Failed to initialize FirecrawlApp: {e}")
            return None

    def validate_domain(self, url: str) -> bool:
        """
        Verify that the URL belongs to an allowed trusted healthcare domain.
        """
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            if not domain:
                return False
            # Strip subdomains or match root domain
            for allowed in self.ALLOWED_DOMAINS:
                if domain == allowed or domain.endswith("." + allowed):
                    return True
            return False
        except Exception:
            return False

    def clean_text(self, text: str) -> str:
        """
        Clean scraped markdown/text content for high quality RAG chunking.
        """
        if not text:
            return ""
        # Remove repeated whitespace and redundant newlines
        cleaned = re.sub(r"\n{3,}", "\n\n", text)
        cleaned = re.sub(r"[ \t]+", " ", cleaned)
        # Remove navigation/script clutter patterns
        cleaned = re.sub(r"\[(Skip to main content|Menu|Cookies|Privacy Policy)\]\([^\)]+\)", "", cleaned, flags=re.I)
        return cleaned.strip()

    async def scrape_url(self, url: str) -> Dict[str, Any]:
        """
        Scrape a single trusted healthcare page using Firecrawl.
        """
        if not self.validate_domain(url):
            raise ValueError(
                f"Domain not permitted. Firecrawl ingestion is restricted to trusted healthcare sources: {', '.join(self.ALLOWED_DOMAINS)}"
            )

        domain = urlparse(url).netloc.lower()
        app = self._get_app()

        if app and self.api_key:
            try:
                # Call Firecrawl scrape
                scrape_result = app.scrape_url(url, params={"formats": ["markdown", "html"]})
                markdown = scrape_result.get("markdown", "")
                metadata = scrape_result.get("metadata", {})
                title = metadata.get("title") or metadata.get("ogTitle") or f"Healthcare Guide - {domain}"

                return {
                    "title": title.strip(),
                    "source_url": url,
                    "source_domain": domain,
                    "content": self.clean_text(markdown),
                    "metadata": metadata,
                    "status": "success",
                    "crawled_by": "firecrawl-py"
                }
            except Exception as e:
                logger.error(f"Firecrawl scrape failed for {url}: {e}")
                # If API call failed, fallback to HTTP extraction or verified seed
                pass

        # Resilient fallback fetcher using httpx for live allowed domain retrieval
        try:
            import httpx
            from bs4 import BeautifulSoup
        except ImportError:
            BeautifulSoup = None

        try:
            import httpx
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(url, headers={"User-Agent": "CareGuideAI-Bot/1.0 (+https://careguide.ai)"})
                if resp.status_code == 200:
                    text_content = resp.text
                    title = f"Healthcare Information - {domain}"
                    if "<title>" in text_content and "</title>" in text_content:
                        title = text_content.split("<title>")[1].split("</title>")[0].strip()
                    # Strip basic HTML tags
                    clean_body = re.sub(r"<[^>]+>", " ", text_content)
                    return {
                        "title": title,
                        "source_url": url,
                        "source_domain": domain,
                        "content": self.clean_text(clean_body),
                        "metadata": {"status_code": resp.status_code, "fallback": True},
                        "status": "success",
                        "crawled_by": "direct-verified-fetch"
                    }
        except Exception as err:
            logger.warning(f"Direct fallback fetch failed for {url}: {err}")

        # Return default verified seed placeholder if network offline
        return {
            "title": f"Trusted Health Resource: {domain}",
            "source_url": url,
            "source_domain": domain,
            "content": f"Educational healthcare overview from verified source {domain}.",
            "metadata": {"fallback": True},
            "status": "offline_fallback",
            "crawled_by": "offline_fallback"
        }


firecrawl_service = FirecrawlService()
