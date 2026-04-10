# Project Research Summary

**Project:** MedTranslate
**Domain:** Local-first patient-facing medical report explanation and triage assistant
**Researched:** 2026-04-10
**Confidence:** MEDIUM

## Executive Summary

MedTranslate is a hackathon medical explainer, not an AI doctor. The strongest product shape is a constrained educational assistant that accepts a blood report, typed concern, or confirmed voice transcript, then returns simple English or Hindi explanations plus triage-style next steps. Expert patterns across the research point to centralizing all medical policy, prompt construction, report grounding, language handling, and Ollama access in one backend API, with desktop web and Flutter as thin clients over the same contract.

The recommended v1 is a local-first demo: Python/FastAPI backend, React/Vite desktop web client, Flutter mobile client, PyMuPDF for text-based PDF extraction, client-side or confirmed speech-to-text for voice, and Ollama running a small medical-focused model such as `medllama2:7b` on the developer laptop. Build a typed symptom path and response safety contract first, then report extraction and report-grounded Q&A, then web UX, voice, Flutter, Hindi validation, and demo hardening.

The main risks are medical overclaiming, hallucinated report facts, parsing/unit errors, unsafe Hindi translation, voice transcription mistakes, privacy leakage, and local model performance. Mitigate them with structured response schemas, deterministic red-flag escalation, no diagnosis or prescription behavior, report value confirmation, citations/snippets from extracted report data, transcript confirmation before model reasoning, synthetic demo data, redacted logs, early Ollama benchmarking, and a narrow supported report format for v1.

## Key Findings

### Recommended Stack

Use one Python backend as the product core. It should own file ingestion, report parsing, language normalization, safety guardrails, prompt construction, report-grounded Q&A, and all Ollama calls. Both clients should call this API over HTTP; neither browser nor Flutter should call Ollama directly.

**Core technologies:**
- Python 3.12+ and FastAPI: backend runtime and HTTP API with strong file upload and OpenAPI support.
- Uvicorn, Pydantic v2, `httpx`, `python-multipart`: local server, typed schemas, Ollama HTTP integration, and multipart upload handling.
- PyMuPDF: fast local text extraction for text-based PDF lab reports.
- React 19, Vite, TypeScript, Tailwind CSS 4, TanStack Query 5: fast desktop web demo with typed API integration and reliable loading/error states.
- Flutter 3.41.x, Dart, `http`, `speech_to_text`, `file_picker`: mobile client using the same backend endpoints.
- Ollama with `medllama2:7b`: local medical-focused model runtime, with Hindi quality and laptop performance requiring early validation.
- Browser Web Speech API or Flutter `speech_to_text`: pragmatic voice input, but always show an editable transcript before medical reasoning.

Critical version/operational requirements: run FastAPI on `0.0.0.0` only when physical mobile testing needs LAN access; configure Flutter with the laptop LAN IP, not `localhost`; pull and benchmark the Ollama model before UI polish; keep streaming off for MVP unless the UI is ready for it.

### Expected Features

**Must have (table stakes):**
- Report upload with processing state, safe failure messages, and visible file context.
- Text-based report extraction for common blood-test reports, with structured values, units, reference ranges, flags, and parse confidence where possible.
- Plain-language report explanation in English and Hindi.
- Abnormal-result summary that says what is high/low, what it may mean, and what to ask a doctor.
- Typed symptom/concern input as the safest non-report path and fallback for voice.
- Voice input with transcript preview, edit, and confirmation before submission.
- Report Q&A grounded in uploaded report content, with "not found in the report" behavior.
- Urgency guidance using clear buckets: emergency now, doctor soon, routine follow-up, or mild/self-care with monitoring.
- Emergency warning-sign escalation and safe refusal for diagnosis, medicine, dosage, stopping medication, or serious home-cure requests.
- Shared backend API for desktop web and Flutter.
- Local Ollama readiness/status so demo failures are diagnosable.
- Privacy copy and local-processing expectations near upload and voice controls.

**Should have (competitive):**
- "Why this urgency?" explanation tied to symptoms, duration, red flags, or extracted values.
- Report-grounded citations/snippets for each answer.
- Bilingual side-by-side explanation for report summaries.
- Normal/abnormal visual chips that are label-driven, not color-only.
- Patient-friendly "what to ask your doctor" prompts.
- Follow-up timeline phrasing such as "today", "within 24-48 hours", "this week", or "routine visit" when input supports it.
- Offline demo mode with sample reports and sample symptom prompts.

