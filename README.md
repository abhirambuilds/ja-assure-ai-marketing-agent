# JA Assure AI Marketing Agent

> An autonomous, multi-brand agentic marketing and regulatory compliance pipeline built for JA Assure (Jade, DoctorShield, and Jaguar Transit).

---

## 1. Problem Statement
JA Assure operates niche, high-value insurance brands across Southeast Asia (Singapore, Malaysia, Thailand, Indonesia):
- **Jade**: Bespoke luxury jewellery and watch insurance.
- **DoctorShield**: Medical professional indemnity for physicians and surgeons.
- **Jaguar Transit**: High-value cargo, valuables, and diamond transit security insurance.

Marketing licensed insurance products in Southeast Asia presents strict regulatory hurdles (MAS in Singapore, BNM in Malaysia, OIC in Thailand). Misleading claims, unvetted guarantees, or omission of required intermediary disclaimers can trigger regulatory sanctions. Meanwhile, marketing teams struggle to monitor competitor movements across niche channels, tailor content for localized dialects, and systematically learn from editorial rejections.

---

## 2. Proposed Solution
The **JA Assure AI Marketing Agent** introduces an auditable, multi-agent AI pipeline dubbed **"The Brain"**:
1. **Research Agent**: Scrapes market trends and competitor movements.
2. **Content Agent**: Drafts multi-format variations (Posts, Reels/Video storyboards, Carousels) adhering to brand voice and injecting past lessons learned.
3. **Insurance Compliance Gate**: Automatically evaluates drafts against regional regulatory criteria, disclaimers, and prohibited claim phrases (scoring 0–100).
4. **Mandatory Human-in-the-Loop Review**: All content requires human sign-off (`approve`, `reject`, or `edit`).
5. **Closed-Loop Feedback & Learning**: Human rejections/edits are parsed by the Feedback Agent into generalized **Lessons Learned** that are automatically passed to subsequent prompt generation cycles.
6. **Lead Agent**: Identifies, enriches, and scores high-fit B2B prospects and drafts bespoke outreach messages.

---

## 3. Major Capabilities
- **Brand-Specific Voices**: Distinct styling for Jade (luxury/collector tone), DoctorShield (clinical precision/empathy), and Jaguar Transit (security/logistics authority).
- **Insurance Compliance Gate**: Regulatory check assessing policy limit claims, mandatory disclaimers, and penalty scores.
- **Closed-Loop Learning**: Rejection feedback immediately populates active rules that steer future AI generation.
- **Multi-Format & Multi-Platform**: LinkedIn, Instagram, Facebook, TikTok, Carousels, and Video/Reels storyboards.
- **Multilingual Localization**: English (EN), Malay (MS), Indonesian (ID), Thai (TH), and Chinese (ZH).
- **Lead Intelligence**: B2B prospect scoring (0–100) and qualification rationale.
- **No Hardcoded Secrets & Offline Demo Mode**: Operates with Gemini API live when key is present, and gracefully executes deterministic structured mocks when offline.

---

## 4. Architecture Overview

```
Research Agent
      ↓
Content Agent (Incorporates Lessons Learned)
      ↓
Compliance Gate (0-100 Score + Violations)
      ↓
Human Review / Approval
   ├── Rejected/Edited ──> Feedback Agent ──> Lessons Learned DB ──┐
   └── Approved ──> Content Queue ──> Multi-Channel Publishing Queue │
                                ^                                    │
                                └────────────────────────────────────┘
Parallel:
Lead Agent ──> Prospect Scoring & Enrichment ──> Personalized Outreach Drafts
```

---

## 5. Technology Stack
- **Backend**: Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0, SQLite (Prototype)
- **AI/LLM**: Google Gemini API (`gemini-1.5-pro`) with abstract provider & deterministic offline fallback
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
- **Testing**: Pytest, FastAPI TestClient

---

## 6. Repository Structure
```
ja-assure-ai-marketing-agent/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point & lifecycle hooks
│   │   ├── config.py            # Pydantic Settings & environment config
│   │   ├── database/            # SQLAlchemy session and engine management
│   │   ├── models/              # Relational models (ContentQueue, Leads, Feedback, etc.)
│   │   ├── schemas/             # Pydantic v2 schemas and shared agent contracts
│   │   ├── api/v1/              # REST routers (queue, leads, competitors, feedback, etc.)
│   │   ├── services/            # LLM provider abstraction (Gemini + fallback)
│   │   ├── agents/              # Modular agent stubs (research, content, compliance, etc.)
│   │   └── utils/
│   ├── tests/                   # Pytest automated test suite (9 passing tests)
│   ├── requirements.txt         # Python dependencies
│   ├── pytest.ini               # Test configuration
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/api.ts      # REST API client
│   │   ├── types/index.ts       # Shared TypeScript interfaces
│   │   ├── App.tsx              # Executive command center UI
│   │   └── index.css            # Tailwind styling
│   ├── package.json
│   └── .env.example
├── data/
│   ├── seed/seed_data.json      # Comprehensive seed data for all 3 brands
│   ├── ja_assure.db             # Local SQLite database
│   └── generated/
├── media/                       # Media assets & storyboards
├── docs/
│   ├── architecture/            # Architectural documentation
│   └── demo/
├── scripts/
│   ├── seed_db.py               # Database initialization & seeding script
│   ├── start_backend.bat        # Windows launcher for backend
│   └── start_frontend.bat       # Windows launcher for frontend
├── .gitignore                   # Secrets and artifact exclusions
└── README.md
```

---

## 7. Local Setup & Quick Start

### Prerequisites
- Python 3.11+
- Node.js v18+ & npm

### Backend Setup
1. Open a terminal in the project root:
   ```bash
   python -m venv backend/venv
   backend\venv\Scripts\pip install -r backend\requirements.txt
   ```
2. Copy environment file (optional; works offline by default):
   ```bash
   cp backend/.env.example backend/.env
   ```
3. Initialize and seed the SQLite database:
   ```bash
   backend\venv\Scripts\python scripts/seed_db.py
   ```
4. Run the backend API server:
   ```bash
   scripts\start_backend.bat
   # Or manually:
   # backend\venv\Scripts\uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
   ```
5. Interactive API Documentation:
   - Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - Health Check: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

### Frontend Setup
1. In a second terminal, navigate to `frontend/`:
   ```bash
   cd frontend
   npm install
   ```
2. Start development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 8. Verification & Automated Tests

Run the backend integration test suite:
```bash
backend\venv\Scripts\pytest -c backend\pytest.ini backend\tests -v
```
Build the production frontend bundle:
```bash
cd frontend && npm run build
```

---

## 9. Current Implementation Status (PROMPT 1/10 Complete)

| Component | Status | Description |
|---|---|---|
| **Architecture & Docs** | Completed | Full architecture specifications, shared agent contracts, and contracts schema |
| **Database & ORM** | Completed | SQLite + SQLAlchemy 2.0 with 7 core entities and auto-migration |
| **Seed Data Mechanism** | Completed | Realistic demo data covering Jade, DoctorShield, Jaguar Transit, leads, competitors, and lessons |
| **Backend REST API** | Completed | FastAPI endpoints for health, queue, leads, competitors, feedback, lessons, and analytics |
| **Agent Foundation** | Completed | BaseAgent interface and modular stubs for 8 agents with Gemini/fallback provider |
| **Frontend Foundation** | Completed | React 19 + Vite + TypeScript + Tailwind CSS v4 command center dashboard |
| **Test Suite** | Completed | 9/9 automated tests passing with Pytest |
| **Security** | Completed | No hardcoded credentials; strict `.gitignore` protection |
