# Phase 03: Multilingual Symptom and Voice Flow - Research

**Researched:** 2026-04-10
**Domain:** Node/Ollama medical text analysis, English/Hindi response handling, frontend-owned speech transcript flow
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
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

### Claude's Discretion
### the agent's Discretion
- Exact internal helper/function structure for reusing `POST /api/analyze` across typed and confirmed-transcript inputs.
- Whether to add a lightweight source/debug field later, as long as the Phase 3 API remains compatible with the existing analyze payload.
- Specific wording of low-literacy safety copy, provided it stays conservative and avoids diagnosis, prescriptions, and definitive treatment claims.

### Deferred Ideas (OUT OF SCOPE)
## Deferred Ideas

- Backend-owned raw audio upload or speech-to-text endpoint.
- Separate concern-specific endpoint such as `/api/concerns/text`, unless later client work shows the existing endpoint name is confusing.
- Any language-selection UI work, since the frontend already owns it.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INPT-02 | User can type a health concern or symptom description. | Keep `POST /api/analyze` text input and validate non-empty `body.text`. |
| INPT-03 | User can provide a health concern through voice input. | Frontend STT should convert speech to text; backend receives the same confirmed text contract. |
| INPT-04 | User can review and confirm the voice transcript before it is analyzed. | Transcript confirmation is a client state-flow requirement; backend must not accept raw audio or unconfirmed audio. |
| INPT-05 | User can choose or automatically preserve English or Hindi as the response language. | Backend honors `body.language` when supplied, falling back to Devanagari detection only when omitted. |
| GUID-01 | User receives a plain-language explanation of typed or spoken health concerns. | Prompt and response normalizer must return `result.explanation` in short, simple wording. |
| GUID-02 | User receives urgency guidance that distinguishes immediate doctor visit, routine doctor visit, and mild self-care. | Normalize all model outputs into `urgent`, `soon`, or `self_care`; never expose other labels. |
| GUID-03 | User receives basic home-care suggestions only when the concern appears mild and appropriate for self-care. | Gate `homeRemedies` / comfort steps to `self_care`; omit or replace with medical-help guidance for `urgent` and unclear cases. |
| GUID-04 | User is told when to visit a doctor if symptoms do not improve. | Require `doctorVisitGuidance` and fallback copy for non-improving or worsening symptoms. |
| ACCS-01 | Responses are written in simple language suitable for low-literacy users. | Use CDC plain-language rules: important message first, everyday words, short sentences, one idea per sentence. |
</phase_requirements>

## Summary

Phase 3 should be planned as a backend contract hardening phase with a small client-facing voice-flow contract note, not as a backend speech/audio feature. The existing `/api/analyze` endpoint already accepts `{ text, language }`; the planner should focus on making that endpoint return the documented structured `result` object, preserving the requested language, and enforcing conservative urgency/self-care rules.

The current implementation calls Ollama with `format: "json"`, but `buildAnalyzeResponse` only returns `response` as a string and does not parse or normalize the generated JSON. There is also a current health-route defect: `handleHealth` references `URGENCY`, but no `URGENCY` constant exists in `backend/src/server.js`. Planning should include fixing those contract gaps before any UI work depends on the API.

**Primary recommendation:** Keep the existing stack and endpoint; add a deterministic response-normalization layer around Ollama JSON output, define urgency constants, tighten the prompt for low-literacy English/Hindi output, and document that confirmed voice transcripts are submitted as normal text.

## Project Constraints (from CLAUDE.md)

No `CLAUDE.md` file was found in the project root. No repo-local `.claude/skills/` or `.agents/skills/` directories were found.

## Standard Stack

### Core

