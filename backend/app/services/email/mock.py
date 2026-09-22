from __future__ import annotations

from itertools import count
from typing import Any, Dict, List, Optional

from app.services.email.base import EmailMessage, EmailProvider, ProviderHealth, SendResult


class MockEmailProvider(EmailProvider):
    """In-memory mock email provider for hermetic testing and safe offline operation.

    Never connects to external networks or dispatches actual SMTP/OAuth traffic.
    """

    name = "mock"

    def __init__(self) -> None:
        self.sent_messages: List[EmailMessage] = []
        self._ids = count(1)

    def send_message(self, message: EmailMessage) -> SendResult:
        self.sent_messages.append(message)
        msg_id = f"mock-{next(self._ids)}"
        return SendResult(sent=True, provider_message_id=msg_id)

    def get_messages(self) -> List[Dict[str, Any]]:
        return [
            {
                "to": m.to,
                "subject": m.subject,
                "body": m.body,
                "sender": m.sender,
                "headers": dict(m.headers),
            }
            for m in self.sent_messages
        ]

    def get_thread(self, thread_id: str) -> List[Dict[str, Any]]:
        return [m for m in self.get_messages() if thread_id in m.get("subject", "")]

    def clear(self) -> None:
        """Reset sent messages queue."""
        self.sent_messages.clear()

    def health_check(self) -> ProviderHealth:
        return ProviderHealth(
            provider=self.name,
            healthy=True,
            mode="mock",
            detail="Mock provider active. All messages stored in memory safely without external dispatch.",
        )
