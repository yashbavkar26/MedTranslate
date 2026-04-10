---
phase: 03-multilingual-symptom-and-voice-flow
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/server.js
  - backend/API.md
autonomous: true
requirements:
  - INPT-02
  - INPT-03
  - INPT-04
  - INPT-05
  - GUID-01
  - GUID-02
  - GUID-03
  - GUID-04
  - ACCS-01
must_haves:
  truths:
    - "Typed symptom text can be submitted to POST /api/analyze as JSON { text, language }."
    - "Frontend-confirmed voice transcripts use the same POST /api/analyze text contract and no backend raw audio endpoint exists."
    - "When language is supplied as English or Hindi, the backend uses that value before fallback detection."
    - "Every analysis response includes model, safetyNotice, result, response, and raw."
    - "Every result.urgency value is one of urgent, soon, or self_care."
    - "Home-care suggestions appear only when urgency is self_care."
    - "Plain-language doctor guidance is present for urgent, soon, and self_care responses."
  artifacts:
    - path: "backend/src/server.js"
      provides: "Analyze endpoint, Ollama JSON parsing, urgency normalization, self-care gating, health contract"
      contains: "const URGENCY = Object.freeze"
    - path: "backend/API.md"
      provides: "Shared API contract for typed concerns and confirmed voice transcripts"
      contains: "confirmed voice transcript"
  key_links:
    - from: "backend/src/server.js"
      to: "POST /api/analyze"
      via: "handleAnalyze reads body.text and body.language"
      pattern: "const requestedLanguage"
    - from: "backend/src/server.js"
      to: "Ollama JSON response"
      via: "buildAnalyzeResponse parses ollamaResult.response before sending JSON"
      pattern: "parseOllamaResponse\\(ollamaResult\\)"
    - from: "backend/src/server.js"
      to: "GET /health"
      via: "handleHealth returns Object.values(URGENCY)"
      pattern: "Object\\.values\\(URGENCY\\)"
---

<objective>
Harden the existing backend analyze contract so typed concerns and frontend-confirmed voice transcripts return structured English/Hindi guidance with conservative urgency and self-care rules.

Purpose: Phase 4 and Phase 5 clients need a stable shared response shape before they add web and Flutter UI around typed and voice transcript input.
Output: Updated `backend/src/server.js` normalization behavior and updated `backend/API.md` contract documentation.
</objective>

<execution_context>
@C:/Users/Yash/.codex/get-shit-done/workflows/execute-plan.md
@C:/Users/Yash/.codex/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/STATE.md
@.planning/phases/03-multilingual-symptom-and-voice-flow/03-CONTEXT.md
@.planning/phases/03-multilingual-symptom-and-voice-flow/03-RESEARCH.md
@.planning/phases/02-report-understanding/02-01-report-parsing-SUMMARY.md
@backend/API.md
@backend/src/server.js

<interfaces>
Existing endpoint contracts to preserve:

```json
POST /api/analyze
{
  "text": "I have had a high fever for 3 days and feel dizzy.",
  "language": "English"
}
```

```json
POST /api/analyze
{
  "text": "मुझे 3 दिन से बुखार और चक्कर आ रहे हैं।",
  "language": "Hindi"
}
```

Expected response shape after this plan:

```json
{
  "model": "llama3.1",
  "safetyNotice": "MedTranslate explains health information in simple words. It does not diagnose, prescribe medicine, or replace a doctor.",
  "result": {
    "explanation": "Short plain-language explanation.",
    "urgency": "soon",
    "uncertainty": "This app cannot confirm the cause from this text alone. A doctor can check the details.",
    "safeNextSteps": ["See a doctor soon."],
    "warningSigns": ["Trouble breathing"],
    "doctorVisitGuidance": "See a doctor soon, especially if symptoms continue or get worse.",
    "homeRemedies": [],
    "language": "English",
    "source": "ollama"
  },
  "response": "Plain text summary string ready for UI display...",
  "raw": {}
}
```