**Defer (v2+):**
- Full OCR pipeline for arbitrary scanned reports.
- Camera capture beyond simple Flutter gallery/file upload.
- Voice output/read-aloud.
- Family-share summaries.
- Multi-report history and persistent health storage.
- Broad multilingual support beyond English/Hindi.
- Production hospital/EHR integration.

### Architecture Approach

The architecture should be contract-first and backend-centered. Desktop web and Flutter submit multipart uploads or JSON to the same FastAPI endpoints. The backend validates inputs, extracts or loads report context, normalizes language, builds a safety-constrained prompt, calls Ollama through one adapter, validates the structured response, applies red-flag/refusal/disclaimer rules, and returns one shared response envelope.

**Major components:**
1. Backend API: stable HTTP contract, request validation, CORS, file handling, and serialized response envelopes.
2. Application orchestrator: routes every request through ingestion, language, context, model, and safety services.
3. Report ingestion service: extracts PDF text, parses common lab values, tracks source snippets and confidence.
4. Language service: normalizes target language to `en` or `hi`, supports explicit user selection, and preserves medical numbers/test names.
5. Prompt and context builder: constructs structured model requests with report grounding and safety policy.
6. Ollama model adapter: wraps local Ollama health checks, timeouts, retries, model config, and non-streaming chat/generate calls.
7. Response safety layer: validates schema, injects mandatory disclaimers, normalizes urgency, blocks diagnosis/prescription wording, and escalates red flags.
8. Session/report context store: keeps report text and parsed observations in memory or temporary local storage for the demo session.

Recommended v1 endpoints: `GET /health`, `POST /reports`, `POST /concerns/text`, `POST /reports/{report_id}/questions`, and optionally `POST /concerns/voice` if transcription is backend-owned. If clients transcribe locally, send the confirmed transcript to `/concerns/text`.

### Critical Pitfalls

1. **Triage becomes diagnosis**: enforce no-diagnosis/no-prescription prompts, deterministic red-flag escalation, urgency buckets, and response schema validation.
2. **Hallucinated report facts**: parse structured report data first, include source snippets, require "not found in report", and compare generated numeric claims against extracted values.
3. **Incorrect parsing or unit handling**: start with a narrow report class, show extracted values before explanation when confidence is low, and normalize only a small whitelist of common lab units.
4. **Hindi/English meaning drift**: require explicit language selection, use a common medical glossary, preserve numbers/units/test names, and run bilingual safety tests early.
5. **Voice transcription errors become facts**: always show and confirm transcript; retry or ask clarification when transcript confidence is low or duration/severity/negation is missing.
6. **Local privacy assumptions**: use synthetic reports, avoid logging full health data, redact identifiers, store uploads temporarily, and document LAN/mobile demo exposure.
7. **Ollama performance blocks demo**: benchmark the exact model, hardware, report prompt, Hindi prompt, and symptom prompt before building both clients.
8. **Two clients overtake backend stability**: freeze one shared response contract before Flutter; build web first as the fastest debugging surface.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Safety Contract and Backend Skeleton
**Rationale:** Medical behavior, response shape, urgency buckets, refusal rules, and Ollama reachability must be stable before UI and report complexity.
**Delivers:** FastAPI app, config, CORS, `/health`, typed response envelope, urgency enum, safety policy, local Ollama adapter stub/health check, synthetic demo-data privacy rules.
**Addresses:** Shared backend API, local Ollama inference status, safety disclaimer, uncertainty language, doctor-visit urgency guidance, medication refusal.
**Avoids:** Triage becoming diagnosis, client prompt drift, hidden model failures, privacy leakage through early logs.

### Phase 2: Typed Concern and Red-Flag Triage
**Rationale:** Typed text is the smallest path that exercises language handling, prompting, Ollama, safety validation, and triage without file or audio uncertainty.
**Delivers:** `POST /concerns/text`, structured model prompt, schema validation, deterministic red-flag handling, safe refusal behavior, English/Hindi output fields, model timeout fallback.
**Addresses:** Typed symptom input, English/Hindi response, emergency warning signs, urgency bucket, basic self-care only for mild concerns.
**Avoids:** Missing escalation for severe inputs, ineffective disclaimers, ambiguous advice, unsafe medication requests.

### Phase 3: Report Extraction and Grounded Explanation
**Rationale:** Report explanation is core value, but it must follow the safety contract and should begin with controlled text-based PDFs before OCR.
**Delivers:** `POST /reports`, PyMuPDF extraction, supported report format rules, structured lab observations, source snippets, parse confidence, report summary, abnormal-result explanation.
**Addresses:** Report upload, basic report extraction, abnormal-result summary, plain-language report explanation, extraction uncertainty.
**Avoids:** Hallucinated report facts, parsing/unit errors, normal-range oversimplification, OCR-first complexity.

