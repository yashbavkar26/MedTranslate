# MedTranslate Backend API

This backend provides a local LLM integration using Ollama. It normalizes inputs, fetches responses from a medical model (default `meditron`), and formats them into a predictable clinical safety structure.

## Base URL
Default: `http://localhost:8000`

---

## 1. Health & Contract Status
`GET /health`

Checks if the Node.js backend is running and can connect to the local Ollama instance. Also outputs the expected response shapes.

### Request
No parameters.

### Response (200 OK)
```json
{
  "ok": true,
  "backend": "ready",
  "ollamaHost": "http://localhost:11434",
  "ollamaReachable": true,
  "model": "meditron",
  "availableModels": ["meditron", "llama3"],
  "responseContract": {
    "urgency": ["urgent", "soon", "self_care"],
    "fields": [
      "explanation",
      "urgency",
      "uncertainty",
      "safeNextSteps",
      "warningSigns",
      "doctorVisitGuidance"
    ]
  }
}
```

---

## 2. Analyze Health Concern
`POST /api/analyze`

Instructs the Ollama model to analyze medical text or report findings. Returns strict JSON containing a plain-language explanation and safety-bound triage guidance. Strips unsafe claims (diagnoses, prescription dosages).

### Request
```json
{
  "text": "I have had a high fever for 3 days and feel dizzy.",
  "language": "English" // Optional. Auto-detected from text if omitted.
}
```

### Response (200 OK)
```json
{
  "model": "meditron",
  "safetyNotice": "MedTranslate explains health information in simple words. It does not diagnose, prescribe medicine, or replace a doctor.",
  "result": {
    "explanation": "You may have a fever that is causing dizziness. A doctor should check for the actual cause.",
    "urgency": "soon",
    "uncertainty": "This app cannot confirm the cause from this text alone. The exact value, normal range, symptoms, age, and medical history matter.",
    "safeNextSteps": [
      "Rest and drink fluids.",
      "Watch your temperature."
    ],
    "warningSigns": [
      "Extreme dizziness",
      "Trouble breathing"
    ],
    "doctorVisitGuidance": "See a doctor soon for a proper review.",
    "language": "English",
    "source": "ollama"
  },
  "response": "Plain text summary string ready for UI display...",
  "raw": {
    "...": "Underlying Ollama inference telemetry"
  }
}
```
