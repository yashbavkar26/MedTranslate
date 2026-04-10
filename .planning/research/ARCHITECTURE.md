# Architecture Patterns

**Domain:** patient-facing medical report explanation and triage assistant
**Project:** MedTranslate
**Researched:** 2026-04-10
**Overall confidence:** MEDIUM

Confidence is MEDIUM because the architecture is grounded in the project brief and current official documentation for the main integration points, but the repo has not yet chosen concrete backend, web, Flutter, OCR, or speech libraries beyond the top-level `backend`, `frontend`, and `model` directories.

## Recommended Architecture

MedTranslate should use a single local backend API as the product core. The desktop web frontend and Flutter mobile client should both call the same backend endpoints instead of duplicating medical prompting, report parsing, language routing, triage policy, or Ollama integration in each client.

Recommended shape:

```text
Desktop Web Client          Flutter Mobile Client
        |                            |
        | HTTP multipart / JSON      | HTTP multipart / JSON
        v                            v
                 Backend API
        /reports  /chat  /voice  /health
                    |
                    v
          Application Orchestrator
                    |
        +-----------+-----------+-----------+------------+
        |                       |                        |
 Report Ingestion       Speech Transcription     Language Service
 PDF/text/OCR           audio -> text             detect/normalize
        |                       |                        |
        +-----------+-----------+-----------+------------+
                    |
                    v
            Prompt + Context Builder
                    |
                    v
           Local Ollama Model Adapter
          http://localhost:11434/api/chat
                    |
                    v
           Response Safety Layer
       schema validation, disclaimers, triage guardrails
                    |
                    v
       Shared API Response to Web and Mobile
```

For the hackathon, keep everything local: frontend dev server, Flutter app, backend API, speech/report extraction workers, and Ollama on the developer laptop. The backend is the only component allowed to talk to Ollama directly.

## Component Boundaries

| Component | Responsibility | Does Not Own | Communicates With |
|-----------|----------------|--------------|-------------------|
| Desktop web frontend | Upload reports, record or submit concerns, show report summary, chat history, triage result, language selector, loading/errors | Prompt construction, medical safety policy, Ollama calls, PDF/OCR parsing | Backend API only |
| Flutter mobile client | Same user flows as web, optimized for phone camera/file/audio inputs and rural/low-literacy UX | Separate medical logic, separate model integration, separate safety logic | Backend API only |
| Backend API | Stable HTTP contract for both clients; request validation; file/audio handling; response serialization; CORS for web dev | UI state, native mobile permissions, direct rendering decisions | Clients, application services |
| Application orchestrator | Route each request through ingestion, language handling, context building, model call, safety check, and response formatting | Low-level OCR, transcription, or model transport details | All backend services |
| Report ingestion service | Accept PDF/image/text reports; extract raw text; parse likely test names, values, units, reference ranges; store request-scoped report context | Medical interpretation, final patient explanation | Backend API, context builder |
| Voice transcription service | Convert audio input to text before model prompting; normalize transcript metadata | Medical response generation or triage policy | Backend API, language service |
| Language service | Detect requested/input language, normalize internal prompt language, enforce response language as English or Hindi | Clinical reasoning | Orchestrator, prompt builder, safety layer |
| Prompt + context builder | Create structured model requests from user concern, report context, language, and safety rules | Calling clients directly, post-hoc safety enforcement | Orchestrator, Ollama adapter |
| Ollama model adapter | Single wrapper around local Ollama API; health check, timeout, retry, model name config, streaming or non-streaming response handling | Prompt policy, report parsing, client response shape | Ollama local server, orchestrator |
| Response safety layer | Validate response schema, add mandatory uncertainty and doctor guidance, classify urgency, block diagnosis/prescription wording, handle red flags | Core UI rendering, model inference transport | Orchestrator, language service |
| Session/report context store | Keep uploaded report text and parsed observations for follow-up questions during demo session | Long-term medical records, production EHR storage | Backend services |

