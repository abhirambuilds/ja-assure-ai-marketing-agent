"""
Resilient DNS Resolver with DNS-over-HTTPS (DoH) Direct IP Fallback.

Solves socket.gaierror [Errno 11001] on environments (e.g. Windows corporate/hotspot Wi-Fi)
where local DNS servers fail or time out on external A-record lookups.
Transparently hooks socket.getaddrinfo to resolve via 1.1.1.1 DoH if local DNS fails.
"""
from __future__ import annotations

import json
import logging
import socket
import ssl
import threading
from typing import Any, Dict, List, Tuple
import urllib.request

logger = logging.getLogger("ja_assure.security.dns_resolver")

_orig_getaddrinfo = socket.getaddrinfo

# Pre-seeded bootstrap cache for critical infrastructure hosts
_dns_cache: Dict[str, str] = {
    "cloudflare-dns.com": "104.16.249.249",
    "one.one.one.one": "1.1.1.1",
    "api.groq.com": "104.18.38.236",
    "places.googleapis.com": "172.217.119.4",
    "maps.googleapis.com": "172.217.119.10",
    "dns.google": "8.8.8.8",
}
_cache_lock = threading.Lock()
_installed = False

_ssl_ctx = ssl.create_default_context()
_ssl_ctx.check_hostname = False
_ssl_ctx.verify_mode = ssl.CERT_NONE


def _resolve_doh(host: str) -> List[str]:
    """Resolve A records for host via Cloudflare 1.1.1.1 direct IP DoH (port 443 / HTTPS)."""
    # Try direct IP 1.1.1.1 first (never needs DNS resolution)
    urls = [
        f"https://1.1.1.1/dns-query?name={host}&type=A",
        f"https://1.0.0.1/dns-query?name={host}&type=A",
        f"https://cloudflare-dns.com/dns-query?name={host}&type=A",
    ]

    for url in urls:
        try:
            req = urllib.request.Request(
                url,
                headers={
                    "Accept": "application/dns-json",
                    "Host": "cloudflare-dns.com",
                    "User-Agent": "JA-Assure-DNS-Resolver/1.0",
                },
            )
            with urllib.request.urlopen(req, timeout=2.5, context=_ssl_ctx) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode("utf-8"))
                    answers = data.get("Answer", [])
                    ips = [a["data"] for a in answers if a.get("type") == 1]
                    if ips:
                        return ips
        except Exception as exc:
            logger.debug(f"DoH attempt for {host} via {url} failed: {exc}")
            continue

    return []


def resilient_getaddrinfo(
    host: Any,
    port: Any,
    family: int = 0,
    type: int = 0,
    proto: int = 0,
    flags: int = 0,
) -> List[Tuple[Any, ...]]:
    """Hooked socket.getaddrinfo that falls back to DoH on resolution failure or timeout."""
    # Fast-path for direct IP addresses or non-string hosts
    if not isinstance(host, str) or not host:
        return _orig_getaddrinfo(host, port, family, type, proto, flags)

    # Check cache first for known critical hosts
    with _cache_lock:
        cached_ip = _dns_cache.get(host.lower())

    if cached_ip:
        target_port = int(port) if isinstance(port, (int, str)) and str(port).isdigit() else 0
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (cached_ip, target_port))]

    # Try standard local DNS resolution
    try:
        res = _orig_getaddrinfo(host, port, family, type, proto, flags)
        # If success, cache first IP
        if res and len(res) > 0 and len(res[0]) > 4 and res[0][4]:
            first_ip = str(res[0][4][0])
            with _cache_lock:
                _dns_cache[host.lower()] = first_ip
        return res
    except Exception:
        pass

    # Attempt direct DoH
    ips = _resolve_doh(host)
    if ips:
        resolved_ip = ips[0]
        with _cache_lock:
            _dns_cache[host.lower()] = resolved_ip
        logger.info(f"Resilient DNS resolved '{host}' -> {resolved_ip} via DoH")
        target_port = int(port) if isinstance(port, (int, str)) and str(port).isdigit() else 0
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (resolved_ip, target_port))]

    # If DoH also failed, re-raise original lookup error
    return _orig_getaddrinfo(host, port, family, type, proto, flags)


def install_resilient_dns() -> None:
    """Installs the resilient getaddrinfo patch globally."""
    global _installed
    if not _installed:
        socket.getaddrinfo = resilient_getaddrinfo
        _installed = True
        logger.info("Resilient DNS-over-HTTPS resolver installed with bootstrap cache.")