| Library / API | Version | Purpose | Why Standard |
|---------------|---------|---------|--------------|
| Node.js | 22.22.0 installed; project engine `>=18` | Backend HTTP server, native `fetch`, JSON API | Existing backend uses native Node modules and avoids framework overhead. |
| Ollama API | 0.20.3 installed and reachable | Local model inference for medical guidance | Project constraint requires local Ollama; official `/api/generate` supports `format: "json"` or JSON schema objects. |
| `formidable` | 3.5.4 installed; npm registry current 3.5.4, modified 2026-03-15 | Multipart report upload support | Existing Phase 2 dependency; no Phase 3 change required. |
| `pdf-parse` | 1.1.1 installed; npm registry current 2.4.5, modified 2025-10-29 | PDF text extraction for reports | Existing report dependency; not in Phase 3 path. Do not upgrade unless report tests are included. |
| React | 19.2.5 installed; npm registry current 19.2.5, modified 2026-04-09 | Existing web frontend | Future voice transcript UI should reuse current frontend stack. |
| Vite | 8.0.8 installed; npm registry current 8.0.8, modified 2026-04-09 | Existing frontend dev/build tooling | Current frontend build tool; no STT package is required for browser Web Speech API. |
| Web Speech API `SpeechRecognition` | Browser API, limited availability | Browser STT for voice transcript capture | MDN marks it not Baseline; plan a typed-transcript fallback and feature detection. |

### Supporting

| Library / API | Version | Purpose | When to Use |
|---------------|---------|---------|-------------|
| Native `JSON.parse` plus explicit normalizer | Built into Node | Convert Ollama `response` string into API `result` | Use because the schema is small and no validation dependency exists. |
| JSON Schema object for Ollama `format` | Supported by Ollama API | Stronger structured output than plain `"json"` | Use if time allows; still keep backend validation because model output can be incomplete. |
| Browser `SpeechRecognition.lang` | Browser API | Set STT language to `en-US` or `hi-IN` | Use in frontend voice flow; backend still receives only confirmed text. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Backend raw audio endpoint | Whisper, cloud STT, or Ollama multimodal/audio flow | Out of scope and contradicts locked decisions. |
| New `/api/concerns/text` route | Separate symptom endpoint | More explicit, but locked decision requires reusing `/api/analyze`. |
| Adding Zod/Ajv | Runtime schema validation dependency | Useful later, but current contract is small enough for explicit normalization without dependency churn. |
| External language detector | `franc`, CLD, cloud translation API | Overkill for English/Hindi demo; frontend provides language and Devanagari fallback is acceptable. |

**Installation:**
```bash
# No new packages required for Phase 3 backend work.
cd backend && npm install
cd ../frontend && npm install
```

**Version verification:** `npm view` was run on 2026-04-10 for `formidable`, `pdf-parse`, `react`, and `vite`. Local installed versions were checked with `npm list --depth=0`. Ollama was checked with `ollama --version` and `GET /api/version`.

## Architecture Patterns

### Recommended Project Structure

Keep Phase 3 narrowly scoped. The backend is currently a single-file Node service, so do not introduce a large folder structure just for this phase. If extracting helpers, keep them close to the server:

```text
backend/src/
└── server.js              # Existing routes, prompt builder, Ollama adapter, response normalizer
backend/API.md             # Update contract examples after implementation
frontend/src/App.tsx       # Future/current client should submit confirmed transcript as text
```

### Pattern 1: Canonical Analyze Contract

**What:** Treat typed symptoms and confirmed voice transcripts as identical text inputs to `/api/analyze`.

**When to use:** Always in Phase 3. Backend should not branch on voice vs typing.

**Example:**
```js
// Request body accepted by POST /api/analyze
{
  "text": "I have fever and dizziness for 3 days.",
  "language": "English"
}

{
  "text": "मुझे 3 दिन से बुखार और चक्कर आ रहे हैं।",
  "language": "Hindi"
}
```

### Pattern 2: Parse, Normalize, Then Respond

**What:** Ollama `/api/generate` returns generated content in the `response` string. With `format: "json"` or schema format, parse that string, then force the API shape and urgency values.

**When to use:** Every response from `askOllama`.

**Example:**
```js
const URGENCY = Object.freeze({
  urgent: "urgent",
  soon: "soon",
  selfCare: "self_care"
});

function parseOllamaResponse(ollamaResult) {
  try {
    return JSON.parse(String(ollamaResult.response || "{}"));
  } catch {
    return {};
  }
}

function normalizeUrgency(value) {
  const normalized = String(value || "").toLowerCase().trim();
  if (normalized === "urgent") return URGENCY.urgent;
  if (normalized === "self_care" || normalized === "self-care") return URGENCY.selfCare;
  return URGENCY.soon;
}
```

Source basis: Ollama API docs state that `/api/generate` returns generated text in `response`, and that `format` supports `"json"` or a JSON schema object.

### Pattern 3: Conservative Home-Care Gate

**What:** Model may suggest home remedies, but backend should expose comfort steps only when final urgency is `self_care`.

