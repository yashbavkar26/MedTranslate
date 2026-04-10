# Feature Landscape

**Domain:** Hackathon medical report explanation and triage-guidance product
**Project:** MedTranslate
**Researched:** 2026-04-10
**Overall confidence:** MEDIUM

## Research Basis

MedTranslate should be planned as an educational health assistant, not a diagnostic or treatment product. The expected feature set comes from the project brief plus official guidance patterns for lab-result interpretation, urgent-care routing, medical software safety, and AI-in-health governance.

Key source-backed constraints:

- Lab explanations must include context because "normal" lab ranges vary by person and circumstances; MedlinePlus notes that age, sex, race, medicines, diet, hydration, and test preparation can affect results.
- Urgency guidance must be explicit. NHS separates life-threatening emergencies from urgent-but-not-emergency symptom checking, which maps well to MedTranslate's "immediate doctor attention / routine follow-up / basic self-care" triage levels.
- Medical software features can change regulatory posture. FDA's software guidance navigator highlights that medical software needs safety/effectiveness considerations across the product life cycle; MedTranslate v1 should avoid definitive diagnosis, prescription, dosage, and autonomous treatment decisions.
- AI-for-health guidance from WHO emphasizes ethics, human rights, transparency, accountability, and safety. For this project, that means visible uncertainty, source/context grounding, and clear escalation instructions.

## Table Stakes

Features users and judges will expect. Missing these makes the product feel incomplete for the stated demo.

| Feature | Why Expected | Complexity | Safety-Critical | Notes |
|---------|--------------|------------|-----------------|-------|
| Report upload | Core entry point for "explain my medical report" | Medium | Yes | Accept PDF/image initially; clearly show uploaded file name, processing state, and failure messages. |
| Basic report text extraction | Upload is useless unless values can be read | High | Yes | For hackathon v1, support common blood-test layouts and fail closed when extraction is uncertain. |
| Structured abnormal-result summary | Users need to know what is high/low and what it may mean | Medium | Yes | Show test name, extracted value, reference range when available, plain-language meaning, and "ask doctor" framing. |
| Plain-language report explanation | Primary value proposition for low-literacy and non-medical users | Medium | Yes | Avoid jargon; explain terms like haemoglobin, WBC, platelet count, glucose, creatinine, cholesterol. |
| Typed symptom/concern input | Required non-report flow and fallback for voice | Low | Yes | Free-text box with examples such as "I feel dizzy and tired" or "I have fever for 2 days." |
| Voice input for concerns | Required for rural/low-literacy accessibility | Medium | Yes | Include push-to-talk, recording state, transcript preview, and edit-before-submit so speech errors do not become medical errors. |
| English output | Required language | Low | No | Output should use short sentences and simple headings. |
| Hindi output | Required language and major accessibility value | Medium | Yes | Hindi should translate meaning, not just literal words; keep emergency warnings prominent and unambiguous. |
| Input-language response mode | Reduces friction for voice and typed flows | Medium | No | Detect English/Hindi when reliable; otherwise let the user choose. |
| Report Q&A | Required report-grounded interaction | Medium | Yes | Answers must be limited to the uploaded report plus general educational context; say when the report does not contain enough information. |
| Doctor-visit urgency guidance | Core triage value | Medium | Yes | Use clear buckets: seek urgent care now, see a doctor soon, routine follow-up, or self-care/watchful waiting for mild concerns. |
| Emergency warning-sign handling | Required safety baseline | Medium | Yes | Always escalate chest pain, severe breathing trouble, stroke-like symptoms, severe bleeding, fainting/unconsciousness, severe allergic reaction, suicidal intent, pregnancy danger signs, or very sick child/elderly patient. |
| Safety disclaimer | Non-negotiable for medical AI | Low | Yes | State that the app explains reports and symptoms but does not diagnose, prescribe medicine, or replace a doctor/emergency service. |
| Uncertainty and confidence language | Prevents overtrust in model output | Low | Yes | Use phrases like "may suggest," "could be related to," and "please confirm with a clinician"; never state a disease as fact. |
| Medication and prescription refusal | Prevents unsafe advice | Low | Yes | If asked for medicine, dosage, antibiotics, or stopping medication, advise consulting a qualified clinician. |
| Basic self-care only for mild concerns | Expected triage behavior | Medium | Yes | Hydration/rest/monitoring can be suggested only when no red flags are present; avoid home remedies as treatment for serious or unclear conditions. |
| Shared backend API for web and Flutter | Required because both clients must produce consistent behavior | Medium | Yes | Web and Flutter should call the same endpoints for report upload, symptom text, voice transcript, Q&A, language, and triage. |
| Desktop web client | Required demo surface | Medium | No | Prioritize fast judge demo: upload/report view, typed concern, voice button if browser support permits, Q&A panel, language toggle. |
| Flutter mobile client | Required second surface | High | No | Should demonstrate the same flows with mobile-friendly upload/image capture, mic input, and readable Hindi/English results. |
| Local Ollama inference status | Required because model runs locally | Low | No | Show "model ready / model unavailable" so demo failures are understandable. |
| Error handling and safe fallback | Medical flows must fail safely | Medium | Yes | If upload, OCR, speech, or model output fails, tell user to consult a doctor rather than guessing. |
| Privacy copy for local processing | Expected because health data is sensitive | Low | Yes | For hackathon v1, state whether data stays on the laptop and whether anything is stored. |

