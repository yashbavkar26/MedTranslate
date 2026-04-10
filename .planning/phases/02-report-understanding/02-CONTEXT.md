# Phase 02: Report Understanding - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Let users upload blood test reports, extract content, explain notable values, and ask report-grounded questions.
</domain>

<decisions>
## Implementation Decisions

### Report Extraction
- **D-01:** We will use `pdf-parse` (or equivalent) to extract text purely from digital PDFs for quick hackathon delivery. OCR/Image processing is skipped for this basic integration.

### Follow-up Interaction
- **D-02:** Backend will maintain conversation state (session-based chat). The backend handles appending report context and chat history to following queries.

### Report Storage
- **D-03:** Extracted report data will be saved locally on the backend for the duration of the server session.

### the agent's Discretion
- Memory management strategies for standardizing the conversation history or mapping report data models to specific session IDs (e.g., using basic in-memory JS maps).
- Choice of text chunking/presentation limits for Ollama.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project and Architecture
- `.planning/PROJECT.md` — Core definitions, constraints, out of scope items.
- `.planning/REQUIREMENTS.md` — Detailed product specs per phase (INPT-01, RPT-01, RPT-02, RPT-03 remain active).
- `backend/API.md` — Expected structure we built in Phase 1 for LLM normalization.
</canonical_refs>

<specifics>
## Specific Ideas
- N/A
</specifics>

<deferred>
## Deferred Ideas
- Photo extraction using OCR or LLava Multimodal model.
</deferred>

---

*Phase: 02-report-understanding*
*Context gathered: 2026-04-10*