Locked decisions to honor:
- D-01: Voice/STT is frontend-owned; do not add backend audio upload or speech-to-text.
- D-02: Backend accepts typed concern text or frontend-confirmed voice transcript text.
- D-03: Reuse `POST /api/analyze` with payload `{ "text": "...", "language": "..." }`.
- D-04: Do not branch on typed vs voice origin.
- D-06: Honor frontend-provided `language` first; fallback detection is only for omitted language.
- D-07: Map urgency to exactly `urgent`, `soon`, or `self_care`.
- D-08: Convert urgency into simple next actions.
- D-09: Return home-care suggestions only for `self_care`.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add deterministic analysis response normalizers</name>
  <files>backend/src/server.js</files>
  <read_first>
    - .planning/phases/03-multilingual-symptom-and-voice-flow/03-CONTEXT.md
    - .planning/phases/03-multilingual-symptom-and-voice-flow/03-RESEARCH.md
    - backend/API.md
    - backend/src/server.js
  </read_first>
  <behavior>
    - `parseOllamaResponse({ response: "{\"urgency\":\"urgent\"}" })` returns an object, not a string.
    - Invalid or missing `ollamaResult.response` returns `{}` without throwing.
    - `normalizeUrgency("self-care")` and `normalizeUrgency("self_care")` return `self_care`.
    - Unknown urgency labels return `soon`.
    - `normalizeHomeRemedies(..., "urgent")` and `normalizeHomeRemedies(..., "soon")` return `[]`.
    - `normalizeHomeRemedies(..., "self_care")` returns at most 3 simple string steps.
  </behavior>
  <action>
    In `backend/src/server.js`, add a module-level constant directly after `SAFETY_NOTICE`:
    `const URGENCY = Object.freeze({ urgent: "urgent", soon: "soon", selfCare: "self_care" });`

    Add helper functions before `buildAnalyzeResponse`:
    - `simpleString(value, fallback)` returns a trimmed string when `value` is a non-empty string, otherwise `fallback`.
    - `normalizeList(value, fallbackItems = [])` accepts arrays of strings or arrays of `{ remedy, instruction }` objects, trims empty values, converts remedy objects to `"${remedy}: ${instruction}"`, and returns a non-empty fallback array when no usable item exists.
    - `parseOllamaResponse(ollamaResult)` calls `JSON.parse(String(ollamaResult.response || "{}"))` inside try/catch and returns `{}` on parse failure.
    - `normalizeUrgency(value)` lowercases and trims, returns `URGENCY.urgent` for `"urgent"`, returns `URGENCY.selfCare` for `"self_care"` or `"self-care"`, returns `URGENCY.soon` for everything else.
    - `fallbackExplanation(language)`, `fallbackUncertainty(language)`, `fallbackNextSteps(urgency, language)`, `fallbackWarningSigns(language)`, and `fallbackDoctorGuidance(urgency, language)` with concrete English and Hindi strings. English strings must include `"This needs medical attention now."` for urgent guidance, `"See a doctor soon."` for soon guidance, and `"If you do not feel better, see a doctor."` for self-care guidance. Hindi strings must include `"तुरंत चिकित्सा मदद लें।"` for urgent guidance, `"जल्द डॉक्टर को दिखाएं।"` for soon guidance, and `"आराम न मिले तो डॉक्टर को दिखाएं।"` for self-care guidance.
    - `normalizeHomeRemedies(parsed, urgency)` returns `[]` unless `urgency === URGENCY.selfCare`; for self-care it normalizes `parsed.homeRemedies` and slices to 3 items.
    - `formatPlainResponse(result)` returns a newline-joined string containing labels `Explanation:`, `Urgency:`, `Next steps:`, `Warning signs:`, and `Doctor guidance:`.

    Do not add any new npm dependency. Do not add a raw audio route, speech-to-text helper, or source/origin distinction for typed vs voice input, per D-01 through D-04.
  </action>
  <acceptance_criteria>
    - `Select-String -Path backend/src/server.js -Pattern 'const URGENCY = Object.freeze'` returns a match.
    - `Select-String -Path backend/src/server.js -Pattern 'function parseOllamaResponse\\('` returns a match.
    - `Select-String -Path backend/src/server.js -Pattern 'JSON.parse\\(String\\(ollamaResult.response \\|\\| "\\{\\}"\\)\\)'` returns a match.
    - `Select-String -Path backend/src/server.js -Pattern 'function normalizeUrgency\\('` returns a match.
    - `Select-String -Path backend/src/server.js -Pattern 'self-care'` returns a match.
    - `Select-String -Path backend/src/server.js -Pattern 'function normalizeHomeRemedies\\('` returns a match.
    - `Select-String -Path backend/src/server.js -Pattern 'urgency !== URGENCY.selfCare'` returns a match.
    - `Select-String -Path backend/src/server.js -Pattern 'function formatPlainResponse\\('` returns a match.
  </acceptance_criteria>
  <verify>
    <automated>cd backend; node --check src/server.js</automated>
  </verify>
  <done>`backend/src/server.js` contains deterministic helper functions for parsing Ollama JSON, normalizing urgency, gating home-care suggestions, and formatting a plain response string without adding dependencies or backend audio/STT behavior.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Wire normalized result shape into analyze, report, chat, prompt, and health</name>
  <files>backend/src/server.js</files>
  <read_first>
    - .planning/phases/03-multilingual-symptom-and-voice-flow/03-CONTEXT.md
    - .planning/phases/03-multilingual-symptom-and-voice-flow/03-RESEARCH.md
    - backend/API.md
    - backend/src/server.js
  </read_first>
  <behavior>
    - `buildAnalyzeResponse("English", { response: "{\"explanation\":\"I feel dizzy.\",\"urgency\":\"unknown\",\"safeNextSteps\":[],\"warningSigns\":[]}" })` returns `result.urgency === "soon"` and includes `raw`.
    - `buildAnalyzeResponse("Hindi", { response: "{\"urgency\":\"urgent\",\"homeRemedies\":[{\"remedy\":\"rest\",\"instruction\":\"lie down\"}]}" })` returns `result.homeRemedies` as `[]`.
    - `buildAnalyzeResponse("English", { response: "{\"urgency\":\"self_care\",\"homeRemedies\":[{\"remedy\":\"Fluids\",\"instruction\":\"Sip water\"}]}" })` returns one home-care string.
    - `GET /health` can return `responseContract.urgency` without throwing `ReferenceError: URGENCY is not defined`.
  </behavior>
  <action>
    Replace `buildAnalyzeResponse(language, ollamaResult)` so it:
    - Calls `const parsed = parseOllamaResponse(ollamaResult);`
    - Calls `const urgency = normalizeUrgency(parsed.urgency);`
    - Builds `const result = { explanation, urgency, uncertainty, safeNextSteps, warningSigns, doctorVisitGuidance, homeRemedies, language, source: "ollama" };`
    - Uses `simpleString(parsed.explanation, fallbackExplanation(language))`
    - Uses `simpleString(parsed.uncertainty, fallbackUncertainty(language))`
    - Uses `normalizeList(parsed.safeNextSteps, fallbackNextSteps(urgency, language))`
    - Uses `normalizeList(parsed.warningSigns, fallbackWarningSigns(language))`
    - Uses `simpleString(parsed.doctorVisitGuidance, fallbackDoctorGuidance(urgency, language))`
    - Uses `normalizeHomeRemedies(parsed, urgency)`
    - Returns exactly `{ model: OLLAMA_MODEL, safetyNotice: SAFETY_NOTICE, result, response: formatPlainResponse(result), raw: ollamaResult }`.

    Update `buildMedicalPrompt(text, language = "English")` to remove the duplicate `"You are MedTranslate..."` line and replace the home-remedy instruction with these exact safety constraints:
    - `"Use short sentences. Use everyday words. Put the most important action first."`
    - `"For urgent or unclear symptoms, do not suggest home remedies. Tell the person to get medical help."`
    - `"For mild symptoms only, give simple comfort steps and say when to see a doctor if not improving."`
    - `"The urgency value must be exactly one of: urgent, soon, self_care."`

    Keep `handleAnalyze` request parsing as `{ text, language }`. Keep this language behavior: `body.language` wins when it is a non-empty string; otherwise `detectLanguage(text)` is used. Do not add `source`, `inputType`, `audio`, `transcriptConfirmed`, or any branch that treats voice differently from typed text.

    Keep `handleUploadReport` and `handleChat` using `buildAnalyzeResponse(...)` so report summary and chat responses also receive the structured shape. Confirm `sessions.set(... history ...)` still stores `analysis.response`.

    Keep `handleHealth` returning `responseContract.urgency: Object.values(URGENCY)` and add `"homeRemedies"` and `"language"` to the `responseContract.fields` array so clients see the full result contract.
  </action>
  <acceptance_criteria>
    - `Select-String -Path backend/src/server.js -Pattern 'const parsed = parseOllamaResponse\\(ollamaResult\\);'` returns a match.
    - `Select-String -Path backend/src/server.js -Pattern 'raw: ollamaResult'` returns a match.
    - `Select-String -Path backend/src/server.js -Pattern 'source: "ollama"'` returns a match.
    - `Select-String -Path backend/src/server.js -Pattern 'Use short sentences\\. Use everyday words\\. Put the most important action first\\.'` returns a match.
    - `Select-String -Path backend/src/server.js -Pattern 'For urgent or unclear symptoms, do not suggest home remedies'` returns a match.
    - `Select-String -Path backend/src/server.js -Pattern 'The urgency value must be exactly one of: urgent, soon, self_care\\.'` returns a match.
    - `Select-String -Path backend/src/server.js -Pattern 'homeRemedies'` returns at least 4 matches.
    - `Select-String -Path backend/src/server.js -Pattern 'audio|SpeechRecognition|transcriptConfirmed|inputType|sourceType'` returns no matches.
  </acceptance_criteria>
  <verify>
    <automated>cd backend; node --check src/server.js</automated>
  </verify>
  <done>`POST /api/analyze`, `POST /api/upload-report`, `POST /api/chat`, and `GET /health` share the normalized response contract, honor provided language first, expose only `urgent | soon | self_care`, and block home-care output for urgent or soon responses.</done>