## Differentiators

Features that make MedTranslate more compelling for a hackathon demo. These are valuable, but not all are required for a credible v1.

| Feature | Value Proposition | Complexity | Safety-Critical | Notes |
|---------|-------------------|------------|-----------------|-------|
| Bilingual side-by-side explanation | Builds trust for mixed-language users and judges | Medium | No | Show English and Hindi together for report summaries; useful when a family member helps interpret. |
| "Why this urgency?" explanation | Makes triage guidance understandable | Medium | Yes | Link urgency bucket to specific extracted values, symptoms, duration, age, or red flags. |
| Red-flag checklist before symptom answer | Improves safety and demo credibility | Medium | Yes | Ask 3-6 targeted questions when symptoms are vague, especially fever, chest pain, breathing difficulty, dizziness, pregnancy, child symptoms. |
| Report-grounded citations/snippets | Reduces hallucination risk | Medium | Yes | Show which line/value from the uploaded report was used for each answer. |
| Normal/abnormal visual chips | Helps low-literacy users scan reports quickly | Low | No | Use labels like "Higher than report range" and "Lower than report range" instead of alarming colors alone. |
| Patient-friendly "what to ask your doctor" list | Converts explanation into action | Low | No | Good for abnormal reports; include 2-4 questions tailored to the result. |
| Follow-up timeline | Makes urgency actionable | Low | Yes | Examples: "today/emergency," "within 24-48 hours," "this week," "next routine visit." Avoid precise timing when input is uncertain. |
| Voice output/read-aloud | Strong accessibility differentiator | Medium | No | Useful for Hindi and low-literacy users; defer if core voice input is unstable. |
| Camera capture on Flutter | Mobile-first report capture | Medium | No | Useful for real-world use, but report upload from gallery is enough for v1 demo. |
| Family-share summary | Helps patients take guidance to a caregiver or doctor | Medium | Yes | Generate a concise, non-diagnostic summary; include disclaimer and urgency level. |
| Offline-first demo mode | Strengthens local-AI story | Medium | No | Bundle sample reports and sample symptom prompts so judges can test without network. |
| Safety audit log for prompts/responses | Useful for debugging and later validation | Medium | Yes | Store locally only in v1; redact if screenshots are shown. |

## Anti-Features

Features to explicitly not build for v1.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Definitive diagnosis | Unsafe and outside project scope | Use "possible explanation" and "discuss with a doctor" language. |
| Prescription or dosage advice | High clinical risk and likely changes regulatory posture | Refuse and advise clinician consultation. |
| Treatment plan generation | Too broad for hackathon safety | Give urgency guidance and doctor-question prompts. |
| Emergency replacement | Could delay care | Show emergency instructions and local emergency-care wording. |
| Broad multilingual support beyond English/Hindi | Increases translation safety risk | Validate English/Hindi first. |
| Long medical encyclopedia answers | Low-literacy users need concise help | Use short sections: meaning, why it matters, urgency, next step. |
| Storing health reports by default | Privacy risk for demo | Prefer session-only handling unless storage is explicitly needed. |
| Autonomous risk score without explanation | Encourages overtrust | Pair every urgency label with reasons and uncertainty. |
| Hidden model failures | Dangerous in a medical context | Surface extraction/model uncertainty and ask user to verify with a clinician. |

## Safety-Critical Feature Requirements

These should be treated as acceptance criteria, not polish.

| Requirement | Required Behavior |
|-------------|-------------------|
| Scope boundary | Every result page says the app provides educational explanation and triage guidance, not diagnosis or treatment. |
| Emergency escalation | If red-flag symptoms are present, the answer prioritizes urgent care instructions before explanation. |
| Doctor urgency bucket | Every response returns one urgency bucket: emergency now, doctor soon, routine follow-up, or mild/self-care with monitoring. |
| Refusal behavior | Requests for diagnosis certainty, medication, dosage, stopping medication, or home cure for serious symptoms are refused safely. |
| Report grounding | Report Q&A answers mention when the report lacks enough information. |
| Extraction uncertainty | Low-confidence OCR/parsing results are flagged; the model must not invent missing values. |
| Language safety | Hindi output must preserve emergency and disclaimer meaning, even if the rest of the explanation is simplified. |
| Human handoff | Outputs should encourage bringing the report and symptoms to a qualified clinician when abnormal, persistent, severe, or unclear. |

