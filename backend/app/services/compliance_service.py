import re
import json
import logging
from typing import Dict, Any, List, Optional
from app.schemas.agent_contracts import ComplianceResult, ComplianceViolation
from app.services.llm_provider import llm_provider

logger = logging.getLogger("ja_assure.compliance")

COMPLIANCE_RULES = [
    {
        "id": "RULE-01-FALSE-GUARANTEES",
        "name": "False or Unconditional Guarantees",
        "patterns": [
            r"\b100%\s*(guaranteed|risk[\s-]free|protection|payout)\b",
            r"\bguaranteed\s*(payout|claim|approval|replacement)\b",
            r"\bnever\s*denied\b",
            r"\bzero\s*risk\b",
            r"\bno\s*questions?\s*asked\b"
        ],
        "severity": "critical",
        "penalty": 35.0,
        "explanation": "Insurance regulations strictly prohibit absolute guarantee claims without underwriting conditions.",
        "suggested_fix": "Replace absolute claims with 'Comprehensive protection subject to policy underwriting criteria'."
    },
    {
        "id": "RULE-02-UNSUPPORTED-COVERAGE",
        "name": "Unsupported or Total Coverage Claims",
        "patterns": [
            r"\bcovers?\s*(everything|all\s*losses?|anything)\b",
            r"\bunlimited\s*(coverage|protection|liability)\b",
            r"\bcomplete\s*immunity\b",
            r"\bnever\s*pay\s*out\s*of\s*pocket\b"
        ],
        "severity": "critical",
        "penalty": 25.0,
        "explanation": "Claiming unlimited or all-inclusive coverage misrepresents policy exclusions and statutory sub-limits.",
        "suggested_fix": "Specify the exact agreed-value coverage parameters and policy limits."
    },
    {
        "id": "RULE-03-MISSING-DISCLAIMER",
        "name": "Missing Regulatory Intermediary Disclaimer",
        "patterns": [
            r"terms\s*(and|&|,)\s*conditions",
            r"terms\s*apply",
            r"subject\s*to\s*underwriting",
            r"underwritten\s*by",
            r"terma\s*dan\s*syarat",
            r"syarat\s*dan\s*ketentuan",
            r"条款",
            r"เงื่อนไข"
        ],
        "severity": "warning",
        "penalty": 20.0,
        "is_absence_rule": True,
        "explanation": "Licensed insurance marketing requires standard regulatory disclaimers in the copy.",
        "suggested_fix": "Append: '*Terms, conditions, and underwriting limits apply. JA Assure is a registered insurance broker.*'"
    },
    {
        "id": "RULE-04-MEDICAL-ADVICE",
        "name": "Prohibited Medical Advice or Diagnosis Claims",
        "brand_filter": "doctorshield",
        "patterns": [
            r"\bdiagnos(e|is|ing)\b",
            r"\btreat(ment)?\s*guidelines?\b",
            r"\bcure\b",
            r"\bprescribe\b",
            r"\bclinical\s*outcome\s*guarantee\b"
        ],
        "severity": "critical",
        "penalty": 30.0,
        "explanation": "DoctorShield marketing is for indemnity coverage only and must never offer clinical medical advice or diagnosis.",
        "suggested_fix": "Confine copy strictly to legal defence counsel, indemnity policy limits, and retroactive liability cover."
    },
    {
        "id": "RULE-05-UNSUBSTANTIATED-PRICING",
        "name": "Unsubstantiated or Superlative Pricing Claims",
        "patterns": [
            r"\bcheapest\s*(in\s*the\s*country|in\s*asia|insurance|rates?)\b",
            r"\blowest\s*(rates?|premiums?|prices?)\s*(guaranteed)?\b",
            r"\bunbeatable\s*premiums?\b"
        ],
        "severity": "warning",
        "penalty": 15.0,
        "explanation": "Superlative pricing claims without comparative independent survey documentation breach fair competition regulations.",
        "suggested_fix": "Use 'Competitive, tailored specialist rates' rather than superlative claims."
    },
    {
        "id": "RULE-06-MISLEADING-COMPETITOR-COMPARISONS",
        "name": "Misleading or Disparaging Competitor Comparisons",
        "patterns": [
            r"\bbetter\s*than\s*(competitor|singmed|briteprotect|cargosafe)\b",
            r"\bdon['']t\s*trust\s*other\s*insurers\b",
            r"\bother\s*brokers\s*(scam|deceive|cheat)\b"
        ],
        "severity": "critical",
        "penalty": 25.0,
        "explanation": "Direct unverified disparagement of competitor insurance policies is prohibited by advertising authorities.",
        "suggested_fix": "Highlight JA Assure's strengths objectively without derogatory references to named competitors."
    }
]

