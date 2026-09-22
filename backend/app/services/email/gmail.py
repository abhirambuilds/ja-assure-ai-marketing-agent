from __future__ import annotations

import logging
from typing import Any, Dict, List

from app.config import Settings
from app.services.email.base import EmailMessage, EmailProvider, ProviderHealth, SendResult

logger = logging.getLogger("app.email.gmail")


class GmailEmailProvider(EmailProvider):
    """Gmail OAuth Provider Boundary Adapter.

    Represents the architectural adapter boundary for Gmail API / Google Workspace OAuth.
    As established by forensic analysis, live OAuth token exchange and Google API client
    libraries are not configured in the source codebase. This adapter preserves the clean
    interface contract without fabricating fake API calls or claiming live sync.
    """

    name = "gmail"

    def __init__(self, settings: Settings):
        self.settings = settings

    def _configured(self) -> bool:
        return bool(
            self.settings.REAL_EMAIL_ENABLED
            and self.settings.REAL_PROVIDER_SEND
            and (self.settings.EMAIL_PROVIDER.lower() in ["gmail", "gmail_oauth"])
            and self.settings.GMAIL_CLIENT_ID
            and self.settings.GMAIL_CLIENT_SECRET
            and self.settings.GMAIL_REFRESH_TOKEN
        )

    def send_message(self, message: EmailMessage) -> SendResult:
        if not self._configured():
            return SendResult(
                sent=False,
                error="Real email sending is disabled or Gmail OAuth credentials (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN) are missing.",
            )
        # Even if variables were set, without the Google Workspace OAuth runtime client,
        # we honestly return the boundary status.
        return SendResult(
            sent=False,
            error="Gmail OAuth adapter boundary exists, but live Gmail API credentials/runtime are not configured in this deployment.",
        )

    def get_messages(self) -> List[Dict[str, Any]]:
        return []

    def get_thread(self, thread_id: str) -> List[Dict[str, Any]]:
        return []

    def health_check(self) -> ProviderHealth:
        configured = self._configured()
        return ProviderHealth(
            provider=self.name,
            healthy=False,  # Honest: live Gmail API is unconfigured/boundary only
            mode="boundary_stub",
            detail="Gmail OAuth adapter boundary: live Google API credentials are not configured. Use SMTP or Mock mode.",
        )


# Alias for compatibility with SOURCE
GmailOAuthProvider = GmailEmailProvider