**When to use:** Before building the API `result`.

**Example:**
```js
function normalizeHomeRemedies(parsed, urgency) {
  if (urgency !== URGENCY.selfCare) return [];
  return Array.isArray(parsed.homeRemedies)
    ? parsed.homeRemedies.slice(0, 3)
    : [];
}
```

### Pattern 4: Frontend STT Feature Detection

**What:** Browser voice flow should check for `window.SpeechRecognition || window.webkitSpeechRecognition`, set `lang`, show transcript text, require explicit confirmation, then send confirmed text to `/api/analyze`.

**When to use:** Phase 4/5 client implementation or any current frontend patch related to voice.

**Example:**
```ts
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  // Show a normal text box: "Type what you said."
}

const recognition = new SpeechRecognition();
recognition.lang = language === "Hindi" ? "hi-IN" : "en-US";
recognition.interimResults = true;
recognition.onresult = (event) => {
  const transcript = Array.from(event.results)
    .map((result) => result[0]?.transcript || "")
    .join(" ")
    .trim();
  setTranscript(transcript);
};
```

Source basis: MDN documents `SpeechRecognition.lang` as a BCP 47 language tag, `interimResults`, and the `result` event carrying `event.results`.

### Anti-Patterns to Avoid

- **Backend audio upload in Phase 3:** Contradicts locked decisions and creates privacy, storage, and STT complexity.
- **Trusting model urgency verbatim:** Models may emit labels outside the contract; always normalize to `urgent`, `soon`, or `self_care`.
- **Showing home remedies for urgent cases:** This can delay care; use medical-help guidance instead.
- **Letting omitted `language` override user choice:** Honor `body.language` first; fallback detection only when the client omits language.
- **Returning only `response` string:** Current `API.md` promises a structured `result`; clients need the fields.
- **Adding broad multilingual support:** English/Hindi only for v1 Phase 3; other languages are deferred.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Speech-to-text backend | Raw audio storage, custom decoder, backend STT route | Frontend Web Speech API / platform STT, confirmed transcript text | Locked decision; avoids raw audio handling and privacy risk. |
| Medical diagnosis | Disease classifier or deterministic diagnosis tree | Safety-bounded explanation plus uncertainty | Out of scope and unsafe for hackathon release. |
| Prescription or dosage advice | Medication recommendation logic | Safety notice and doctor guidance | Explicitly prohibited by requirements. |
| Broad language detection | Custom language classifier | Frontend-provided `language`; Devanagari fallback only | Scope is English/Hindi and frontend owns language UI. |
| Urgency taxonomy | Many triage statuses | Existing `urgent`, `soon`, `self_care` | Clients and API contract already depend on these values. |
| Structured-output parser by regex | Regex extraction from model prose | Ollama JSON mode/schema plus `JSON.parse` and fallback defaults | Regex breaks on quotes, Hindi text, arrays, and partial output. |

**Key insight:** The hard part is not accepting more input types; it is preventing ambiguous model output from leaking into medical guidance. The planner should prioritize deterministic normalization after model generation.

## Common Pitfalls

### Pitfall 1: Ollama JSON Mode Is Not the API Response Shape

**What goes wrong:** The backend returns `ollamaResult.response` as a string and clients never receive `result.explanation`, `result.urgency`, or arrays.

**Why it happens:** Ollama wraps generated content in its own API envelope.

**How to avoid:** Parse `ollamaResult.response`, normalize fields, then return `{ model, safetyNotice, result, response, raw }`.

**Warning signs:** `typeof payload.result === "undefined"` or UI parsing a string instead of structured fields.

### Pitfall 2: Missing `URGENCY` Constant Breaks `/health`

**What goes wrong:** `GET /health` tries `Object.values(URGENCY)` but `URGENCY` is undefined.

**Why it happens:** API contract was documented before the runtime constant existed.

**How to avoid:** Add a module-level `URGENCY` object and reuse it in prompt text, health response, and normalizer.

**Warning signs:** `/health` reports fallback data without `responseContract`, or server logs a reference error.

### Pitfall 3: Prompt Allows Remedies During Urgent Symptoms

**What goes wrong:** Users see comfort/remedy copy alongside emergency guidance.

**Why it happens:** Current prompt says remedies may be temporary comfort measures even for urgent symptoms.