class ComplianceService:
    """
    Hybrid Insurance Compliance Gate.
    Combines deterministic regulatory scanning with Gemini LLM review.
    Features automated Compliance Rewrite correction workflow.
    """

    async def evaluate_content(self, brand: str, content_text: str, content_type: str = "post") -> ComplianceResult:
        brand_clean = brand.lower()
        score = 100.0
        violations: List[ComplianceViolation] = []
        suggestions: List[str] = []
        disclaimers: List[str] = []

        # 1. Deterministic Rule-Based Scanning
        for rule in COMPLIANCE_RULES:
            if "brand_filter" in rule and rule["brand_filter"] != brand_clean:
                continue

            if rule.get("is_absence_rule"):
                found_disclaimer = any(re.search(pat, content_text, re.IGNORECASE) for pat in rule["patterns"])
                if not found_disclaimer:
                    score -= rule["penalty"]
                    violations.append(
                        ComplianceViolation(
                            rule_id=rule["id"],
                            severity=rule["severity"],
                            message=rule["explanation"],
                            flagged_phrase="Missing mandatory disclaimer",
                            suggested_fix=rule["suggested_fix"]
                        )
                    )
                    disclaimers.append("Terms, conditions, and underwriting limits apply. Underwritten by licensed partner insurers.")
                    suggestions.append(rule["suggested_fix"])
                continue

            for pat in rule["patterns"]:
                match = re.search(pat, content_text, re.IGNORECASE)
                if match:
                    matched_text = match.group(0)
                    score -= rule["penalty"]
                    violations.append(
                        ComplianceViolation(
                            rule_id=rule["id"],
                            severity=rule["severity"],
                            message=f"{rule['name']}: {rule['explanation']}",
                            flagged_phrase=matched_text,
                            suggested_fix=rule["suggested_fix"]
                        )
                    )
                    suggestions.append(rule["suggested_fix"])
                    break

        # 2. Gemini LLM Review Layer (Hybrid verification if live)
        if llm_provider.is_live:
            try:
                llm_prompt = (
                    f"You are a licensed insurance compliance officer for {brand_clean}. "
                    f"Audit this copy for regulatory risks:\n\n"
                    f"\"{content_text}\"\n\n"
                    f"Flag any unmentioned exclusions, false coverage, medical advice, or missing disclosures."
                )
                llm_result: ComplianceResult = llm_provider.generate_structured(
                    prompt=llm_prompt,
                    schema=ComplianceResult,
                    system_instruction="Strict insurance compliance auditor. Return structured evaluation."
                )
                if not llm_result.passed and llm_result.violations:
                    for v in llm_result.violations:
                        if not any(ev.rule_id == v.rule_id for ev in violations):
                            violations.append(v)
                            score = min(score, llm_result.score)
                            if v.suggested_fix:
                                suggestions.append(v.suggested_fix)
            except Exception as e:
                logger.warning(f"Gemini compliance review fallback: {e}")

        final_score = max(0.0, min(100.0, score))
        has_critical = any(v.severity == "critical" for v in violations)
        passed = (final_score >= 85.0) and not has_critical

        overall_feedback = (
            "Content passed regulatory compliance audit with zero critical violations."
            if passed else
            f"Compliance gate flagged {len(violations)} regulatory violation(s). Score: {final_score}/100. "
            f"Requires correction before human approval."
        )

        return ComplianceResult(
            passed=passed,
            score=round(final_score, 1),
            violations=violations,
            suggestions=suggestions,
            overall_feedback=overall_feedback,
            disclaimers_required=disclaimers
        )

    async def rewrite_non_compliant_content(self, brand: str, original_text: str) -> Dict[str, Any]:
        """
        Compliance Rewrite Workflow:
        1. Evaluate violations in original text
        2. Gemini / deterministic rewriter fixes all violations and adds missing disclaimers
        3. Re-evaluate corrected copy with the compliance gate
        4. Returns corrected text and before/after audit for human review.
        """
        brand_clean = brand.lower()
        initial_eval = await self.evaluate_content(brand=brand_clean, content_text=original_text)

        # Correction prompt
        violations_summary = "\n".join([f"- {v.rule_id}: {v.message} (Flagged: '{v.flagged_phrase}')" for v in initial_eval.violations])

        prompt = (
            f"You are the senior compliance editor for JA Assure {brand_clean}. "
            f"Rewrite the following marketing copy to be 100% compliant while preserving marketing effectiveness:\n\n"
            f"Original Copy:\n\"{original_text}\"\n\n"
            f"Violations to fix:\n{violations_summary}\n\n"
            f"Instructions:\n"
            f"1. Remove any unconditional guarantees (e.g. '100% guaranteed', 'zero risk', 'never denied').\n"
            f"2. Ensure accurate agreed-value policy limits.\n"
            f"3. Strip any medical diagnosis or treatment advice for DoctorShield.\n"
            f"4. Append the mandatory disclaimer: '*Terms, conditions, and underwriting limits apply. Underwritten by licensed partner insurers.*'\n\n"
            f"Return ONLY the corrected copy text."
        )

        if llm_provider.is_live:
            corrected_text = llm_provider.generate_text(
                prompt=prompt,
                system_instruction=f"Licensed insurance compliance editor for {brand_clean}."
            )
        else:
            corrected_text = self._deterministic_compliance_rewrite(brand_clean, original_text, initial_eval.violations)

        # Re-check the corrected copy
        recheck_eval = await self.evaluate_content(brand=brand_clean, content_text=corrected_text)

        return {
            "original_text": original_text,
            "corrected_text": corrected_text,
            "previous_score": initial_eval.score,
            "new_score": recheck_eval.score,
            "previous_passed": initial_eval.passed,
            "new_passed": recheck_eval.passed,
            "resolved_violations": [v.rule_id for v in initial_eval.violations],
            "remaining_violations": [v.rule_id for v in recheck_eval.violations],
            "human_review_required": True # Never automatically approve
        }

    def _deterministic_compliance_rewrite(self, brand: str, text: str, violations: List[ComplianceViolation]) -> str:
        corrected = text
        # 1. Replace absolute guarantees
        corrected = re.sub(r"\b100%\s*(guaranteed|risk[\s-]free|protection|payout)(\s*payout)?\b", "Comprehensive agreed-value protection", corrected, flags=re.IGNORECASE)
        corrected = re.sub(r"\bguaranteed\s*(payout|claim|approval|replacement)\b", "Underwritten agreed-value replacement", corrected, flags=re.IGNORECASE)
        corrected = re.sub(r"\bzero\s*risk\b", "mitigated risk", corrected, flags=re.IGNORECASE)
        corrected = re.sub(r"\bnever\s*denied\b", "transparent claims process", corrected, flags=re.IGNORECASE)
        corrected = re.sub(r"\bno\s*questions?\s*asked\b", "streamlined appraisal verification", corrected, flags=re.IGNORECASE)

        # 2. Fix medical advice in DoctorShield
        if brand == "doctorshield":
            corrected = re.sub(r"\bdiagnos(e|is|ing)\b", "practice management", corrected, flags=re.IGNORECASE)
            corrected = re.sub(r"\btreat(ment)?\s*guidelines?\b", "professional liability", corrected, flags=re.IGNORECASE)
            corrected = re.sub(r"\bprescribe\b", "consult", corrected, flags=re.IGNORECASE)

        # 3. Add mandatory disclaimer if missing
        disclaimer = "*Terms, conditions, and underwriting limits apply. JA Assure is a registered insurance broker.*"
        if not re.search(r"terms\s*(and|&)\s*conditions", corrected, re.IGNORECASE):
            corrected = f"{corrected.strip()}\n\n{disclaimer}"

        return corrected

compliance_service = ComplianceService()
