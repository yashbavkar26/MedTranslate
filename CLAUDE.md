<!-- GSD:project-start source:PROJECT.md -->
## Project

**MedTranslate**

MedTranslate is a hackathon project that helps patients understand medical reports and health concerns in plain language. Users can upload a blood test report, speak a concern by voice, or type how they are feeling, then receive a simple English or Hindi explanation powered by a local Ollama medical model running on the laptop.

The product has two client interfaces: a desktop web app and a Flutter mobile app. It is primarily for patients and rural or low-literacy users who need accessible explanations and triage-style guidance in their input language.

**Core Value:** Users can turn medical report data, voice concerns, or symptom text into clear English or Hindi guidance about what the result likely means and when to visit a doctor.

### Constraints

- **Timeline**: Hackathon project - prioritize a strong end-to-end demo over production completeness.
- **Model runtime**: Inference must use a medical-focused Ollama model running locally on the laptop - keeps the demo offline/local and avoids depending on a hosted LLM.
- **Languages**: v1 supports English and Hindi - enough to demonstrate multilingual value without overextending scope.
- **Clients**: v1 includes desktop web and Flutter mobile interfaces - both must connect to the same core backend behavior.
- **Medical safety**: The product provides explanation and triage guidance, not diagnosis, prescriptions, or emergency care.
- **Accessibility**: Voice input matters because rural and low-literacy users are a primary audience.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommendation
## Recommended Stack
### Core Backend
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Python | 3.12+ | Backend runtime | Best fit for PDF/text processing, local AI orchestration, and quick hackathon APIs. |
| FastAPI | Latest stable | HTTP API | Native OpenAPI docs, simple file upload endpoints, async request handling, and strong fit for React/Flutter clients. |
| Uvicorn | Current stable | Local ASGI server | Standard FastAPI dev server; run on `0.0.0.0` when testing from a physical phone on the same Wi-Fi. |
| Pydantic | FastAPI-managed current v2 | Request/response schemas | Keeps one explicit API contract for both clients. |
| httpx | Current stable | Ollama HTTP client | Async calls to Ollama's local API without coupling the app to a Python Ollama SDK. |
| python-multipart | Current stable | File upload parsing | Required by FastAPI for `UploadFile` form uploads. |
| PyMuPDF | Latest stable | PDF report text extraction | Fast, local PDF text extraction without cloud OCR; good enough for text-based lab reports. |
### Desktop Web Frontend
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | 19.x current stable | Desktop web UI | Fast to build, familiar ecosystem, strong file upload and voice input UX. |
| Vite | Latest stable | Web build tool | Fast local dev server and simple React setup. |
| TypeScript | Current stable | Frontend type safety | Prevents drift against backend response shapes during a fast build. |
| Tailwind CSS | 4 current stable | Styling | Quick responsive UI without a component framework dependency. |
| TanStack Query | 5 current stable | API state | Handles request loading/error states cleanly for report uploads and chat-style interactions. |
| Browser Web Speech API | Browser-provided | Desktop voice input | Fastest demo path for speech-to-text in Chrome/Edge, but should be treated as best-effort due browser support differences. |
### Flutter Mobile App
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Flutter | 3.41.x stable channel | Mobile client | Single Android/iOS codebase; Android demo is enough for hackathon if time tight. |
| Dart | Flutter-managed current stable | Mobile language | Native Flutter stack. |
| http | Current stable | API calls | Simple REST calls to the shared backend. |
| speech_to_text | 7.3.x current stable | Mobile speech input | Pragmatic local device speech recognition wrapper; avoids building speech recognition server-side. |
| file_picker | Current stable | Report file selection | Lets mobile users upload PDF/image/report files to the same backend endpoint. |
### Local Model Runtime
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Ollama | Current stable local install | Local model runtime | Satisfies the offline/local inference constraint and exposes a simple localhost HTTP API. |
| medllama2 | 7B Ollama library model | Medical-focused explanation model | Small enough for a laptop demo; Ollama lists 7B models as generally needing at least 8GB RAM. |
| Optional second Ollama model: multilingual general model | Small 3B-8B model only if Hindi quality fails | Hindi translation or simplification fallback | Use only if medllama2 cannot reliably answer in Hindi. Two-model chaining increases latency and demo fragility. |
## Integration Boundaries
| Boundary | Owner | Contract |
|----------|-------|----------|
| Desktop web to backend | React client | REST over HTTP, JSON responses, multipart upload for reports. |
| Flutter mobile to backend | Flutter client | Same REST API as web; configure backend base URL per environment. |
| Backend to Ollama | FastAPI service layer | HTTP calls to `http://localhost:11434/api/chat` or `/api/generate`; streaming disabled for MVP unless UI has time for it. |
| Backend to report parser | Backend ingestion module | Uploaded file becomes extracted text plus a normalized report context object. |
| Backend to safety layer | Backend prompt module | Every model request receives the same safety instruction, language instruction, and response schema. |
## API Shape
| Endpoint | Input | Output | Notes |
|----------|-------|--------|-------|
| `GET /health` | none | service status plus Ollama reachable flag | Build first; both clients need this for setup debugging. |
| `POST /reports` | `multipart/form-data` file plus language hint | `report_id`, extracted text summary, abnormal values if parsed | Store report context in memory for hackathon; defer database. |
| `POST /explain/text` | typed concern, language | explanation, urgency, next steps, safety disclaimer | Shared for web and mobile. |
| `POST /explain/speech` | transcript, language | same as text endpoint | Clients should send transcript, not raw audio, for MVP. |
| `POST /reports/{report_id}/questions` | question, language | answer grounded in report context | Prompt must include only the selected report context. |
## Report Input Strategy
## Speech Input Strategy
## English and Hindi Strategy
- Preserve the user's selected language in the response.
- Use simple, non-technical wording.
- For Hindi, prefer common Hindi medical explanations and keep lab names in English when Hindi terms would be confusing.
- Include a short English/Hindi safety disclaimer depending on selected language.
- If the model is uncertain, say so and recommend a doctor visit instead of inventing a diagnosis.
## Medical Safety Implications
- Explain and triage; do not diagnose.
- Do not prescribe medicines, dosages, or treatment plans.
- Include urgent-care warning signs when symptoms may be serious.
- Use `urgent`, `routine_follow_up`, and `self_care` style categories instead of disease probabilities.
- Ground report Q&A in uploaded report text; say when the report does not contain enough information.
- Include uncertainty and doctor-visit guidance in every medical response.
## Local Ollama Constraints
| Constraint | Implication | Recommendation |
|------------|-------------|----------------|
| RAM and model size | 7B medical models can be slow or fail on low-memory laptops. | Use `medllama2:7b` or the smallest acceptable medical model; test on the actual demo laptop before building UI polish. |
| CPU-only latency | Responses may take several seconds or more. | Add loading states and short prompts; avoid multi-turn hidden chains unless necessary. |
| Context window | Full reports can exceed practical prompt size. | Extract and trim report text; summarize report once, then reuse report context for Q&A. |
| Localhost networking | Mobile app cannot use its own `localhost` to reach laptop services. | Backend runs on laptop LAN IP; Flutter config points to `http://<laptop-ip>:8000`. Android emulator can use its host mapping, but physical device demo should use LAN IP. |
| Model availability | Demo can fail if model is not pulled. | Add a setup script or README step: `ollama pull medllama2` and a `/health` check that reports model availability. |
| Safety consistency | Direct client-to-model calls bypass guardrails. | Only backend calls Ollama. |
## Alternatives Considered
| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Backend | FastAPI | Node/Express | Python is better for PDF parsing and future local ML utilities; FastAPI gives OpenAPI out of the box. |
| Frontend | React + Vite | Next.js | Next.js adds routing/server concerns not needed for a local desktop demo. |
| Mobile | Flutter | React Native | User explicitly wants Flutter; Flutter also gives predictable Android demo builds. |
| Speech | Client-side STT | Backend Whisper | Whisper adds another local model and resource bottleneck beside Ollama. |
| Report parsing | PyMuPDF text extraction | Full OCR pipeline | OCR is high-variance and slower to stabilize for hackathon scope. |
| Storage | In-memory report store | PostgreSQL/SQLite | Database is unnecessary until multi-user persistence is required. |
| Ollama integration | Backend HTTP calls | Client-to-Ollama | Direct calls fail on mobile networking and bypass safety logic. |
## Installation
## Build Order Constraints
## Sources
| Source | Confidence | Notes |
|--------|------------|-------|
| FastAPI file upload docs: https://fastapi.tiangolo.com/tutorial/request-files/ | HIGH | Official support for `UploadFile` multipart uploads. |
| FastAPI CORS docs: https://fastapi.tiangolo.com/tutorial/cors/ | HIGH | Official guidance for browser-to-backend cross-origin setup. |
| Ollama API docs: https://github.com/ollama/ollama/blob/main/docs/api.md | HIGH | Official local HTTP API reference for `/api/generate`, `/api/chat`, and model operations. |
| Ollama medllama2 model page: https://ollama.com/library/medllama2 | MEDIUM | Ollama library page documents API example and 7B memory guidance; medical quality still needs validation. |
| Flutter platform support: https://docs.flutter.dev/reference/supported-platforms | HIGH | Official Flutter platform support reference. |
| Flutter SDK releases: https://docs.flutter.dev/development/tools/sdk/releases | HIGH | Official release archive and 2026 stable-channel schedule. |
| Flutter 3.41 docs update: https://docs.flutter.dev/release/whats-new | HIGH | Official confirmation that Flutter 3.41 is the current 2026 stable line before the May 2026 release target. |
| Flutter networking cookbook: https://docs.flutter.dev/cookbook/networking/fetch-data | HIGH | Official pattern for HTTP client calls from Flutter. |
| speech_to_text package: https://pub.dev/packages/speech_to_text | MEDIUM | Canonical package page for Flutter speech recognition plugin. |
| React installation docs: https://react.dev/learn/installation | HIGH | Official React app setup guidance. |
| Vite React guide: https://vite.dev/guide/ | HIGH | Official Vite project setup guidance. |
| PyMuPDF text extraction docs: https://pymupdf.readthedocs.io/en/latest/recipes-text.html | HIGH | Official PDF text extraction recipes. |
| MDN Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API | MEDIUM | Browser API reference; support is browser-dependent. |
| FDA clinical decision support guidance: https://www.fda.gov/medical-devices/digital-health-center-excellence/step-6-software-function-intended-provide-clinical-decision-support | HIGH | Official safety/regulatory boundary context for avoiding diagnosis/treatment recommendations. |
## Gaps and Validation Flags
- Hindi quality with `medllama2` is not guaranteed. Validate with 10-15 Hindi prompts before committing to a single-model demo.
- Scanned report OCR is intentionally deferred. If the demo report is image-only, add OCR research as a separate phase.
- Exact laptop RAM/GPU constraints are unknown. Pull and benchmark the model on the actual demo laptop before phase planning assumes latency.
- This stack does not include authentication, persistence, or production deployment because they do not support the hackathon demo goal.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
