from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from urllib.parse import urlparse
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.models.entities import (
    Competitor,
    CompetitorSnapshot,
    CompetitorChange,
    CompetitorBattlecard,
    utc_now,
)
from app.services.competitors.monitor import competitor_monitor
from app.services.competitors.change_detector import change_detector
from app.services.competitors.battlecard_generator import battlecard_generator
from app.services.competitors.seed_data import seed_initial_competitors

logger = logging.getLogger("ja_assure.competitor_service")


class CompetitorService:
    """
    Core domain service for Competitor Radar:
    Orchestrates live monitoring, snapshot archiving, SHA-256 change detection,
    explainable threat assessment, and sales battlecard generation.
    """

    def ensure_seeded(self, db: Session) -> int:
        """Ensures baseline competitor intelligence is initialized."""
        return seed_initial_competitors(db)

    def list_competitors(
        self,
        db: Session,
        brand: Optional[str] = None,
        category: Optional[str] = None,
        niche: Optional[str] = None,
        threat_level: Optional[str] = None,
        is_active: Optional[bool] = None,
        limit: int = 50,
    ) -> List[Competitor]:
        """Lists competitors with optional filters and automatic seeding on empty DB."""
        count = db.execute(select(Competitor.id)).first()
        if not count:
            self.ensure_seeded(db)

        query = select(Competitor)
        effective_cat = category or niche
        if effective_cat and effective_cat != "all":
            query = query.where(Competitor.category == effective_cat)
        if brand and brand != "all":
            query = query.where(Competitor.brand == brand)
        if threat_level and threat_level != "all":
            query = query.where(Competitor.threat_level == threat_level)
        if is_active is not None:
            query = query.where(Competitor.is_active == is_active)

        query = query.order_by(desc(Competitor.last_monitored_at), desc(Competitor.collected_at)).limit(limit)
        return list(db.execute(query).scalars().all())

    def get_competitor(self, db: Session, competitor_id: int) -> Optional[Competitor]:
        """Retrieves a single competitor by ID."""
        return db.get(Competitor, competitor_id)

    def create_competitor(self, db: Session, data: Dict[str, Any]) -> Competitor:
        """Creates a new competitor record with automatic domain parsing and initial battlecard."""
        name = data.get("name", "").strip()
        if not name:
            raise ValueError("Competitor name is required")

        url = data.get("url") or data.get("website_url")
        domain = data.get("domain")
        if not domain and url:
            try:
                parsed_url = urlparse(url)
                domain = parsed_url.netloc.replace("www.", "")
            except Exception:
                domain = None

        category = data.get("category") or data.get("niche") or "jewellery"
        brand = data.get("brand")
        if not brand:
            cat_lower = category.lower()
            if "jewel" in cat_lower or "jade" in cat_lower:
                brand = "jade"
            elif "transit" in cat_lower or "specie" in cat_lower or "cargo" in cat_lower:
                brand = "jaguartransit"
            elif "med" in cat_lower or "clinic" in cat_lower or "doctor" in cat_lower:
                brand = "doctorshield"
            else:
                brand = "jade"

        social_handles = data.get("social_handles") or data.get("social_handles_json")
        social_json = json.dumps(social_handles) if isinstance(social_handles, dict) else social_handles

        comp = Competitor(
            name=name,
            url=url,
            domain=domain,
            brand=brand,
            category=category,
            market=data.get("market", "Singapore"),
            title=data.get("title") or f"{name} Profile",
            summary=data.get("summary") or f"{name} competitor profile in {category}.",
            pricing_summary=data.get("pricing_summary"),
            coverage_strengths=data.get("coverage_strengths"),
            coverage_weaknesses=data.get("coverage_weaknesses"),
            underwriter=data.get("underwriter"),
            target_customer_size=data.get("target_customer_size"),
            threat_level=data.get("threat_level", "medium"),
            social_handles_json=social_json,
            is_active=data.get("is_active", True),
            relevance=data.get("relevance", 0.75),
            source=data.get("source", "public_web"),
        )
        db.add(comp)
        db.flush()

        # Generate baseline battlecard
        try:
            bc_data = battlecard_generator.generate_battlecard(comp)
            bc = CompetitorBattlecard(
                competitor_id=comp.id,
                ja_product=bc_data.get("ja_product", "JA Assure"),
                why_ja_wins_json=json.dumps(bc_data.get("why_ja_wins", [])),
                where_competitor_wins_json=json.dumps(bc_data.get("where_competitor_wins", [])),
                objection_handling_json=json.dumps(bc_data.get("objection_handling", {})),
                pricing_comparison=bc_data.get("pricing_comparison"),
                sales_pitch_hook=bc_data.get("sales_pitch_hook"),
            )
            db.add(bc)
        except Exception as exc:
            logger.warning(f"Battlecard auto-generation failed for new competitor {comp.name}: {exc}")

        db.commit()
        db.refresh(comp)
        return comp

    def scan_competitor(self, db: Session, competitor_id: int) -> Dict[str, Any]:
        """
        Scans a single competitor website, calculates SHA-256 content hash,
        saves a snapshot, detects changes against previous version, updates threat level,
        and refreshes the sales battlecard.
        """
        comp = db.get(Competitor, competitor_id)
        if not comp:
            raise ValueError(f"Competitor #{competitor_id} not found")

        # 1. Retrieve latest snapshot for diffing
        prev_snapshot = (
            db.query(CompetitorSnapshot)
            .filter(CompetitorSnapshot.competitor_id == comp.id)
            .order_by(desc(CompetitorSnapshot.snapshot_date))
            .first()
        )

        target_url = comp.url or (f"https://{comp.domain}" if comp.domain else "https://ja-assure.com")

        # 2. Inspect website & extract intelligence
        parsed = competitor_monitor.inspect_competitor(
            competitor_name=comp.name,
            niche=comp.category,
            url=target_url,
            known_strengths=comp.coverage_strengths,
            known_pricing=comp.pricing_summary,
            brand=comp.brand,
        )

        # 3. Archive new snapshot
        snapshot = CompetitorSnapshot(
            competitor_id=comp.id,
            page_url=parsed.page_url,
            page_title=parsed.page_title,
            content_hash=parsed.content_hash,
            pricing_data_json=json.dumps(parsed.pricing_data),
            coverage_terms_json=json.dumps(parsed.coverage_terms),
            public_announcements_json=json.dumps(parsed.public_announcements),
            raw_text_excerpt=parsed.raw_text_excerpt,
            captured_at=utc_now(),
        )
        db.add(snapshot)

        # Update competitor pricing summary & monitored timestamp
        if parsed.pricing_data and parsed.pricing_data.get("pricing_summary"):
            comp.pricing_summary = parsed.pricing_data["pricing_summary"]
        comp.last_monitored_at = utc_now()
        comp.updated_at = utc_now()

        # 4. Detect changes
        detected_diffs = change_detector.detect_changes(
            competitor_name=comp.name,
            competitor_id=comp.id,
            new_data={
                "content_hash": parsed.content_hash,
                "pricing_data": parsed.pricing_data,
                "coverage_terms": parsed.coverage_terms,
                "public_announcements": parsed.public_announcements,
            },
            prev_snapshot=prev_snapshot,
            source_url=target_url,
        )

        saved_changes: List[CompetitorChange] = []
        has_critical_change = False
        for diff in detected_diffs:
            change = CompetitorChange(
                competitor_id=comp.id,
                change_type=diff["change_type"],
                severity=diff.get("severity", "major"),
                title=diff["title"],
                description=diff["description"],
                old_value=diff.get("old_value"),
                new_value=diff.get("new_value"),
                source_url=diff.get("source_url"),
                detected_at=utc_now(),
            )
            db.add(change)
            saved_changes.append(change)
            if diff.get("severity") == "critical":
                has_critical_change = True

        # Explainable Threat Level Adjustment
        if has_critical_change and comp.threat_level != "high":
            comp.threat_level = "high"
            logger.info(f"Escalated threat level for {comp.name} to HIGH due to critical pricing revision.")

        # 5. Refresh battlecard
        battlecard_updated = False
        try:
            bc_data = battlecard_generator.generate_battlecard(comp)
            existing_bc = (
                db.query(CompetitorBattlecard)
                .filter(CompetitorBattlecard.competitor_id == comp.id)
                .first()
            )
            if existing_bc:
                existing_bc.ja_product = bc_data.get("ja_product", existing_bc.ja_product)
                existing_bc.why_ja_wins_json = json.dumps(bc_data.get("why_ja_wins", []))
                existing_bc.where_competitor_wins_json = json.dumps(bc_data.get("where_competitor_wins", []))
                existing_bc.objection_handling_json = json.dumps(bc_data.get("objection_handling", {}))
                existing_bc.pricing_comparison = bc_data.get("pricing_comparison")
                existing_bc.sales_pitch_hook = bc_data.get("sales_pitch_hook")
                existing_bc.updated_at = utc_now()
            else:
                new_bc = CompetitorBattlecard(
                    competitor_id=comp.id,
                    ja_product=bc_data.get("ja_product", "JA Assure"),
                    why_ja_wins_json=json.dumps(bc_data.get("why_ja_wins", [])),
                    where_competitor_wins_json=json.dumps(bc_data.get("where_competitor_wins", [])),
                    objection_handling_json=json.dumps(bc_data.get("objection_handling", {})),
                    pricing_comparison=bc_data.get("pricing_comparison"),
                    sales_pitch_hook=bc_data.get("sales_pitch_hook"),
                )
                db.add(new_bc)
            battlecard_updated = True
        except Exception as exc:
            logger.warning(f"Battlecard refresh failed for {comp.name}: {exc}")

        db.commit()
        return {
            "competitor_id": comp.id,
            "status": "success" if parsed.fetch_success else "partial_fallback",
            "content_hash": parsed.content_hash,
            "changes_detected": len(saved_changes),
            "changes": [
                {
                    "id": c.id,
                    "competitor_id": c.competitor_id,
                    "change_type": c.change_type,
                    "severity": c.severity,
                    "title": c.title,
                    "description": c.description,
                    "old_value": c.old_value,
                    "new_value": c.new_value,
                    "source_url": c.source_url,
                    "detected_at": c.detected_at,
                }
                for c in saved_changes
            ],
            "battlecard_updated": battlecard_updated,
        }

    def scan_all_competitors(self, db: Session, niche: Optional[str] = None) -> List[Dict[str, Any]]:
        """Scans all active competitors in the database."""
        competitors = self.list_competitors(db, niche=niche, is_active=True, limit=50)
        results: List[Dict[str, Any]] = []
        for comp in competitors:
            try:
                res = self.scan_competitor(db, comp.id)
                results.append(res)
            except Exception as exc:
                db.rollback()
                logger.warning(f"Scan failed for competitor {comp.name}: {exc}")
                results.append({
                    "competitor_id": comp.id,
                    "status": "error",
                    "content_hash": "",
                    "changes_detected": 0,
                    "changes": [],
                    "battlecard_updated": False,
                    "error": str(exc),
                })
        return results

    def list_snapshots(self, db: Session, competitor_id: int, limit: int = 20) -> List[CompetitorSnapshot]:
        """Lists archived snapshots for a competitor."""
        query = (
            select(CompetitorSnapshot)
            .where(CompetitorSnapshot.competitor_id == competitor_id)
            .order_by(desc(CompetitorSnapshot.snapshot_date))
            .limit(limit)
        )
        return list(db.execute(query).scalars().all())

    def list_changes(
        self, db: Session, competitor_id: Optional[int] = None, limit: int = 50
    ) -> List[CompetitorChange]:
        """Lists detected changes globally or for a specific competitor."""
        query = select(CompetitorChange)
        if competitor_id:
            query = query.where(CompetitorChange.competitor_id == competitor_id)
        query = query.order_by(desc(CompetitorChange.detected_at)).limit(limit)
        return list(db.execute(query).scalars().all())

    def get_battlecard(
        self, db: Session, competitor_id: int, force_regenerate: bool = False
    ) -> CompetitorBattlecard:
        """Returns existing battlecard or generates a new one."""
        comp = db.get(Competitor, competitor_id)
        if not comp:
            raise ValueError(f"Competitor #{competitor_id} not found")

        bc = (
            db.query(CompetitorBattlecard)
            .filter(CompetitorBattlecard.competitor_id == competitor_id)
            .first()
        )

        if not bc or force_regenerate:
            bc_data = battlecard_generator.generate_battlecard(comp)
            if not bc:
                bc = CompetitorBattlecard(
                    competitor_id=comp.id,
                    ja_product=bc_data.get("ja_product", "JA Assure"),
                    why_ja_wins_json=json.dumps(bc_data.get("why_ja_wins", [])),
                    where_competitor_wins_json=json.dumps(bc_data.get("where_competitor_wins", [])),
                    objection_handling_json=json.dumps(bc_data.get("objection_handling", {})),
                    pricing_comparison=bc_data.get("pricing_comparison"),
                    sales_pitch_hook=bc_data.get("sales_pitch_hook"),
                )
                db.add(bc)
            else:
                bc.ja_product = bc_data.get("ja_product", bc.ja_product)
                bc.why_ja_wins_json = json.dumps(bc_data.get("why_ja_wins", []))
                bc.where_competitor_wins_json = json.dumps(bc_data.get("where_competitor_wins", []))
                bc.objection_handling_json = json.dumps(bc_data.get("objection_handling", {}))
                bc.pricing_comparison = bc_data.get("pricing_comparison")
                bc.sales_pitch_hook = bc_data.get("sales_pitch_hook")
                bc.updated_at = utc_now()

            db.commit()
            db.refresh(bc)

        return bc

    def get_competitive_hook_for_lead(
        self, db: Session, brand: Optional[str] = None, industry: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Cross-module integration with Phase 1 (Lead Discovery).
        Returns a relevant competitor counter-pitch hook for a given lead's brand/industry.
        """
        self.ensure_seeded(db)

        combined = f"{brand or ''} {industry or ''}".lower()
        if "transit" in combined or "specie" in combined or "logistics" in combined or "cargo" in combined or "freight" in combined:
            niche = "transit"
            ja_product = "Jaguar Transit"
        elif "doctor" in combined or "med" in combined or "clinic" in combined or "health" in combined:
            niche = "medical"
            ja_product = "DoctorShield"
        else:
            niche = "jewellery"
            ja_product = "Jade"

        # Find top competitor in niche with battlecard
        comp = (
            db.query(Competitor)
            .filter(Competitor.category == niche)
            .order_by(desc(Competitor.threat_level == "high"), desc(Competitor.relevance))
            .first()
        )

        if comp:
            bc = (
                db.query(CompetitorBattlecard)
                .filter(CompetitorBattlecard.competitor_id == comp.id)
                .first()
            )
            if not bc:
                bc = self.get_battlecard(db, comp.id)

            return {
                "competitor_id": comp.id,
                "competitor_name": comp.name,
                "ja_product": bc.ja_product if bc else ja_product,
                "sales_pitch_hook": bc.sales_pitch_hook or f"How often does {comp.name} review your coverage warranties?",
                "why_ja_wins": bc.why_ja_wins if bc else ["100% digital onboarding with Lloyd's A+ coverholder security"],
                "where_competitor_wins": bc.where_competitor_wins if bc else ["Legacy brand history in Southeast Asia"],
                "objection_handling": bc.objection_handling if bc else {
                    f"We have used {comp.name} for years": "JA Assure provides Lloyd's contract certainty with 15-25% lower overhead."
                },
                "pricing_comparison": bc.pricing_comparison or f"JA Assure delivers 15-25% lower net premium compared to {comp.name}.",
            }

        return None


competitor_service = CompetitorService()
