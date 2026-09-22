from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass(frozen=True)
class EmailMessage:
    to: str
    subject: str
    body: str
    sender: str = "no-reply@jaassure.com"
    headers: Dict[str, str] = field(default_factory=dict)


@dataclass(frozen=True)
class SendResult:
    sent: bool
    provider_message_id: Optional[str] = None
    error: Optional[str] = None


@dataclass(frozen=True)
class ProviderHealth:
    provider: str
    healthy: bool
    mode: str
    detail: str


class EmailProvider(ABC):
    name: str

    @abstractmethod
    def send_message(self, message: EmailMessage) -> SendResult:
        """Send an email message through the provider."""
        raise NotImplementedError

    @abstractmethod
    def get_messages(self) -> List[Dict[str, Any]]:
        """Retrieve sent or received messages for this provider."""
        raise NotImplementedError

    @abstractmethod
    def get_thread(self, thread_id: str) -> List[Dict[str, Any]]:
        """Retrieve a message thread by ID or subject."""
        raise NotImplementedError

    @abstractmethod
    def health_check(self) -> ProviderHealth:
        """Verify provider availability and configuration status."""
        raise NotImplementedError