## Shared Backend API

The backend API should be contract-first because both clients depend on it. Recommended v1 endpoints:

| Endpoint | Input | Output | Notes |
|----------|-------|--------|-------|
| `GET /health` | none | backend status, Ollama availability, configured model name | Used by both clients before demo flow |
| `POST /reports` | multipart file, optional language | `report_id`, extracted text preview, parsed observations, initial plain-language summary | Use PDF text extraction first; OCR fallback only when text is empty or image-based |
| `POST /concerns/text` | JSON: `text`, optional `language`, optional `report_id` | explanation, urgency, warning signs, suggested next step, language | Main typed symptom flow |
| `POST /concerns/voice` | multipart audio, optional language, optional `report_id` | transcript plus same response shape as text concern | Backend owns transcription so web and mobile remain consistent |
| `POST /reports/{report_id}/questions` | JSON: `question`, optional language | answer grounded in uploaded report context | Must refuse or qualify answers not supported by report content |
| `GET /reports/{report_id}` | path id | parsed report context and summary | Useful for reconnecting UI state during demo |

Use one response envelope everywhere:

```json
{
  "language": "en|hi",
  "input_type": "report|text|voice|report_question",
  "summary": "Plain-language explanation",
  "urgency": "urgent|doctor_follow_up|self_care|unclear",
  "next_steps": ["..."],
  "warning_signs": ["..."],
  "disclaimer": "Educational guidance, not a diagnosis.",
  "grounding": {
    "report_id": "optional",
    "observations_used": ["optional"]
  },
  "raw_model_id": "local model name"
}
```

The exact backend framework can be decided later, but FastAPI is a strong fit if the team uses Python because it has first-class request/file handling, straightforward CORS configuration for web development, and simple OpenAPI generation for a shared web/mobile contract.

## Data Flow

### Report Upload Flow

```text
Client selects report file
  -> POST /reports multipart
  -> Backend validates file type and size
  -> Report ingestion extracts text
  -> Parser identifies likely lab values, units, normal ranges, and abnormalities
  -> Language service chooses output language from request or detected user preference
  -> Prompt builder creates report-summary prompt with structured output instructions
  -> Ollama adapter sends prompt to local model
  -> Safety layer validates response and urgency wording
  -> Backend returns report_id, summary, abnormal findings, next steps, warning signs
  -> Client renders result and enables report Q&A
```

Direction is always client to backend to services to Ollama to safety layer to client. Clients never parse reports for clinical meaning.

### Typed Concern Flow

```text
Client sends symptom/concern text
  -> POST /concerns/text JSON
  -> Backend validates non-empty text and optional report_id
  -> Orchestrator loads report context if report_id exists
  -> Language service detects English/Hindi or uses explicit language
  -> Prompt builder combines concern, optional report context, and safety policy
  -> Ollama adapter calls local medical model
  -> Safety layer enforces no diagnosis, no prescriptions, triage category, warning signs
  -> Backend returns normalized response envelope
```

### Voice Concern Flow

```text
Client records audio
  -> POST /concerns/voice multipart
  -> Backend validates duration, format, and size
  -> Transcription service converts audio to text
  -> Language service detects/normalizes language
  -> Same path as typed concern flow
  -> Backend returns transcript plus normalized response envelope
```

Backend-owned transcription is recommended for v1 because it keeps the demo behavior consistent across desktop web and Flutter mobile. If mobile later needs offline field use, Flutter can add on-device transcription, but it should still send the transcript to the same backend `/concerns/text` path.

### Report Q&A Flow

```text
Client asks a follow-up question with report_id
  -> POST /reports/{report_id}/questions
  -> Backend loads report text and parsed observations
  -> Prompt builder instructs model to answer only from report context plus general education
  -> Ollama adapter calls model
  -> Safety layer blocks unsupported diagnosis/treatment claims
  -> Backend returns grounded answer with observations_used
```