</task>

<task type="auto">
  <name>Task 3: Document confirmed transcript contract and run backend smoke checks</name>
  <files>backend/API.md, backend/src/server.js</files>
  <read_first>
    - .planning/REQUIREMENTS.md
    - .planning/phases/03-multilingual-symptom-and-voice-flow/03-CONTEXT.md
    - .planning/phases/03-multilingual-symptom-and-voice-flow/03-RESEARCH.md
    - backend/API.md
    - backend/src/server.js
    - backend/package.json
  </read_first>
  <action>
    Update `backend/API.md` section `2. Analyze Health Concern` so it explicitly documents typed health concern text and frontend-confirmed voice transcripts:
    - Add this sentence: `"Typed concerns and frontend-confirmed voice transcripts use the same endpoint. The backend does not accept raw audio in v1."`
    - Keep the request JSON shape exactly `{ "text": "...", "language": "English" }`.
    - Add a Hindi request example with text `"मुझे 3 दिन से बुखार और चक्कर आ रहे हैं।"` and `"language": "Hindi"`.
    - Update the response example so the top-level keys are `model`, `safetyNotice`, `result`, `response`, and `raw`.
    - Update `result` fields to include `explanation`, `urgency`, `uncertainty`, `safeNextSteps`, `warningSigns`, `doctorVisitGuidance`, `homeRemedies`, `language`, and `source`.
    - Document the urgency values exactly as `urgent`, `soon`, and `self_care`.
    - Add this home-care rule: `"homeRemedies is an empty array unless urgency is self_care."`

    Run a local syntax check with `cd backend; node --check src/server.js`.

    Run one local health smoke check without relying on Ollama success: start the backend with `PORT=18000`, request `GET http://localhost:18000/health`, and verify the command returns JSON containing `"ok": true`. If Ollama is unavailable, `ollamaReachable` may be `false`; that is acceptable.

    Do not add frontend voice UI, raw audio documentation, a separate `/api/concerns/text` route, or any new endpoint in this phase.
  </action>
  <acceptance_criteria>
    - `Select-String -Path backend/API.md -Pattern 'frontend-confirmed voice transcripts use the same endpoint'` returns a match.
    - `Select-String -Path backend/API.md -Pattern 'does not accept raw audio in v1'` returns a match.
    - `Select-String -Path backend/API.md -Pattern 'मुझे 3 दिन से बुखार'` returns a match.
    - `Select-String -Path backend/API.md -Pattern 'homeRemedies is an empty array unless urgency is self_care'` returns a match.
    - `Select-String -Path backend/API.md -Pattern '"raw"'` returns a match.
    - `Select-String -Path backend/API.md -Pattern '/api/concerns/text|raw audio upload|speech-to-text endpoint'` returns no matches.
    - `cd backend; node --check src/server.js` exits 0.
  </acceptance_criteria>
  <verify>
    <automated>cd backend; node --check src/server.js</automated>
    <automated>$env:PORT='18000'; $process = Start-Process -FilePath node -ArgumentList 'src/server.js' -WorkingDirectory 'backend' -PassThru -WindowStyle Hidden; try { Start-Sleep -Seconds 1; (Invoke-RestMethod -Uri 'http://localhost:18000/health').ok } finally { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue }</automated>
  </verify>
  <done>`backend/API.md` documents typed and confirmed voice transcript input through `POST /api/analyze`, the backend syntax check passes, and `/health` responds with `ok: true` without the old undefined `URGENCY` runtime failure.</done>
