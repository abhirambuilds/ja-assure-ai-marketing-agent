# JA Assure AI Marketing Agent — System Architecture & Design

## 1. Executive Summary
The **JA Assure AI Marketing Agent** is an enterprise-grade agentic marketing automation and governance platform custom-engineered for JA Assure's multi-brand ecosystem:
- **Jade**: High-net-worth jewellery & luxury collectible insurance
- **DoctorShield**: Medical professional indemnity insurance
- **Jaguar Transit**: High-value cargo & valuables transit security insurance

The system integrates competitive research, generative multi-format copywriting, insurance compliance verification, closed-loop human-in-the-loop learning, lead scoring, and automated multi-channel publishing into an auditable pipeline.

---

## 2. Core Pipelines

### A. The Brain — Content Generation & Compliance Loop
```
[Research Agent]
       │
       ▼ (Market Context & Competitor Intel)
[Content Agent] ◄──────┐
       │               │
       ▼ (Variations)  │ (Injects Lessons Learned)
[Compliance Gate]      │
       │               │
       ▼ (Passed / Flagged)
[Human Review Queue]   │
  ┌────┴───────────────┐
  ▼                    ▼
[Approved]        [Rejected / Edited]
  │                    │
  ▼                    ▼
[Publishing Queue]   [Feedback Agent]
  │                    │
  ▼                    ▼
[Social Channels]    [Lessons Learned Database]
```

### B. Lead Intelligence & Personalized Outreach
```
[Lead Agent]
       │ (Directory Ingestion & Web Sources)
       ▼
[Fit Scoring & Enrichment] (0 - 100 Risk & Persona Fit)
       │
       ▼
[Personalized Outreach Drafting]
       │
       ▼
[Sales Human Review & Dispatch]
```

---

## 3. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Backend Framework** | Python 3.13, FastAPI | High-performance async REST API, automated OpenAPI docs |
| **Data Models & Validation** | Pydantic v2 | Strict JSON schema contracts between agents and API endpoints |
| **ORM & Database** | SQLAlchemy 2.0, SQLite (Prototype) / Postgres-ready | Relational persistence for content queue, leads, feedback & lessons |
| **AI / LLM Engine** | Google Gemini API (`gemini-1.5-pro`) with local mock fallback | Multimodal reasoning, structured extraction, copywriting |
| **Frontend UI** | React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons | Responsive command center for human review, analytics & agent triggers |
| **Testing** | Pytest, FastAPI TestClient | Automated integration and contract validation |

---

## 4. Database Entities & Contracts

1. **`content_queue`**: Holds marketing copy variations across lifecycle states (`pending` -> `compliance_checked` -> `human_review` -> `approved` -> `published` or `rejected`).
2. **`competitors`**: Real-time competitor moves, pricing shifts, and campaign angles across insurance niches.
3. **`leads`**: B2B prospects, fit scores (0-100), qualification rationale, and custom outreach drafts.
4. **`feedback`**: Rejection tags (`misleading_guarantee`, `tone_off`, `pricing_disclaimer_missing`, etc.) and human revision logs.
5. **`lessons_learned`**: Generalized behavioral rules synthesized from human feedback and injected into future generation prompts.
6. **`analytics`**: Real-time KPI aggregation (approval rates, compliance scores, brand/platform distribution).
7. **`publishing_records`**: Multi-platform dispatch records, schedule timers, external post IDs, and performance metrics.

---

## 5. Security & Governance Principles
- **No Hardcoded Secrets**: All keys (`GEMINI_API_KEY`, tokens) are loaded strictly through environment variables.
- **Graceful Fallbacks**: System operates seamlessly in offline/demo mode when API keys are absent, ensuring flawless testability.
- **Mandatory Human-in-the-Loop**: Content cannot advance to `approved` or `published` without explicit review verification.
- **Audit Trails**: Every rejected claim or modified phrasing creates a persistent feedback and lesson learned record.
