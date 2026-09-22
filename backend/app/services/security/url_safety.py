from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlparse

import httpx

from app.services.security.dns_resolver import install_resilient_dns

install_resilient_dns()


class UnsafeURL(ValueError):
    """Raised when a URL fails SSRF safety validation."""
    pass


def validate_public_http_url(url: str) -> str:
    """Validate that a URL is a public HTTP/HTTPS URL and not an internal network or metadata IP (SSRF safe)."""
    if not url:
        raise UnsafeURL("URL cannot be empty")
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        raise UnsafeURL("Only http and https URLs are allowed")
    if not parsed.hostname:
        raise UnsafeURL("URL must include a valid hostname")

    host = parsed.hostname.lower()
    blocked_hosts = {
        "localhost",
        "metadata.google.internal",
        "metadata.internal",
        "169.254.169.254",
        "instance-data",
    }
    if host in blocked_hosts or host.endswith(".local") or host.endswith(".internal"):
        raise UnsafeURL("Local and metadata hosts are not allowed")

    # Check IP literal directly
    try:
        direct_ip = ipaddress.ip_address(host)
        if direct_ip.is_private or direct_ip.is_loopback or direct_ip.is_link_local or direct_ip.is_multicast or direct_ip.is_reserved:
            raise UnsafeURL("Private, loopback, link-local, reserved, and multicast IPs are blocked")
    except ValueError:
        # Not a direct IP literal, resolve via DNS
        pass

    try:
        addresses = socket.getaddrinfo(host, None)
    except socket.gaierror as exc:
        raise UnsafeURL("Hostname could not be resolved safely") from exc

    for addr in addresses:
        ip = ipaddress.ip_address(addr[4][0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_reserved:
            raise UnsafeURL("Private, loopback, link-local, reserved, and multicast IPs are blocked")

    return url


def safe_fetch_text(url: str, max_bytes: int = 50_000) -> str:
    """Safely fetch HTML/text content from a public URL with SSRF protection, strict timeouts, and max bytes."""
    validate_public_http_url(url)
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
    with httpx.Client(timeout=httpx.Timeout(4.0, connect=2.0), follow_redirects=True) as client:
        with client.stream("GET", url, headers=headers) as response:
            response.raise_for_status()
            location = str(response.url)
            validate_public_http_url(location)
            chunks = []
            total = 0
            for chunk in response.iter_bytes():
                chunks.append(chunk)
                total += len(chunk)
                if total >= max_bytes:
                    break
            content = b"".join(chunks)
    return content.decode("utf-8", errors="replace")
