# MedTranslate Backend

Small Node backend that sends text to a local Ollama model and returns a structured, safety-filtered medical explanation.

## Requirements

- Node.js 18+
- Ollama running locally
- A model pulled in Ollama, for example:

```powershell
ollama pull meditron
```

## Run

```powershell
npm run dev
```

Optional environment variables:

```powershell
$env:PORT="8000"
$env:OLLAMA_HOST="http://localhost:11434"
$env:OLLAMA_MODEL="meditron"
npm run dev
```

## Test

Health check:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

Send text to the model:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:8000/api/analyze `
  -ContentType "application/json" `
  -Body '{"text":"My haemoglobin level is high. What does it mean?"}'
```

The backend console logs both the outgoing text and the raw Ollama response.

`POST /api/analyze` returns:

- `safetyNotice`: a patient-facing reminder that the app does not diagnose or prescribe.
- `result.explanation`: simple-language explanation.
- `result.urgency`: one of `urgent`, `soon`, or `self_care`.
- `result.uncertainty`: what the app cannot confirm from the input alone.
- `result.safeNextSteps`: safe non-prescription next steps.
- `result.warningSigns`: symptoms that should prompt urgent care.
- `result.doctorVisitGuidance`: when to see a doctor.
- `response`: a formatted text version for simple clients.
- `raw`: trimmed Ollama metadata for debugging.

If the model echoes the prompt, returns unrelated JSON, or copies schema placeholders, the backend uses a conservative fallback response instead of showing unsafe model output to the user.
