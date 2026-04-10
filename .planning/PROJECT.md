# MedTranslate

## What This Is

MedTranslate is a hackathon project that helps patients understand medical reports and health concerns in plain language. Users can upload a blood test report, speak a concern by voice, or type how they are feeling, then receive a simple English or Hindi explanation powered by a local Ollama medical model running on the laptop.

The product has two client interfaces: a desktop web app and a Flutter mobile app. It is primarily for patients and rural or low-literacy users who need accessible explanations and triage-style guidance in their input language.

## Core Value

Users can turn medical report data, voice concerns, or symptom text into clear English or Hindi guidance about what the result likely means and when to visit a doctor.

## Requirements

### Validated

(None yet - ship to validate)

### Active

- [ ] User can upload a blood test report and receive a plain-language explanation in the input language.
- [ ] User can speak a health concern by voice and receive a plain-language response in the input language.
- [ ] User can type how they are feeling and receive a plain-language response in the input language.
- [ ] User can ask questions about an uploaded report and receive answers grounded in the report content.
- [ ] User can see whether a result or concern may need immediate doctor attention, routine follow-up, or basic self-care.
- [ ] User can use the product in English and Hindi.
- [ ] The system runs inference through a local Ollama medical model on the developer laptop.
- [ ] The product is available through both a desktop web interface and a Flutter mobile app.

### Out of Scope

- Definitive diagnosis - the model can explain, summarize, and suggest urgency, but it must not claim to diagnose disease.
- Prescription of medicine or dosage - unsafe without a clinician and not required for the hackathon demo.
- Emergency medical replacement - the app should advise urgent care when warning signs are present, not replace emergency services.
- Broad multilingual coverage beyond English and Hindi - defer until the core experience works well.
- Production hospital integration - the hackathon goal is a working demo, not EHR or clinic deployment.

## Context

The project name is MedTranslate. The expected demo flow is: upload a blood test report, ask a concern by voice, or type symptoms; the backend sends the user input to a local Ollama medical model; the app returns a simple explanation and triage guidance in English or Hindi.

The model should summarize medical reports, simplify medical terms, support question-answering over a report, and explain abnormal values in plain language. For example, if haemoglobin is higher than normal, the app should say that haemoglobin levels are above the normal range, explain what that may mean in accessible wording, and recommend an appropriate next step.

The safety posture is educational and triage-oriented. Responses should include uncertainty, doctor-visit guidance, urgent warning signs when relevant, and simple home-care suggestions only for mild concerns where self-care is appropriate. The app should avoid presenting home remedies as treatment for serious or unclear conditions.

The repository currently has top-level `backend`, `frontend`, and `model` directories. The web interface is expected to live under the frontend area, the local model integration under the backend/model boundary, and the Flutter mobile app should be planned as a separate client surface.

## Constraints

- **Timeline**: Hackathon project - prioritize a strong end-to-end demo over production completeness.
- **Model runtime**: Inference must use a medical-focused Ollama model running locally on the laptop - keeps the demo offline/local and avoids depending on a hosted LLM.
- **Languages**: v1 supports English and Hindi - enough to demonstrate multilingual value without overextending scope.
- **Clients**: v1 includes desktop web and Flutter mobile interfaces - both must connect to the same core backend behavior.
- **Medical safety**: The product provides explanation and triage guidance, not diagnosis, prescriptions, or emergency care.
- **Accessibility**: Voice input matters because rural and low-literacy users are a primary audience.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use local Ollama model | Hackathon demo should run from the laptop and showcase local medical AI capability | - Pending |
| Support English and Hindi first | Matches the target user base while keeping v1 achievable | - Pending |
| Build both desktop web and Flutter mobile clients | User requested two client interfaces for the demo | - Pending |
| Frame output as explanation and triage guidance | Safer than diagnosis or treatment claims and easier to validate | - Pending |
| Prioritize reports, voice concerns, and typed symptoms | These are the three input modes needed for the desired demo | - Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? Move to Out of Scope with reason
2. Requirements validated? Move to Validated with phase reference
3. New requirements emerged? Add to Active
4. Decisions to log? Add to Key Decisions
5. "What This Is" still accurate? Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-10 after initialization*