**How to avoid:** Change prompt and backend gate: `homeRemedies` only for `self_care`; for urgent/unclear, use immediate doctor guidance.

**Warning signs:** `urgent` result includes remedy instructions.

### Pitfall 4: Browser STT Availability Is Uneven

**What goes wrong:** Voice button silently fails in unsupported browsers.

**Why it happens:** MDN marks SpeechRecognition as limited availability / not Baseline.

**How to avoid:** Feature-detect in the client and offer manual transcript entry. Keep backend unaffected.

**Warning signs:** `SpeechRecognition is not defined`, especially outside Chromium-based browsers.

### Pitfall 5: Hindi Output Quality Is Assumed Instead of Tested

**What goes wrong:** Backend honors Hindi, but model output mixes languages or uses complex medical terms.

**Why it happens:** Local model Hindi quality is variable.

**How to avoid:** Include Hindi smoke samples in implementation verification, and add fallback instructions for simple Hindi wording.

**Warning signs:** English terms dominate Hindi responses or response is too long for low-literacy users.

## Code Examples

Verified patterns from official sources and current repo constraints:

### Ollama Generate With JSON Format

```js
// Source: https://docs.ollama.com/api/generate
const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: OLLAMA_MODEL,
    prompt,
    stream: false,
    format: "json",
    options: {
      temperature: 0.2,
      num_predict: 350
    }
  })
});

const ollamaResult = await response.json();
const parsed = JSON.parse(ollamaResult.response);
```

### Structured API Response Builder

```js
function buildAnalyzeResponse(language, ollamaResult) {
  const parsed = parseOllamaResponse(ollamaResult);
  const urgency = normalizeUrgency(parsed.urgency);

  const result = {
    explanation: simpleString(parsed.explanation, fallbackExplanation(language)),
    urgency,
    uncertainty: simpleString(parsed.uncertainty, fallbackUncertainty(language)),
    safeNextSteps: normalizeSteps(parsed.safeNextSteps, urgency, language),
    warningSigns: normalizeSteps(parsed.warningSigns, urgency, language),
    doctorVisitGuidance: normalizeDoctorGuidance(parsed.doctorVisitGuidance, urgency, language),
    homeRemedies: normalizeHomeRemedies(parsed, urgency),
    language,
    source: "ollama"
  };

  return {
    model: OLLAMA_MODEL,
    safetyNotice: SAFETY_NOTICE,
    result,
    response: formatPlainResponse(result),
    raw: ollamaResult
  };
}
```

### Low-Literacy Prompt Additions

```text
Use short sentences.
Use everyday words.
Put the most important action first.
Do not use medical jargon unless you explain it in simple words.
For urgent or unclear symptoms, do not suggest home remedies. Tell the person to get medical help.
For mild symptoms only, give simple comfort steps and say when to see a doctor if not improving.
```

Source basis: CDC plain-language guidance recommends important information first, common words, active voice, and short sentences with one idea.

### Frontend Confirmed Transcript Submission

