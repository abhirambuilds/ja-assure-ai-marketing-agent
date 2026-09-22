from __future__ import annotations

import re
from typing import Optional


def normalize_domain(domain: Optional[str]) -> Optional[str]:
    """Extract clean lowercase domain hostname without protocol, www, or path/query."""
    if not domain:
        return None
    value = domain.lower().strip()
    value = re.sub(r"^https?://", "", value)
    value = re.sub(r"^www\.", "", value)
    return value.split("/")[0].split("?")[0].strip() or None


def normalize_company_name(name: str) -> str:
    """Normalize company name by stripping legal entity suffixes, punctuation, and extraneous whitespace."""
    if not name:
        return ""
    lowered = name.lower()
    # Strip common Southeast Asian and international legal suffixes
    legal_suffixes = [
        "pte ltd",
        "private limited",
        "sendirian berhad",
        "sdn bhd",
        "co., ltd",
        "co ltd",
        "pt tbk",
        "pt.",
        "limited",
        "ltd",
        "inc",
        "corp",
        "llc",
        "plc",
    ]
    for suffix in legal_suffixes:
        lowered = lowered.replace(suffix, "")
    # Remove punctuation
    cleaned = re.sub(r"[^\w\s]", " ", lowered)
    # Collapse whitespace
    return " ".join(cleaned.split())


def normalize_phone(phone: Optional[str]) -> Optional[str]:
    """Normalize phone number to purely digits."""
    if not phone:
        return None
    digits = "".join(ch for ch in phone if ch.isdigit())
    return digits or None