### Phase 4: Report Q&A and Grounding Checks
**Rationale:** Q&A is riskier than one-shot summaries because users ask beyond the document; it should depend on stored report context and grounding behavior.
**Delivers:** `POST /reports/{report_id}/questions`, session report store, answer grounding, observations used, "not in report" handling, numeric consistency checks.
**Addresses:** Report Q&A, report-grounded citations/snippets, "why this urgency?" for report-related concerns.
**Avoids:** Unsupported diagnosis, hallucinated report sections, prompt injection through uploaded report text.

### Phase 5: Web Demo Client and Low-Literacy Result UX
**Rationale:** Web is the fastest client for end-to-end debugging and judge demos; result comprehension matters more than dashboard polish.
**Delivers:** React/Vite desktop flow for health status, report upload, typed concern, report summary, Q&A, language toggle, loading/error states, fixed result layout.
**Addresses:** Desktop web client, local processing copy, normal/abnormal chips, doctor-question prompts, simple next-action guidance.
**Avoids:** Low-literacy UX failures, color-only urgency, long jargon-heavy answers, hidden extraction/model errors.

### Phase 6: Hindi Quality, Glossary, and Bilingual Validation
**Rationale:** Hindi is a safety feature, not cosmetic localization; it can change model or prompt strategy and should be validated before mobile polish.
**Delivers:** English/Hindi/Hinglish smoke set, common medical glossary, prompt refinements, emergency/disclaimer preservation checks, fallback decision for second multilingual model if needed.
**Addresses:** Hindi output, input-language response mode, language safety, bilingual side-by-side report explanation if time allows.
**Avoids:** Language mismatch, mistranslated urgency, unclear Hindi timelines, inconsistent lab terminology.

### Phase 7: Voice Input With Transcript Confirmation
**Rationale:** Voice adds accessibility but must not bypass typed-symptom safety; confirmed transcript should reuse the text concern pipeline.
**Delivers:** Web speech input or Flutter/client STT path, recording state, transcript preview, edit/retry, confirmed transcript submission to `/concerns/text` or `/concerns/voice`.
**Addresses:** Voice input for concerns, transcript confirmation, typed fallback.
**Avoids:** Transcription errors becoming medical facts, silence hallucinations, inconsistent voice vs typed behavior.

### Phase 8: Flutter Thin Client
**Rationale:** Flutter should consume the stable backend contract after web/backend flows work, avoiding duplicate safety logic and LAN surprises.
**Delivers:** Flutter app with backend base URL config, health check, report file picker/upload, typed concern, language selector, report summary/Q&A, voice transcript if stable.
**Addresses:** Flutter mobile client, shared backend behavior, mobile-friendly report and voice flows.
**Avoids:** Separate client logic, mobile `localhost` mistakes, CORS/LAN debugging consuming core demo time.

### Phase 9: Demo Hardening
**Rationale:** Local AI demos fail on setup, latency, model availability, sample data, and network assumptions; hardening should be explicit.
**Delivers:** Ollama pull/setup notes, model benchmark, timeout/loading states, sample synthetic reports, red-flag UAT cases, Hindi smoke cases, parse-failure cases, LAN/mobile checklist, temp upload cleanup.
**Addresses:** Offline/local demo mode, error handling and safe fallback, privacy notice, model-ready state.
**Avoids:** Live demo stalls, real-data leakage, model-not-pulled failures, brittle sample prompts.

### Phase Ordering Rationale

- Safety contract and typed concern flow come first because every later feature depends on the same response envelope, urgency policy, refusal rules, language routing, and model adapter.
- Report upload is split from report Q&A because extraction quality and grounding must be proven before users can ask arbitrary follow-up questions.
- Web precedes Flutter because it is faster to debug file upload, model latency, and result layout in a desktop browser.
- Hindi validation is elevated before voice/mobile polish because poor Hindi quality may require a prompt, glossary, or model-chain change.
- Voice is later because transcript confirmation and red-flag checks must already exist; voice should feed the typed pipeline, not create a second medical path.
- Demo hardening is its own phase because local Ollama, LAN mobile access, synthetic reports, and privacy cleanup are common hackathon failure points.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3: Report Extraction and Grounded Explanation**: needs exact supported report formats, value/unit parsing strategy, confidence thresholds, and whether any OCR is unavoidable.
- **Phase 6: Hindi Quality, Glossary, and Bilingual Validation**: needs model-specific Hindi testing and possibly a second local multilingual model decision.
- **Phase 7: Voice Input With Transcript Confirmation**: needs final STT choice for web and Flutter, permission handling, and transcript confidence behavior.
- **Phase 8: Flutter Thin Client**: needs platform/network setup details for physical Android device vs emulator and file picker behavior.
- **Phase 9: Demo Hardening**: needs exact laptop RAM/CPU/GPU benchmarking and Ollama model keep-alive/latency settings.