```ts
async function submitConfirmedTranscript(transcript: string, language: "English" | "Hindi") {
  return fetch("http://localhost:8000/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: transcript, language })
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed / Verified | Impact |
|--------------|------------------|--------------------------|--------|
| Backend receives audio for analysis | Frontend/platform STT produces editable transcript; backend receives confirmed text | Locked by Phase 3 context, 2026-04-10 | Avoids raw audio handling and keeps API stable. |
| Prompt asks for JSON but backend returns raw string | Parse/normalize generated JSON into documented API `result` | Ollama docs verified 2026-04-10 | Required for web/Flutter clients to render structured guidance. |
| Plain `"json"` only | Ollama also supports JSON schema object in `format` | Official Ollama docs verified 2026-04-10 | Optional improvement; backend validation still required. |
| Generic patient copy | Plain-language, low-literacy copy | CDC guidance current July 21, 2025 | Better aligns with ACCS-01. |

**Deprecated/outdated:**
- Backend raw STT: out of scope for v1 Phase 3.
- `SpeechGrammar` / `SpeechGrammarList`: MDN marks these related Web Speech APIs deprecated; do not build around grammar lists.
- Multi-language frontend options beyond English/Hindi: current frontend has extra labels, but Phase 3 v1 scope is English/Hindi only.

## Open Questions

1. **Should Phase 3 touch frontend voice UI now or only document the backend contract?**
   - What we know: Roadmap marks Phase 3 UI hint as yes, but locked decisions say frontend already handles language UI and backend owns no raw audio.
   - What's unclear: Whether existing frontend should receive the voice transcript confirmation UI in this phase or Phase 4.
   - Recommendation: Plan backend contract hardening first. Add only a small client contract note or minimal feature-detected transcript flow if the phase owner wants UI coverage now.

2. **Should Ollama use plain `format: "json"` or a full JSON schema object?**
   - What we know: Official Ollama docs support both.
   - What's unclear: Whether the installed `meditron` model follows schema reliably.
   - Recommendation: Keep `format: "json"` for minimal change, but structure prompt with exact schema and normalize server-side. Use schema object only if quick smoke tests show it improves reliability.

3. **What exact Hindi safety wording passes demo quality?**
   - What we know: Backend can request Hindi and local models are available.
   - What's unclear: Actual medical Hindi quality from `llama3.1` vs `meditron`.
   - Recommendation: Include Hindi sample verification in execution: fever/dizziness, chest pain/breathing trouble, mild headache.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Backend server | Yes | 22.22.0 | Project supports Node `>=18`. |
| npm | Dependency install / scripts | Yes | 11.11.0 | None needed. |
| backend `node_modules` | Local backend run | Yes | Installed | Run `cd backend && npm install` if missing. |
| frontend `node_modules` | Future frontend voice flow/build | Yes | Installed | Run `cd frontend && npm install` if missing. |
| Ollama CLI | Local model runtime | Yes | 0.20.3 | Blocking if absent. |
| Ollama HTTP API | `/api/generate`, `/api/tags` | Yes | 0.20.3 | Blocking if unreachable. |
| `llama3.1:latest` model | Default backend model | Yes | 8B Q4_K_M | Set `OLLAMA_MODEL=meditron` if desired. |
| `meditron:latest` model | Medical model option | Yes | 7B Q4_0 | Use `llama3.1` if latency/quality is better. |
| Browser Web Speech API | Frontend voice transcript | Browser-dependent | Limited availability | Manual transcript text entry. |

**Missing dependencies with no fallback:**
- None found for backend Phase 3 planning. Ollama is reachable locally.

**Missing dependencies with fallback:**
- Browser STT may be unavailable in some browsers; fallback is typed/manual transcript confirmation.

## Sources

### Primary (HIGH confidence)

- Official Ollama API docs, `POST /api/generate`: https://docs.ollama.com/api/generate - verified response envelope, `response` field, `format: "json"` / JSON schema support.
- MDN `SpeechRecognition.lang`: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/lang - verified BCP 47 language tag behavior and limited availability.
- MDN `SpeechRecognition.interimResults`: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/interimResults - verified interim transcript behavior and limited availability.
- MDN `SpeechRecognition.result` event: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/result_event - verified transcript access via `event.results`.
- CDC Plain Language Materials & Resources: https://www.cdc.gov/health-literacy/php/develop-materials/plain-language.html - verified low-literacy writing guidance.
- CDC Everyday Words: https://www.cdc.gov/ccindex/everydaywords/about.html - verified short sentences, active voice, everyday words.
- CDC Respiratory Illnesses emergency signs: https://www.cdc.gov/respiratory-viruses/about/index.html - verified examples of emergency warning signs and immediate-care framing.

### Secondary (MEDIUM confidence)

- Local `npm view` registry checks on 2026-04-10 for `formidable`, `pdf-parse`, `react`, and `vite`.
- Local `ollama --version`, `/api/version`, and `/api/tags` checks on 2026-04-10.

### Tertiary (LOW confidence)

- None used for implementation recommendations.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Existing dependencies and local runtime were verified, plus npm registry checks for relevant packages.
- Architecture: HIGH - Based on current `backend/src/server.js`, `backend/API.md`, locked Phase 3 decisions, and official Ollama API behavior.
- Pitfalls: HIGH - Directly observed current contract gaps and verified browser STT limitations with MDN.
- Medical safety content: MEDIUM - Emergency warning examples are authoritative, but final symptom triage remains model-dependent and must be smoke-tested.

**Research date:** 2026-04-10
**Valid until:** 2026-05-10 for backend/Ollama API assumptions; 2026-04-17 for Web Speech browser availability details.
