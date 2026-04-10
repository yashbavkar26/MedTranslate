# Requirements: MedTranslate

**Defined:** 2026-04-10
**Core Value:** Users can turn medical report data, voice concerns, or symptom text into clear English or Hindi guidance about what the result likely means and when to visit a doctor.

## v1 Requirements

Requirements for initial hackathon release. Each maps to roadmap phases.

### Inputs

- [ ] **INPT-01**: User can upload a blood test report file for analysis.
- [ ] **INPT-02**: User can type a health concern or symptom description.
- [ ] **INPT-03**: User can provide a health concern through voice input.
- [ ] **INPT-04**: User can review and confirm the voice transcript before it is analyzed.
- [ ] **INPT-05**: User can choose or automatically preserve English or Hindi as the response language.

### Report Understanding

- [ ] **RPT-01**: User receives a short plain-language summary of an uploaded report.
- [ ] **RPT-02**: User can see abnormal or notable report values explained in simple language.
- [ ] **RPT-03**: User can ask questions about the uploaded report and receive answers grounded in the report content.

### Symptom Guidance

- [ ] **GUID-01**: User receives a plain-language explanation of typed or spoken health concerns.
- [ ] **GUID-02**: User receives urgency guidance that distinguishes immediate doctor visit, routine doctor visit, and mild self-care.
- [ ] **GUID-03**: User receives basic home-care suggestions only when the concern appears mild and appropriate for self-care.
- [ ] **GUID-04**: User is told when to visit a doctor if symptoms do not improve.

### Model Integration

- [ ] **LLM-01**: Backend sends normalized report, text, and voice-derived input to a local Ollama medical model.
- [ ] **LLM-02**: Backend structures prompts so responses include explanation, urgency, safe next steps, and uncertainty.
- [ ] **LLM-03**: Backend prevents unsupported diagnosis, prescription, or definitive treatment claims in user-facing responses.

### Clients

- [ ] **WEB-01**: Desktop web user can submit report, text, or voice input and view the response.
- [ ] **MOB-01**: Flutter mobile user can submit report, text, or voice input and view the response.
- [ ] **API-01**: Web and Flutter clients use a shared backend API for analysis requests and responses.

### Safety and Accessibility

- [ ] **SAFE-01**: User sees a clear medical safety notice that MedTranslate explains and guides but does not diagnose or replace a doctor.
- [ ] **SAFE-02**: User receives urgent-care language when red-flag symptoms or severe report concerns are detected.
- [ ] **ACCS-01**: Responses are written in simple language suitable for low-literacy users.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Languages

- **LANG-01**: User can use additional Indian regional languages beyond English and Hindi.
- **LANG-02**: User can switch input and output languages independently.

### Reports

- **RPTV2-01**: User can upload multiple medical report types beyond blood tests.
- **RPTV2-02**: User can store report history and compare changes over time.

### Clinical Workflow

- **CLIN-01**: Doctor or clinic staff can review generated explanations before sharing with patients.
- **CLIN-02**: System can export a patient-friendly summary PDF.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Definitive disease diagnosis | Unsafe and not required for the hackathon demo |
| Prescription medicine or dosage recommendations | Requires licensed clinician oversight |
| Emergency service replacement | The app should advise urgent care, not act as emergency care |
| Production hospital/EHR integration | Too large for v1 and not needed for demo value |
| Broad multilingual launch | English and Hindi prove the multilingual workflow first |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INPT-01 | Phase 2 | Pending |
| INPT-02 | Phase 3 | Pending |
| INPT-03 | Phase 3 | Pending |
| INPT-04 | Phase 3 | Pending |
| INPT-05 | Phase 3 | Pending |
| RPT-01 | Phase 2 | Pending |
| RPT-02 | Phase 2 | Pending |
| RPT-03 | Phase 2 | Pending |
| GUID-01 | Phase 3 | Pending |
| GUID-02 | Phase 3 | Pending |
| GUID-03 | Phase 3 | Pending |
| GUID-04 | Phase 3 | Pending |
| LLM-01 | Phase 1 | Pending |
| LLM-02 | Phase 1 | Pending |
| LLM-03 | Phase 1 | Pending |
| WEB-01 | Phase 4 | Pending |
| MOB-01 | Phase 5 | Pending |
| API-01 | Phase 1 | Pending |
| SAFE-01 | Phase 1 | Pending |
| SAFE-02 | Phase 1 | Pending |
| ACCS-01 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0

---
*Requirements defined: 2026-04-10*
*Last updated: 2026-04-10 after roadmap creation*
