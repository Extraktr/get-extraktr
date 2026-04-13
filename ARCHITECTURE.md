# Architecture Overview

Extraktr consists of:

- CLI (Node.js)
- Frontend (Next.js)
- Backend (FastAPI)
- Extraction engine (LLM-based)
- Integration layer (ClickUp, Jira)

## Flow

CLI / Extension / Web
→ API (POST /extract)
→ Extraction engine
→ Structured output
→ Optional integration delivery

## Design Goals

- deterministic output structure
- idempotent task creation
- minimal latency
- integration-first design