</task>

</tasks>

<verification>
Run these checks after all tasks complete:

```powershell
cd backend
node --check src/server.js
```

```powershell
Select-String -Path backend/src/server.js -Pattern 'const URGENCY = Object.freeze','parseOllamaResponse\\(ollamaResult\\)','normalizeHomeRemedies','Object\\.values\\(URGENCY\\)'
Select-String -Path backend/API.md -Pattern 'frontend-confirmed voice transcripts use the same endpoint','homeRemedies is an empty array unless urgency is self_care','"raw"'
```

Optional live smoke, if local Ollama is running:

```powershell
$env:PORT='18000'
$process = Start-Process -FilePath node -ArgumentList 'src/server.js' -WorkingDirectory 'backend' -PassThru -WindowStyle Hidden
try {
  Start-Sleep -Seconds 1
  Invoke-RestMethod -Uri 'http://localhost:18000/health'
  Invoke-RestMethod -Method Post -Uri 'http://localhost:18000/api/analyze' -ContentType 'application/json' -Body '{"text":"I have chest pain and trouble breathing.","language":"English"}'
} finally {
  Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
}
```
</verification>

<success_criteria>
- `backend/src/server.js` defines `URGENCY` and `/health` no longer references an undefined symbol.
- `buildAnalyzeResponse` parses `ollamaResult.response` JSON and returns top-level `model`, `safetyNotice`, `result`, `response`, and `raw`.
- `result.urgency` is normalized to exactly `urgent`, `soon`, or `self_care`.
- `result.homeRemedies` is `[]` unless final urgency is `self_care`.
- `handleAnalyze` still accepts `{ text, language }` and does not require or inspect audio metadata.
- `backend/API.md` documents that typed concerns and confirmed voice transcripts both use `POST /api/analyze`.
- All Phase 3 requirements are addressed in this plan frontmatter: INPT-02, INPT-03, INPT-04, INPT-05, GUID-01, GUID-02, GUID-03, GUID-04, ACCS-01.
</success_criteria>

<output>
After completion, create `.planning/phases/03-multilingual-symptom-and-voice-flow/03-01-analyze-contract-normalization-SUMMARY.md`.
</output>
