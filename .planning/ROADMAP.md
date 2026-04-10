# Roadmap: MedTranslate

**Created:** 2026-04-10
**Granularity:** Coarse
**Mode:** YOLO

## Overview

MedTranslate will be built as a shared backend with two thin clients: a desktop web app and a Flutter mobile app. The backend owns local Ollama integration, report parsing, prompt construction, language handling, and medical safety checks.

| # | Phase | Goal | Requirements | UI hint |
|---|-------|------|--------------|---------|
| 1 | Backend Safety Foundation | Establish the shared API, Ollama adapter, structured response contract, and medical safety guardrails | Complete    | 2026-04-10 |
| 2 | Report Understanding | Let users upload blood test reports, extract content, explain notable values, and ask report-grounded questions | Complete    | 2026-04-10 |
| 3 | Multilingual Symptom and Voice Flow | Support typed and spoken concerns, transcript confirmation, English/Hindi output, urgency guidance, and simple low-literacy responses | INPT-02, INPT-03, INPT-04, INPT-05, GUID-01, GUID-02, GUID-03, GUID-04, ACCS-01 | yes |
| 4 | Desktop Web Demo | Build the desktop web experience for report, text, and voice flows against the shared backend | WEB-01 | yes |
| 5 | Flutter Mobile Demo | Build the Flutter mobile experience for report, text, and voice flows against the shared backend | MOB-01 | yes |

**Coverage:** 21 v1 requirements mapped, 0 unmapped.

## Phase Details

### Phase 1: Backend Safety Foundation

**Goal:** Establish the shared API, Ollama adapter, structured response contract, and medical safety guardrails.

**Requirements:** API-01, LLM-01, LLM-02, LLM-03, SAFE-01, SAFE-02

**Success Criteria:**
1. Backend exposes a health endpoint that reports API readiness and Ollama reachability.
2. Backend can send a normalized analysis request to the local Ollama medical model and receive a structured response.
3. Response schema includes plain explanation, urgency bucket, uncertainty, safe next steps, warning signs, and doctor-visit guidance.
4. Safety layer blocks or rewrites diagnosis, prescription, dosage, and emergency replacement claims.
5. Shared API contract is usable by both desktop web and Flutter clients.

**UI hint:** no

### Phase 2: Report Understanding

**Goal:** Let users upload blood test reports, extract content, explain notable values, and ask report-grounded questions.

**Requirements:** INPT-01, RPT-01, RPT-02, RPT-03

**Success Criteria:**
1. User can upload a sample blood test report and backend extracts readable report text.
2. User receives a short plain-language report summary.
3. Abnormal or notable values are explained without claiming diagnosis.
4. User can ask a question about the uploaded report and receive an answer grounded in extracted report content.
5. Extraction uncertainty is surfaced when report text or values are unclear.

**UI hint:** yes

### Phase 3: Multilingual Symptom and Voice Flow

**Goal:** Support typed and spoken concerns, transcript confirmation, English/Hindi output, urgency guidance, and simple low-literacy responses.

**Requirements:** INPT-02, INPT-03, INPT-04, INPT-05, GUID-01, GUID-02, GUID-03, GUID-04, ACCS-01

**Success Criteria:**
1. User can submit typed symptoms or health concerns in English or Hindi.
2. User can speak a concern, review the transcript, and confirm it before analysis.
3. Response language follows the selected or detected English/Hindi input language.
4. Response distinguishes immediate doctor visit, routine doctor visit, and mild self-care.
5. Responses use short, simple wording suitable for low-literacy users and include when to seek care if not improving.

**UI hint:** yes

### Phase 4: Desktop Web Demo

**Goal:** Build the desktop web experience for report, text, and voice flows against the shared backend.

**Requirements:** WEB-01

**Success Criteria:**
1. Desktop web user can submit a report, typed concern, or voice concern from one coherent interface.
2. Desktop web displays the medical safety notice before or during analysis.
3. Desktop web renders structured responses with summary, urgency, safe next steps, warning signs, and doctor-visit guidance.
4. Desktop web handles loading, backend error, Ollama unavailable, and unclear report states.
5. Desktop web demo flow works end to end with the local backend.

**UI hint:** yes

### Phase 5: Flutter Mobile Demo

**Goal:** Build the Flutter mobile experience for report, text, and voice flows against the shared backend.

**Requirements:** MOB-01

**Success Criteria:**
1. Flutter user can submit a report, typed concern, or voice concern to the same shared backend.
2. Flutter app displays the medical safety notice and simple structured response.
3. Flutter voice flow includes transcript review before analysis.
4. Flutter app supports English and Hindi output from backend responses.
5. Flutter demo flow works on an emulator or physical device connected to the local backend.

**UI hint:** yes

## Build Notes

- Start with backend contract and model adapter before polishing either client.
- Keep prompts, safety policy, report parsing, and Ollama calls out of client code.
- Use text-based PDF extraction first; defer OCR unless the hackathon sample report requires it.
- Validate Hindi output early because medical-model Hindi quality is a known risk.
- Keep voice transcription confirmable before sending medical analysis requests.

---
*Roadmap created: 2026-04-10*