## Feature Dependencies

```text
Report upload -> Text extraction -> Structured report summary -> Report Q&A
Report upload -> Text extraction -> Abnormal-result detection -> Urgency guidance
Typed symptoms -> Safety/red-flag check -> Triage response
Voice input -> Speech transcript -> User transcript confirmation -> Triage response
Language selection/detection -> English/Hindi response generation -> Safety disclaimer in same language
Shared backend API -> Web client
Shared backend API -> Flutter client
Local Ollama health check -> Any AI explanation flow
```

## v1 Recommendation

Prioritize:

1. Report upload with extracted values, abnormal-result summary, and plain-language English/Hindi explanation.
2. Typed symptom input with red-flag handling, urgency bucket, safety disclaimer, and doctor-visit guidance.
3. Report Q&A grounded in uploaded report content.
4. Web client end-to-end demo using the shared backend.
5. Flutter client with the same typed-symptom and report-summary backend calls.
6. Voice input with transcript confirmation if time permits; otherwise keep voice as a polished stretch after typed flow is safe.

For hackathon v1, do not try to make every feature equally deep. The best demo path is:

```text
Upload sample blood report -> explain abnormal values in Hindi/English -> ask "Is this serious?" -> receive urgency guidance -> speak/type a symptom -> receive safe triage response.
```

Defer:

- Voice output/read-aloud: valuable but not required if voice input exists.
- Camera capture in Flutter: useful but upload/gallery is enough for v1.
- Family-share summary: good differentiator after core report Q&A is stable.
- Safety audit log: helpful for iteration, but not needed for first demo unless debugging requires it.
- Multi-report history: avoid storage/privacy complexity in v1.

## Roadmap Implications

Suggested feature phases:

1. **Safety and response contract** - Define urgency buckets, disclaimers, refusal rules, and bilingual output format before connecting clients.
2. **Backend report pipeline** - Upload, OCR/text extraction, parsing, model prompt, structured result response.
3. **Symptom and voice pipeline** - Typed symptoms first, then voice transcript confirmation.
4. **Web demo client** - Fastest way to validate full flow.
5. **Flutter client** - Reuse the same backend contract to avoid divergent medical behavior.
6. **Differentiators** - Add "why this urgency," citations/snippets, bilingual side-by-side, and doctor-question prompts.

## Sources

- MedlinePlus, "Laboratory Tests" - official patient guidance explaining lab-test ranges and factors that affect results. Confidence: HIGH. https://medlineplus.gov/laboratorytests.html
- NHS, "When to call 999" - official urgent/emergency care guidance distinguishing life-threatening emergencies from symptom-checking/urgent guidance. Confidence: HIGH. https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-999/
- FDA, "Medical Device Software Guidance Navigator" - official index showing that medical software features require safety/effectiveness and regulatory-pathway consideration. Confidence: HIGH for safety posture, MEDIUM for hackathon-specific implications. https://www.fda.gov/medical-devices/regulatory-accelerator/medical-device-software-guidance-navigator
- WHO, "Ethics and governance of artificial intelligence for health" - official AI-health governance guidance emphasizing ethics, safety, transparency, accountability, and human rights. Confidence: HIGH for AI-health design principles. https://www.who.int/publications/i/item/9789240037403
- Project context, `.planning/PROJECT.md` - authoritative source for MedTranslate scope, constraints, clients, model runtime, and out-of-scope boundaries. Confidence: HIGH.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Core feature categories | HIGH | Directly grounded in project requirements. |
| Safety-critical requirements | HIGH | Backed by official medical and AI-health guidance. |
| Differentiators | MEDIUM | Inferred from target users, hackathon demo needs, and safety patterns. |
| Flutter-specific feature depth | MEDIUM | Project requires Flutter, but implementation details remain undecided. |
| Hindi output safety | MEDIUM | Clear requirement, but quality depends on model/transcription/translation testing. |

## Gaps to Address Later

- Decide exact report types supported in v1: CBC only, lipid profile, liver/kidney panels, glucose/HbA1c, or arbitrary reports.
- Validate local Ollama model behavior in Hindi, especially emergency language and refusal behavior.
- Choose speech-to-text approach for browser and Flutter; transcript confirmation is required regardless of engine.
- Define India-specific emergency wording and local doctor-visit routing if the demo targets Indian users explicitly.
- Decide whether any health data is stored locally; if yes, add explicit retention and deletion controls.