Phases with standard patterns (skip research-phase unless blocked):
- **Phase 1: Safety Contract and Backend Skeleton**: FastAPI health/config/schema patterns are well documented.
- **Phase 2: Typed Concern and Red-Flag Triage**: endpoint, schema validation, and rule-based red-flag patterns are straightforward once policy is defined.
- **Phase 4: Report Q&A and Grounding Checks**: can proceed from Phase 3 findings plus standard request-scoped context patterns.
- **Phase 5: Web Demo Client and Low-Literacy Result UX**: React/Vite upload/forms/API-state patterns are standard; UX copy needs validation, not deep technical research.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Strong official-source support for FastAPI, React, Flutter, PyMuPDF, Ollama, and speech packages; local model quality, Hindi output, and laptop performance still require validation. |
| Features | MEDIUM-HIGH | Core features are directly grounded in project requirements and official medical safety guidance; differentiators are inferred from hackathon/demo and low-literacy needs. |
| Architecture | MEDIUM | Backend-centered contract is strongly supported by safety and integration constraints; exact transcription ownership and report parsing depth remain open. |
| Pitfalls | MEDIUM-HIGH | Medical safety, hallucination, language, privacy, and performance risks are well supported; exact mitigations must be tuned to chosen model, reports, and devices. |

**Overall confidence:** MEDIUM

### Gaps to Address

- Supported v1 report types: choose CBC-only, common blood panels, or broader PDFs before implementing extraction.
- Hindi model quality: test `medllama2` on 10-15 English/Hindi/Hinglish cases and decide whether a second local model is needed.
- Actual hardware capacity: benchmark the demo laptop with the exact Ollama model and prompts before committing to latency-sensitive UX.
- Speech implementation: decide client-side STT vs backend-owned `/concerns/voice`; transcript confirmation is mandatory either way.
- OCR scope: defer unless the demo report is image-only; if required, research OCR as a separate phase.
- Privacy handling: decide temp storage lifetime, redaction rules, and whether LAN mobile access needs a simple demo token.
- India-specific emergency wording: define user-facing urgent-care language suitable for the expected audience.

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md` - authoritative project scope, constraints, clients, and out-of-scope boundaries.
- FastAPI file upload docs: https://fastapi.tiangolo.com/tutorial/request-files/
- FastAPI CORS docs: https://fastapi.tiangolo.com/tutorial/cors/
- Ollama API docs: https://docs.ollama.com/api
- Ollama structured outputs docs: https://docs.ollama.com/capabilities/structured-outputs
- PyMuPDF text extraction docs: https://pymupdf.readthedocs.io/en/latest/recipes-text.html
- React installation docs: https://react.dev/learn/installation
- Vite guide: https://vite.dev/guide/
- Flutter supported platforms and release docs: https://docs.flutter.dev/reference/supported-platforms
- Flutter networking cookbook: https://docs.flutter.dev/cookbook/networking/fetch-data
- FDA clinical decision support/software guidance: https://www.fda.gov/regulatory-information/search-fda-guidance-documents/clinical-decision-support-software
- WHO AI health ethics guidance: https://www.who.int/publications/i/item/9789240037403
- WHO large multimodal AI health guidance: https://www.who.int/publications/i/item/9789240090002
- HHS health app and HIPAA scenarios: https://www.hhs.gov/hipaa/for-professionals/special-topics/health-apps/index.html
- NHS emergency-care guidance: https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-999/
- MedlinePlus laboratory tests guidance: https://medlineplus.gov/laboratorytests.html

### Secondary (MEDIUM confidence)
- Ollama `medllama2` model page: https://ollama.com/library/medllama2
- MDN Web Speech API docs: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- Flutter `speech_to_text` package: https://pub.dev/packages/speech_to_text
- Tesseract OCR docs: https://tesseract-ocr.github.io/
- `pytesseract` package docs: https://pypi.org/project/pytesseract/
- AHRQ limited English proficiency patient-safety guide: https://psnet.ahrq.gov/issue/improving-patient-safety-systems-patients-limited-english-proficiency-guide-hospitals
- CDC Everyday Words for Public Health Communication: https://findtbresources.cdc.gov/view?id=342636

### Tertiary (LOW confidence)
- General reporting on Whisper transcription hallucination risk: useful warning for voice safety, but actual risk depends on chosen STT engine and recording conditions.

---
*Research completed: 2026-04-10*
*Ready for roadmap: yes*