The response should explicitly say when the uploaded report does not contain enough evidence to answer.

## Patterns to Follow

### Pattern 1: Backend-Only Model Adapter

**What:** All Ollama access goes through one backend service.

**When:** Required from the first model-backed endpoint.

**Why:** Prevents client-specific prompt drift and keeps model name, host, timeout, streaming, and structured-output handling in one place.

```typescript
// Conceptual boundary, not a required implementation language.
type ModelRequest = {
  task: "report_summary" | "concern_triage" | "report_question";
  language: "en" | "hi";
  userText: string;
  reportContext?: string;
  safetyPolicy: string;
};

type ModelResponse = {
  summary: string;
  urgency: "urgent" | "doctor_follow_up" | "self_care" | "unclear";
  next_steps: string[];
  warning_signs: string[];
};
```

### Pattern 2: Structured Response Before UI Rendering

**What:** Ask the model for a structured response and validate it before returning to clients.

**When:** Every model response that drives UI, urgency labels, or next-step guidance.

**Why:** The UI needs predictable fields, and the safety layer needs a stable object to inspect. Ollama supports JSON/structured output patterns through its API, but the backend should still validate and repair/refuse malformed model output.

### Pattern 3: Report Context as Request-Scoped Grounding

**What:** Store extracted report text and parsed observations under a `report_id`, then attach that context to follow-up questions.

**When:** Any flow involving an uploaded report or report Q&A.

**Why:** This is enough for a hackathon demo without adding vector databases or long-term medical record storage. Add embeddings only if reports become large enough that full-context prompting stops working.

### Pattern 4: Language Normalization at the Boundary

**What:** Internally normalize language to `en` or `hi`; include the target language in every prompt and validate that the response language matches.

**When:** All input flows.

**Why:** Users may speak, type, or upload in mixed English/Hindi. A single language service prevents web and mobile from making inconsistent choices.

### Pattern 5: Safety as a Separate Post-Processor

**What:** Treat safety as a backend component after model generation, not only as prompt text.

**When:** Every user-visible response.

**Why:** Prompt instructions reduce unsafe output but do not guarantee it. The post-processor can enforce required disclaimers, urgency labels, no-prescription policy, and red-flag escalation.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Separate Backend Logic Per Client

**What:** Web implements one upload/prompt path while Flutter implements another.

**Why bad:** Medical wording, language behavior, and triage outputs will diverge. Demo bugs become hard to diagnose.

**Instead:** Both clients call the same backend endpoints and render the same response envelope.

### Anti-Pattern 2: Calling Ollama Directly From the Browser or Flutter App

**What:** Clients call `localhost:11434` or hard-code model prompts.

**Why bad:** Browser `localhost` means the user's machine, not necessarily the backend laptop. Mobile `localhost` means the phone/emulator. It also leaks prompt policy into UI code.

**Instead:** Clients call the backend API; backend calls Ollama.

### Anti-Pattern 3: OCR-First Report Processing

**What:** Every uploaded PDF/image is sent through OCR immediately.

**Why bad:** Slower demo, more installation complexity, and more extraction errors for text PDFs.

**Instead:** Extract embedded PDF text first. Use OCR only when text extraction returns too little content or when the upload is an image.

### Anti-Pattern 4: Free-Form Model Output

**What:** Return whatever paragraph the model produces.

**Why bad:** UI cannot reliably display urgency, warning signs, or next steps; safety checks become brittle.

**Instead:** Require structured fields and validate them before returning.

### Anti-Pattern 5: Treating Translation as a Final String Replacement

**What:** Generate English medical guidance, then loosely translate the finished text.

**Why bad:** Translation can distort urgency or warnings, especially for medical content.

**Instead:** Put target language and safety constraints into the main prompt, then run response-level checks for required fields and simple language.

## Scalability Considerations

