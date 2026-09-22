from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from app.models.entities import CompetitorSnapshot

logger = logging.getLogger("ja_assure.competitors.change_detector")


class ChangeDetector:
    """
    Compares consecutive competitor snapshots to identify actionable changes
    in pricing, coverage terms, product additions, and public announcements.
    """

    def detect_changes(
        self,
        competitor_name: str,
        competitor_id: int,
        new_data: Dict[str, Any],
        prev_snapshot: Optional[CompetitorSnapshot],
        source_url: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        changes: List[Dict[str, Any]] = []

        if not prev_snapshot:
            # Baseline snapshot: return any notable public announcements as initial alert
            announcements = new_data.get("public_announcements") or []
            for ann in announcements[:1]:
                changes.append({
                    "competitor_id": competitor_id,
                    "change_type": "social_campaign",
                    "severity": "minor",
                    "title": ann.get("title", f"{competitor_name} market intelligence baseline established"),
                    "description": ann.get("summary", f"{competitor_name} active in market."),
                    "old_value": "Baseline monitoring initialized",
                    "new_value": ann.get("summary", "Active policy underwriting observed"),
                    "source_url": source_url,
                })
            return changes

        # Check content hash: if hashes match, no content changes occurred
        new_hash = new_data.get("content_hash")
        if new_hash and prev_snapshot.content_hash and new_hash == prev_snapshot.content_hash:
            logger.debug(f"Snapshot content hash unchanged for {competitor_name} ({new_hash})")
            return []

        old_pricing = prev_snapshot.pricing_data or {}
        new_pricing = new_data.get("pricing_data") or {}

        # 1. Base rate indicator changes (Critical severity)
        old_rate = str(old_pricing.get("base_rate") or "").strip()
        new_rate = str(new_pricing.get("base_rate") or "").strip()
        if old_rate and new_rate and old_rate.lower() != new_rate.lower():
            changes.append({
                "competitor_id": competitor_id,
                "change_type": "pricing_change",
                "severity": "critical",
                "title": f"{competitor_name} revised baseline underwriting rate",
                "description": f"Base rate indicator changed from '{old_rate}' to '{new_rate}'.",
                "old_value": old_rate,
                "new_value": new_rate,
                "source_url": source_url,
            })

        # 2. Minimum premium adjustments (Major severity)
        old_min = str(old_pricing.get("minimum_premium") or "").strip()
        new_min = str(new_pricing.get("minimum_premium") or "").strip()
        if old_min and new_min and old_min.lower() != new_min.lower():
            changes.append({
                "competitor_id": competitor_id,
                "change_type": "pricing_change",
                "severity": "major",
                "title": f"{competitor_name} adjusted minimum premium threshold",
                "description": f"Competitor minimum premium changed from '{old_min}' to '{new_min}'.",
                "old_value": old_min,
                "new_value": new_min,
                "source_url": source_url,
            })

        # 3. Deductible terms adjustments (Major severity)
        old_ded = str(old_pricing.get("deductible_terms") or "").strip()
        new_ded = str(new_pricing.get("deductible_terms") or "").strip()
        if old_ded and new_ded and old_ded.lower() != new_ded.lower():
            changes.append({
                "competitor_id": competitor_id,
                "change_type": "pricing_change",
                "severity": "major",
                "title": f"{competitor_name} modified standard deductible terms",
                "description": f"Deductible structure adjusted from '{old_ded}' to '{new_ded}'.",
                "old_value": old_ded,
                "new_value": new_ded,
                "source_url": source_url,
            })

        # 4. Coverage terms & exclusions change detection
        old_coverage = prev_snapshot.coverage_terms or {}
        new_coverage = new_data.get("coverage_terms") or {}

        old_exclusions = set(old_coverage.get("exclusions") or [])
        new_exclusions = set(new_coverage.get("exclusions") or [])
        added_exclusions = new_exclusions - old_exclusions
        if added_exclusions:
            changes.append({
                "competitor_id": competitor_id,
                "change_type": "coverage_update",
                "severity": "major",
                "title": f"{competitor_name} introduced new coverage restrictions/warranties",
                "description": f"New exclusions or warranty criteria detected: {', '.join(added_exclusions)}.",
                "old_value": ", ".join(old_exclusions) or "Standard terms",
                "new_value": ", ".join(new_exclusions),
                "source_url": source_url,
            })

        old_inclusions = set(old_coverage.get("inclusions") or [])
        new_inclusions = set(new_coverage.get("inclusions") or [])
        added_inclusions = new_inclusions - old_inclusions
        if added_inclusions:
            changes.append({
                "competitor_id": competitor_id,
                "change_type": "coverage_update",
                "severity": "minor",
                "title": f"{competitor_name} expanded coverage endorsements",
                "description": f"New endorsements or included perils observed: {', '.join(added_inclusions)}.",
                "old_value": ", ".join(old_inclusions) or "Standard terms",
                "new_value": ", ".join(new_inclusions),
                "source_url": source_url,
            })

        # 5. Public announcements & commercial campaigns
        old_announcements = {a.get("title") for a in (prev_snapshot.public_announcements or []) if a.get("title")}
        new_announcements = new_data.get("public_announcements") or []
        for ann in new_announcements:
            title = ann.get("title")
            if title and title not in old_announcements:
                changes.append({
                    "competitor_id": competitor_id,
                    "change_type": "social_campaign",
                    "severity": "minor",
                    "title": title,
                    "description": ann.get("summary", f"{competitor_name} announced new market initiative."),
                    "old_value": "Not previously announced",
                    "new_value": ann.get("summary", ""),
                    "source_url": source_url,
                })

        return changes


change_detector = ChangeDetector()
