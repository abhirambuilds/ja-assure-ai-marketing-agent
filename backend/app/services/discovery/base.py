from __future__ import annotations

import time
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class SourceEvidence(BaseModel):
    source_type: str
    source_url: str = "https://example.com/source"
    title: Optional[str] = None
    retrieved_at: datetime = Field(default_factory=utc_now)
    evidence_excerpt: str
    provider: str
    confidence: float = Field(ge=0.0, le=1.0, default=0.8)


class CandidateCompany(BaseModel):
    company_name: str
    domain: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    source_provider: str
    source_identifier: Optional[str] = None
    evidence: List[SourceEvidence] = Field(default_factory=list)
    is_demo: bool = False


class Signal(BaseModel):
    signal_type: str
    description: str
    source_url: str
    source_type: str
    observed_at: datetime = Field(default_factory=utc_now)
    confidence: float = Field(ge=0.0, le=1.0)


class Contact(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    email: Optional[str] = None
    email_status: str = "missing" # verified, unverified, invalid, missing
    phone: Optional[str] = None
    source_url: Optional[str] = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)


class ScoreResult(BaseModel):
    total: int = Field(ge=0, le=100)
    breakdown: Dict[str, int]


class DiscoveryRequest(BaseModel):
    brand: str = "doctorshield"
    market: str = "Singapore"
    target_industry: Optional[str] = None
    target_count: int = Field(default=15, ge=1, le=100)
    keywords: Optional[str] = None


class RateLimiter:
    def __init__(self, min_interval_seconds: float = 0.2):
        self.min_interval_seconds = min_interval_seconds
        self._last_call = 0.0

    def wait(self) -> None:
        elapsed = time.monotonic() - self._last_call
        if elapsed < self.min_interval_seconds:
            time.sleep(self.min_interval_seconds - elapsed)
        self._last_call = time.monotonic()


class DiscoveryProvider(ABC):
    name: str

    @abstractmethod
    def discover(self, request: DiscoveryRequest) -> List[CandidateCompany]:
        raise NotImplementedError
