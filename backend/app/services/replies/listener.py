from __future__ import annotations

from typing import Any, Dict, List

from app.services.email.base import EmailProvider


class ReplyListener:
    """Inbound Reply Listener Adapter.

    Preserves the SOURCE polling boundary contract. In mock mode, polls the
    in-memory provider; for live SMTP/Gmail, acts as an adapter boundary until
    an external IMAP or webhook synchronization service is provisioned.
    """

    def __init__(self, provider: EmailProvider):
        self.provider = provider

    def poll(self) -> List[Dict[str, Any]]:
        """Poll the provider for new inbound messages."""
        return self.provider.get_messages()
