from __future__ import annotations

from app.config import Settings, settings as global_settings
from app.services.email.base import EmailMessage, EmailProvider, ProviderHealth, SendResult
from app.services.email.gmail import GmailEmailProvider, GmailOAuthProvider
from app.services.email.mock import MockEmailProvider
from app.services.email.smtp import SMTPEmailProvider

# Global singleton instance for MockEmailProvider during test / runtime sessions
_global_mock_provider: MockEmailProvider | None = None


def get_mock_provider() -> MockEmailProvider:
    global _global_mock_provider
    if _global_mock_provider is None:
        _global_mock_provider = MockEmailProvider()
    return _global_mock_provider


def get_email_provider(settings: Settings | None = None) -> EmailProvider:
    """Factory to retrieve the configured EmailProvider based on application settings."""
    cfg = settings or global_settings
    provider_type = (cfg.EMAIL_PROVIDER or "mock").lower().strip()

    if provider_type == "smtp":
        return SMTPEmailProvider(cfg)
    elif provider_type in ["gmail", "gmail_oauth"]:
        return GmailEmailProvider(cfg)
    else:
        return get_mock_provider()


__all__ = [
    "EmailMessage",
    "SendResult",
    "ProviderHealth",
    "EmailProvider",
    "MockEmailProvider",
    "SMTPEmailProvider",
    "GmailEmailProvider",
    "GmailOAuthProvider",
    "get_email_provider",
    "get_mock_provider",
]
