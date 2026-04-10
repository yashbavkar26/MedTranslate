# Phase 03: Multilingual Symptom and Voice Flow - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Support typed symptoms and frontend-confirmed voice transcripts as text inputs to the backend, preserve English/Hindi response behavior from the frontend-provided language value, and return conservative plain-language urgency guidance suitable for low-literacy users.

Phase 3 does not add backend raw-audio upload, backend speech-to-text, or a new language-selection UI. The frontend already handles language selection/detection and voice transcription before backend analysis.
</domain>

<decisions>
## Implementation Decisions

### Text and Voice Input Contract
- **D-01:** Voice/STT is frontend-owned. The backend does not accept raw audio in Phase 3.
- **D-02:** For health concerns, the backend accepts only text: typed concern text or frontend-confirmed voice transcript text.
- **D-03:** Use the existing `POST /api/analyze` endpoint for both typed prompts and confirmed voice transcripts. The payload remains `{ "text": "...", "language": "..." }`.
- **D-04:** The backend does not need to distinguish whether symptom text came from typing or voice for Phase 3.

### Language Flow
- **D-05:** Skip language UI decisions in this phase because the frontend already handles the language part.
- **D-06:** Backend should honor the frontend-provided language value when present and keep existing fallback detection only as a safety net.

### Urgency and Self-Care Guidance
- **D-07:** Backend should be conservative with urgency and always map output to the existing urgency values: `urgent`, `soon`, or `self_care`.
- **D-08:** Patient-facing wording should translate urgency into simple next actions: urgent means seek medical help immediately, soon means see a doctor soon, and self-care means mild concern with monitoring.
- **D-09:** Home-care suggestions should be limited to simple comfort steps for mild cases. For urgent or unclear cases, avoid remedy framing and focus on getting medical help.

### the agent's Discretion
- Exact internal helper/function structure for reusing `POST /api/analyze` across typed and confirmed-transcript inputs.
- Whether to add a lightweight source/debug field later, as long as the Phase 3 API remains compatible with the existing analyze payload.
- Specific wording of low-literacy safety copy, provided it stays conservative and avoids diagnosis, prescriptions, and definitive treatment claims.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope and Requirements
- `.planning/PROJECT.md` - Core value, English/Hindi scope, local Ollama constraint, safety posture, and out-of-scope medical claims.
- `.planning/REQUIREMENTS.md` - Phase 3 requirement mapping for INPT-02, INPT-03, INPT-04, INPT-05, GUID-01, GUID-02, GUID-03, GUID-04, and ACCS-01.
- `.planning/ROADMAP.md` - Phase 3 goal and success criteria.

### Backend Contract and Existing Implementation
- `backend/API.md` - Current shared response contract and `POST /api/analyze` request/response shape.
- `backend/src/server.js` - Existing analyze endpoint, language fallback detection, Ollama prompt construction, and report/chat integration points.

### Prior Phase Context and Research
- `.planning/phases/02-report-understanding/02-CONTEXT.md` - Prior decisions about backend-owned session context and local report handling.
- `.planning/research/SUMMARY.md` - Research guidance that voice should show/edit/confirm transcript before medical reasoning and should reuse typed concern behavior.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/src/server.js` `handleAnalyze` - Already accepts JSON text plus optional language and sends it through Ollama.
- `backend/src/server.js` `detectLanguage` - Existing Devanagari fallback can remain as a safety net when the client omits language.
- `backend/src/server.js` `buildMedicalPrompt` - Existing prompt already asks for explanation, urgency, uncertainty, safe next steps, warning signs, doctor visit guidance, and home remedies.

### Established Patterns
- Backend exposes a small Node HTTP API with JSON responses and permissive CORS for local demo clients.
- Report upload and report chat already reuse the same Ollama response path, so typed/voice symptom text should continue using the same response contract.
- Phase 2 chose local backend session state for report context; Phase 3 does not need new symptom session state.

### Integration Points
- `POST /api/analyze` is the primary integration point for typed symptoms and confirmed voice transcripts.
- `GET /health` should continue advertising the response contract that both web and Flutter clients depend on.
- Future web and Flutter phases should send the confirmed transcript as text to `/api/analyze`; they should not expect backend audio/STT in v1.
</code_context>

<specifics>
## Specific Ideas

- User explicitly confirmed that voice input should not be backend raw audio. The backend receives report content or text prompt only.
- The frontend already handles language selection/detection, so this phase should not spend planning effort on language UI.
- User accepted the recommendation to keep `/api/analyze` as the shared endpoint for typed text and confirmed voice transcript text.
</specifics>

<deferred>
## Deferred Ideas

- Backend-owned raw audio upload or speech-to-text endpoint.
- Separate concern-specific endpoint such as `/api/concerns/text`, unless later client work shows the existing endpoint name is confusing.
- Any language-selection UI work, since the frontend already owns it.
</deferred>

---

*Phase: 03-multilingual-symptom-and-voice-flow*
*Context gathered: 2026-04-10*
