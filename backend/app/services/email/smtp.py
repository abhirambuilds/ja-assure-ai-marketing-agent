from __future__ import annotations

import html
import logging
import smtplib
import uuid
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Dict, List

from app.config import Settings
from app.services.email.base import EmailMessage, EmailProvider, ProviderHealth, SendResult

logger = logging.getLogger("app.email.smtp")


class SMTPEmailProvider(EmailProvider):
    """Standard SMTP Email Provider.

    Supports Gmail SMTP (smtp.gmail.com:587 with App Password), Outlook,
    SendGrid, Mailgun, AWS SES, or any compliant SMTP service.
    """

    name = "smtp"

    def __init__(self, settings: Settings):
        self.settings = settings

    def _configured(self) -> bool:
        return bool(
            self.settings.REAL_EMAIL_ENABLED
            and self.settings.REAL_PROVIDER_SEND
            and self.settings.SMTP_USER
            and self.settings.SMTP_PASSWORD
        )

    def send_message(self, message: EmailMessage) -> SendResult:
        if not self._configured():
            return SendResult(
                sent=False,
                error="Real email sending is disabled or SMTP credentials (SMTP_USER, SMTP_PASSWORD) are missing.",
            )

        from_addr = self.settings.SMTP_FROM_EMAIL or self.settings.SMTP_USER
        msg = MIMEMultipart("alternative")
        msg["From"] = from_addr
        msg["To"] = message.to
        msg["Subject"] = message.subject

        # RFC 8058 compliant unsubscribe headers (required by Gmail & Yahoo)
        msg["List-Unsubscribe"] = f"<mailto:{from_addr}?subject=unsubscribe>"
        msg["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click"

        # Apply any custom caller headers
        for k, v in message.headers.items():
            if k not in msg:
                msg[k] = v

        msg_id = f"smtp-{uuid.uuid4().hex[:12]}"
        host = self.settings.SMTP_HOST or "smtp.jaassure.com"
        msg["Message-ID"] = f"<{msg_id}@{host}>"

        escaped_body = html.escape(message.body).replace("\n", "<br>")
        html_content = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; padding: 16px;">
  <div style="font-size: 14px; margin-bottom: 24px;">{escaped_body}</div>
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
  <p style="font-size: 11px; color: #94a3b8; line-height: 1.4;">
    JA Assure · Lloyd's of London Coverholder · Automated Intelligence &amp; Engagement Agent<br>
    To opt out of future communications, simply reply to this email with &quot;unsubscribe&quot;.
  </p>
</body>
</html>"""

        msg.attach(MIMEText(message.body, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        try:
            if self.settings.SMTP_PORT == 465:
                server = smtplib.SMTP_SSL(self.settings.SMTP_HOST, self.settings.SMTP_PORT, timeout=15.0)
            else:
                server = smtplib.SMTP(self.settings.SMTP_HOST, self.settings.SMTP_PORT, timeout=15.0)
                server.ehlo()
                server.starttls()
                server.ehlo()

            server.login(self.settings.SMTP_USER, self.settings.SMTP_PASSWORD)
            server.sendmail(from_addr, [message.to], msg.as_string())
            server.quit()
            logger.info("Successfully dispatched SMTP email to %s (Message-ID: %s)", message.to, msg_id)
            return SendResult(sent=True, provider_message_id=msg_id)
        except Exception as exc:
            # Crucial: NEVER log or expose password in error messages
            err_msg = str(exc)
            if self.settings.SMTP_PASSWORD and self.settings.SMTP_PASSWORD in err_msg:
                err_msg = err_msg.replace(self.settings.SMTP_PASSWORD, "********")
            logger.error("SMTP dispatch failed: %s", err_msg)
            return SendResult(sent=False, error=f"SMTP dispatch failed: {err_msg}")

    def get_messages(self) -> List[Dict[str, Any]]:
        # SMTP protocol is outbound-only.
        return []

    def get_thread(self, thread_id: str) -> List[Dict[str, Any]]:
        return []

    def health_check(self) -> ProviderHealth:
        configured = self._configured()
        return ProviderHealth(
            provider=self.name,
            healthy=configured,
            mode="real" if configured else "unconfigured",
            detail=f"Host: {self.settings.SMTP_HOST}:{self.settings.SMTP_PORT}, User: {self.settings.SMTP_USER or 'None'}",
        )
