from __future__ import annotations

from typing import List
from app.services.discovery.base import CandidateCompany
from app.services.discovery.config import BrandConfig


class DecisionMakerRoleSelector:
    """Selects targeted decision-maker roles for B2B insurance outreach based on company profile."""

    def __init__(self, brand_config: BrandConfig):
        self.brand_config = brand_config

    def roles_for(self, candidate: CandidateCompany) -> List[str]:
        description = (candidate.description or "").lower()
        if "wholesale" in description or "manufactur" in description or "logistics" in description:
            preferred = ["managing director", "operations director", "risk manager", "finance director", "VP operations"]
            matched = [role for role in preferred if role.lower() in [r.lower() for r in self.brand_config.decision_maker_roles]]
            return matched or self.brand_config.decision_maker_roles
        return self.brand_config.decision_maker_roles[:4]
