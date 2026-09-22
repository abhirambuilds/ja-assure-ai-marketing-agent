from __future__ import annotations

import logging
from html.parser import HTMLParser
from typing import Optional

from app.services.security.url_safety import UnsafeURL, safe_fetch_text

logger = logging.getLogger("ja_assure.enrichment.website_inspector")


class _HTMLTextExtractor:
    """Lightweight stdlib HTML-to-text extractor that strips tags, scripts, and styles."""

    def __init__(self) -> None:
        class _Parser(HTMLParser):
            def __init__(self_inner):
                super().__init__()
                self_inner.pieces: list[str] = []
                self_inner._skip = False

            def handle_starttag(self_inner, tag, attrs):
                if tag in {"script", "style", "noscript", "svg", "iframe"}:
                    self_inner._skip = True

            def handle_endtag(self_inner, tag):
                if tag in {"script", "style", "noscript", "svg", "iframe"}:
                    self_inner._skip = False

            def handle_data(self_inner, data):
                if not self_inner._skip:
                    self_inner.pieces.append(data)

        self._parser_cls = _Parser

    def extract(self, html: str) -> str:
        parser = self._parser_cls()
        parser.feed(html)
        raw = " ".join(parser.pieces)
        return " ".join(raw.split())


class WebsiteInspector:
    """SSRF-safe website content inspector for extracting public business information."""

    def inspect(self, domain: Optional[str]) -> Optional[str]:
        if not domain:
            return None
        url = domain if domain.startswith(("http://", "https://")) else f"https://{domain}"
        try:
            raw_html = safe_fetch_text(url, max_bytes=50_000)
            if not raw_html:
                return None
            return _HTMLTextExtractor().extract(raw_html)[:3000]
        except UnsafeURL as e:
            logger.warning(f"Blocked unsafe inspection URL '{url}': {e}")
            return None
        except Exception as e:
            logger.warning(f"Failed to inspect website for '{domain}': {e}")
            return None