| Concern | Hackathon demo | 100 users | 10K users | 1M users |
|---------|----------------|-----------|-----------|----------|
| Model runtime | Local Ollama on laptop | Queue or one request at a time per local machine | Dedicated inference service or hosted model gateway | Production LLM platform with monitoring and safety review |
| Report storage | In-memory or temp directory by `report_id` | Lightweight database plus file store | Durable object storage and database | Regulated health-data architecture, access controls, retention policy |
| Report retrieval | Full text in prompt | Chunk if context grows | Embeddings/RAG for large reports | Search/index service with audit logs |
| Speech transcription | Backend local transcription or browser/mobile capture plus backend transcript | Background worker | Scaled transcription workers | Dedicated speech service |
| Safety | Rule-based post-processing plus structured schema | Logged safety outcomes | Clinician-reviewed safety test suite | Formal medical safety governance |
| Clients | Shared API, separate UI code | Shared generated API types | Versioned API contracts | Backward-compatible API lifecycle |

## Suggested Build Order

1. **Backend skeleton and shared response contract**
   - Create `/health`, response envelope types, CORS, config for Ollama host/model.
   - This unlocks web and mobile integration without waiting for full model quality.

2. **Ollama model adapter**
   - Implement health check and one non-streaming `/api/chat` call with timeout and structured output parsing.
   - Keep prompts in backend files, not client code.

3. **Typed concern flow**
   - Build `/concerns/text` first because it exercises language handling, prompting, model integration, and safety without file or audio complexity.

4. **Response safety layer**
   - Add schema validation, mandatory disclaimer, urgency normalization, warning-sign handling, and prescription/diagnosis phrasing checks before expanding inputs.

5. **Desktop web client**
   - Implement text concern flow against the shared API, then add upload and voice controls.
   - Web is the fastest demo surface for backend iteration.

6. **Report ingestion and report Q&A**
   - Add `/reports`, PDF text extraction, OCR fallback, parsed observations, report summary, and `/reports/{report_id}/questions`.
   - Keep report context session-scoped for v1.

7. **Voice transcription flow**
   - Add `/concerns/voice`, backend transcription, transcript display, and then reuse the typed concern pipeline.
   - This avoids building a separate model path for voice.

8. **Flutter mobile client**
   - Implement the same typed, report, and voice flows against the already-stable backend contract.
   - Mobile should not introduce new backend behavior unless the shared API is versioned.

9. **Demo hardening**
   - Add deterministic sample reports, seeded warning-sign examples, model-not-running error states, Hindi/English smoke tests, and end-to-end happy paths.

## Sources

- Ollama API documentation, chat and local API behavior: https://docs.ollama.com/api
- Ollama structured outputs documentation: https://docs.ollama.com/capabilities/structured-outputs
- FastAPI request file uploads: https://fastapi.tiangolo.com/tutorial/request-files/
- FastAPI CORS middleware: https://fastapi.tiangolo.com/tutorial/cors/
- PyMuPDF text extraction documentation: https://pymupdf.readthedocs.io/en/latest/recipes-text.html
- Tesseract OCR project documentation: https://tesseract-ocr.github.io/
- `pytesseract` package documentation: https://pypi.org/project/pytesseract/
- MDN Web Speech API documentation: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- Flutter `speech_to_text` package documentation: https://pub.dev/packages/speech_to_text

## Open Questions

- Which backend framework will the implementation use? FastAPI is recommended if Python is acceptable, especially because report extraction and transcription tooling are strongest there.
- Which local Ollama medical model is installed and performant on the demo laptop? The architecture assumes the model can follow structured-output instructions well enough for a hackathon demo.
- Will voice transcription run through browser/mobile speech APIs, a local Whisper-style backend model, or a simpler demo-only speech package? The boundary should stay backend-normalized either way.
- Will Hindi responses require formal translation QA, or is model-native Hindi generation acceptable for the hackathon demo? This should be tested early with representative prompts.
