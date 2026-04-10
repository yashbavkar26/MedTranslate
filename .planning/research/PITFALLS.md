# Domain Pitfalls

**Domain:** Hackathon medical explanation and triage app using local LLM inference  
**Project:** MedTranslate  
**Researched:** 2026-04-10  
**Overall confidence:** MEDIUM-HIGH  

MedTranslate is safety-sensitive even as a hackathon demo because it turns reports, symptoms, voice input, and language translation into health guidance. The safest product shape is not "AI doctor"; it is a constrained explainer that cites extracted inputs, states uncertainty, uses simple English/Hindi, and escalates danger signs to human care.

## Critical Pitfalls

Mistakes that can make the demo unsafe, misleading, or hard to recover from.

### Pitfall 1: Letting Triage Become Diagnosis

**What goes wrong:** The model says the user "has anemia," "has diabetes," or "does not need a doctor" instead of explaining that a value or symptom may suggest a possibility and should be confirmed clinically.

**Why it happens:** General LLMs are optimized to be helpful and definitive. A medical model label does not remove the need for product constraints, especially when the app handles symptoms and lab reports outside a clinician workflow.

**Consequences:** Users may delay care, treat the output as a diagnosis, or rely on it during emergencies. The project also drifts outside its stated scope.

**Warning signs:**
- Responses use definitive diagnostic language such as "you have," "this confirms," or "no need to worry."
- The output recommends medicines, dosages, home remedies for serious symptoms, or rules out emergencies.
- The app presents one urgency level without explaining uncertainty or warning signs.
- Demo prompts succeed only when symptoms are mild and obvious.

**Prevention:**
- Add a safety contract to every model prompt: explain, do not diagnose; do not prescribe; recommend urgent care for red flags.
- Use a structured response schema with required fields: `summary`, `what_it_may_mean`, `uncertainty`, `urgency`, `when_to_seek_care`, `not_a_diagnosis`.
- Maintain a deterministic red-flag layer for urgent symptoms before or after the LLM: chest pain, severe breathing trouble, stroke signs, severe bleeding, fainting, pregnancy danger signs, very high fever with confusion, suicidal ideation, and similar cases.
- Make "consult a doctor" specific: "today", "within 1-2 days", "routine follow-up", or "emergency care now" depending on severity.

**Phase implications:**
- Phase 1 should define the response schema and safety prompt before building client polish.
- Phase 2 should add red-flag tests with fixed inputs and expected urgency categories.
- Do not add medicine recommendations in any phase unless a clinician-reviewed rule set exists.

**Confidence:** HIGH. WHO and FDA guidance emphasize governance, risk management, human oversight, and clear boundaries for health AI and clinical decision support.

### Pitfall 2: Hallucinating Report Facts or Medical Explanations

**What goes wrong:** The app invents lab values, normal ranges, report sections, disease associations, or follow-up recommendations not present in the uploaded report.

**Why it happens:** A long report plus a local model with limited context can push the model to summarize from prior knowledge instead of from the extracted report. Medical LLMs can still produce plausible false statements.

**Consequences:** A user receives confident but ungrounded guidance. The Q&A feature becomes especially risky because follow-up questions invite the model to answer beyond the report.

**Warning signs:**
- The answer mentions tests that are not in the uploaded file.
- Numeric values in the answer differ from parsed values.
- Q&A responses do not cite which report item they used.
- The model answers report-specific questions even when extraction failed.
- The same report produces inconsistent abnormal/normal classifications across runs.

**Prevention:**
- Convert report extraction into structured data first: test name, value, unit, reference range, flag, source text, parse confidence.
- Prompt the model only with structured extracted values plus a small source excerpt, not the raw entire report as the sole source.
- Require "I could not find that in the report" for missing facts.
- Show extracted values to the user before generating explanations when parse confidence is low.
- Add post-generation checks that compare any numeric values in the response to extracted values.
- Keep model temperature low for medical explanation paths.

**Phase implications:**
- Report upload should ship with a narrow supported format first, not arbitrary medical documents.
- Report Q&A should be deferred until structured extraction and grounding checks are working.
- UAT should include intentionally messy reports and questions about values not present in the file.

**Confidence:** HIGH for hallucination risk; MEDIUM for exact mitigation details because local model behavior must be tested on the chosen Ollama model.

### Pitfall 3: Incorrect Report Parsing and Unit Handling

**What goes wrong:** OCR/PDF parsing swaps columns, misses decimal points, confuses units, drops reference ranges, or treats a value as abnormal using the wrong age/sex/unit range.

**Why it happens:** Blood test reports vary by lab, PDF type, scan quality, table layout, language, abbreviations, and units. Hackathon implementations often pass raw text directly to the LLM and skip extraction validation.

**Consequences:** A correct model explanation can still be wrong because the input facts are wrong. This is a high-leverage failure: one parsing error contaminates every downstream answer.

**Warning signs:**
- Extracted values have no units or no reference ranges.
- The parser cannot distinguish result value from reference range.
- Values like `13.5` become `135`, `1.35`, or `13S`.
- The same test appears multiple times with conflicting values.
- Hindi/English mixed reports produce garbled test names.

**Prevention:**
- Start with one supported report class, ideally text-based PDF or clearly photographed CBC/LFT-style reports.
- Build an extraction preview screen: "We found these values" with an edit/confirm step before explanation.
- Store parse confidence per field and block medical explanation when critical fields are missing or low-confidence.
- Normalize units with a small whitelist for common blood tests rather than trusting free-form model conversion.
- Keep original source snippets for traceability and debugging.
- If OCR is needed, crop/table extraction should be a separate phase, not hidden inside the LLM prompt.

**Phase implications:**
- Phase 1 can support typed/manual sample values or a controlled demo PDF.
- Phase 2 can add robust PDF/table extraction.
- OCR for scanned reports should be a later phase unless the demo absolutely requires it.

**Confidence:** MEDIUM-HIGH. The risk is well-established for document extraction systems; exact parser strategy depends on the report formats selected.

### Pitfall 4: Hindi/English Language Mismatch

**What goes wrong:** The user asks in Hindi but receives English, receives mixed Hinglish with incorrect medical terms, or gets a translated explanation that changes the medical meaning.

**Why it happens:** Language detection, translation, transliteration, and medical terminology are separate problems. Local models may handle Hindi unevenly, especially for code-mixed speech and lab terms.

**Consequences:** Low-literacy users misunderstand urgency, dosage-like numbers, negation, or follow-up timing. A safe English output can become unsafe after translation.

**Warning signs:**
- Output language does not match input language or selected language.
- Hindi output transliterates technical English words without explaining them.
- Negations shift meaning, for example "not high" vs "high".
- Urgency phrases are vague: "jaldi", "kabhi", "thoda".
- The model translates lab test names inconsistently across screens.

**Prevention:**
- Let the user explicitly choose English or Hindi; do not rely only on automatic language detection.
- Use a small glossary for common terms: haemoglobin, WBC, platelet, glucose, creatinine, urgent, routine, normal range, abnormal.
- Keep medical numbers, units, and test names stable; translate the explanation around them.
- For Hindi, use short sentences and avoid Sanskritized or overly technical terms.
- Add a language QA set: same medical case in English, Hindi, and Hinglish with expected urgency preserved.

**Phase implications:**
- Bilingual support should be treated as a core safety feature, not just UI localization.
- Add the glossary before polishing the mobile app.
- Avoid adding additional languages in this milestone.

**Confidence:** HIGH for patient-safety risk in language mismatch; MEDIUM for local Hindi model quality until tested.

### Pitfall 5: Voice Transcription Errors Becoming Medical Facts

**What goes wrong:** Speech-to-text mishears symptoms, duration, body parts, negation, medication names, age, pregnancy status, or severity, then the model reasons over the wrong complaint.

**Why it happens:** Rural/noisy environments, accents, code-mixed Hindi-English speech, microphone quality, and silence can all degrade transcription. Some speech models may also hallucinate text during silence or unclear audio.

**Consequences:** The app may under-triage serious symptoms or over-triage mild ones. Users may not realize the text used by the model is wrong.

**Warning signs:**
- Voice input skips a confirmation screen.
- Transcripts omit negation words like "not", "nahi", "never".
- The transcript changes body part or duration: "chest" vs "stomach", "2 days" vs "2 weeks".
- Empty or noisy recordings still produce fluent symptoms.
- The app handles voice and typed symptoms with different safety behavior.

**Prevention:**
- Always show the transcript and require "Is this correct?" before sending to the LLM.
- Include quick edit and retry controls.
- Ask a clarifying question when transcript confidence is low or when critical slots are missing: age, symptom, duration, severity, red flags.
- Treat silence/very short audio as failed transcription, not as a medical input.
- Prefer typed fallback for the demo if voice quality is poor.

**Phase implications:**
- Voice should not be considered complete until transcript review exists.
- Red-flag detection should run on the confirmed transcript, not raw audio output.

**Confidence:** MEDIUM-HIGH. Speech transcription errors are a known health documentation risk; exact error rate depends on the speech model and recording conditions.

### Pitfall 6: Privacy Assumptions Around "Local" Processing

**What goes wrong:** The team assumes local Ollama means privacy is solved, while uploaded reports, transcripts, screenshots, logs, browser storage, mobile caches, and API payloads still contain sensitive health data.

**Why it happens:** The project does not call a hosted LLM, but it still processes protected or sensitive medical information on a developer laptop and across web/mobile clients.

**Consequences:** Demo data may leak through logs, crash reports, git commits, local storage, screenshots, or shared Wi-Fi access to the backend.

**Warning signs:**
- Backend logs full report text, symptoms, or model prompts.
- Uploaded files persist indefinitely in the repo or temp directories.
- The mobile app points to a laptop IP without access controls.
- Demo reports contain real names, phone numbers, patient IDs, or lab IDs.
- The app lacks a visible "demo only, avoid personal identifiers" message.

**Prevention:**
- Use synthetic or de-identified demo reports only.
- Do not commit uploads, generated transcripts, prompt logs, or model outputs.
- Redact names, phone numbers, addresses, patient IDs, dates of birth, and lab IDs before logging.
- Store uploads in a temporary directory with explicit cleanup.
- Bind the backend to localhost for web demos when possible; if mobile needs LAN access, use a temporary token and document the local network assumption.
- Add a short privacy notice near upload and voice controls.

**Phase implications:**
- Privacy controls belong in the first backend phase, before report upload demos.
- Mobile LAN connectivity should be added after basic auth/token protection or explicit demo-only controls.

**Confidence:** HIGH. HHS HIPAA/mobile health guidance confirms that health apps and infrastructure choices can create privacy obligations even when data is not sent to a public model.

### Pitfall 7: Low-Literacy UX That Looks Simple But Is Not Understandable

**What goes wrong:** The UI uses friendly colors and short text but still presents medical jargon, dense paragraphs, unclear urgency, and no next action.

**Why it happens:** Developers often equate "plain language" with a shorter model answer. Low-literacy UX requires structure, repetition, iconography, audio/voice support, and careful wording.

**Consequences:** Users do not know whether to seek care, what result is abnormal, what question to ask a doctor, or what the app is uncertain about.

**Warning signs:**
- Output is one long paragraph.
- Terms like "elevated", "etiology", "contraindicated", "differential", or "clinical correlation" appear.
- The urgency indicator is color-only.
- The user must infer the next step from explanation text.
- Hindi output uses complex terms without everyday explanation.

**Prevention:**
- Use a fixed answer layout: "What we found", "What it may mean", "What to do next", "Go now if", "Ask a doctor".
- Keep each sentence short and one idea at a time.
- Use labels plus color/icons for urgency, never color alone.
- Add optional audio playback later, but first make text readable.
- Include a "doctor question" line: "Ask your doctor: ...".
- Test with non-medical users using sample reports; ask them to repeat the next step in their own words.

**Phase implications:**
- The first UI should optimize the result screen, not dashboard polish.
- UAT should include comprehension checks, not only "does the API return text?"

**Confidence:** HIGH. CDC/AHRQ health literacy guidance consistently recommends plain language, jargon reduction, and user-centered communication.

### Pitfall 8: Ollama Performance and Model Fit Blocking the Demo

**What goes wrong:** Local inference is too slow, memory-heavy, or unstable for a live demo. The selected medical model may not fit laptop RAM/VRAM, Hindi quality may be weak, or long report prompts may exceed practical context limits.

**Why it happens:** Local LLM performance depends on model size, quantization, context length, CPU/GPU availability, concurrent requests, prompt length, and whether the model stays loaded.

**Consequences:** The demo stalls after upload, mobile and web requests time out, or the team reduces safety checks to improve speed.

**Warning signs:**
- First response takes over 30 seconds after every request.
- `ollama ps` shows the model unloading/reloading unexpectedly.
- Long reports cause timeouts or truncated answers.
- Web and mobile simultaneous requests lock up the backend.
- The team increases context length without measuring tokens/sec and memory.

**Prevention:**
- Benchmark the actual laptop early with the exact model, report prompt, Hindi prompt, and voice symptom prompt.
- Pick the smallest model that produces acceptable explanations; use quantized variants if needed.
- Keep prompts short through structured extraction instead of sending entire documents.
- Use one backend queue or request lock for LLM calls in the hackathon version.
- Configure model keep-alive for demo flow if memory allows.
- Add a loading state with realistic progress text and a timeout fallback.
- Cache the demo report explanation for rehearsals, but keep a real path working.

**Phase implications:**
- Model benchmarking should happen before building both clients.
- The first phase should prove one full report explanation under demo-time constraints.
- Mobile should consume the same backend endpoint after latency is known.

**Confidence:** HIGH for performance dependency; MEDIUM for exact settings because they depend on the chosen model and laptop hardware. Ollama documentation exposes keep-alive, model loading, and generation metrics that should be measured.

### Pitfall 9: Over-Scoping Web Plus Flutter Before the Backend Is Stable

**What goes wrong:** The team builds two separate experiences, duplicating validation, language handling, safety copy, and API assumptions before the core backend behavior is reliable.

**Why it happens:** The project requirement includes both desktop web and Flutter mobile, but a hackathon timeline rewards a working end-to-end slice over platform completeness.

**Consequences:** The demo has two shallow clients, inconsistent medical safety behavior, and no robust report/voice flow.

**Warning signs:**
- Web and mobile call different endpoints or format prompts differently.
- Safety disclaimers differ across clients.
- One client supports Hindi and the other does not.
- Backend response shape changes repeatedly because clients were built before the schema.
- The mobile app is blocked on local network, CORS, or file upload edge cases.

**Prevention:**
- Freeze one shared backend API schema before building the second client.
- Build the web app first as the primary demo surface because report upload/debugging is easier.
- Build Flutter as a thin client that uses the same endpoints and displays the same structured response.
- Share response contracts, urgency labels, and safety copy across clients.
- Defer mobile-only polish until report explanation, typed symptoms, and voice transcript confirmation work in one client.

**Phase implications:**
- Phase 1: backend + web happy path.
- Phase 2: safety, parsing, grounding, Hindi quality.
- Phase 3: Flutter as API consumer.
- Avoid parallel independent client implementation until the API contract is stable.

**Confidence:** HIGH based on project constraints and common hackathon delivery risk.

## Moderate Pitfalls

### Pitfall 10: Normal Range and Context Oversimplification

**What goes wrong:** The app marks values as normal/abnormal without considering the lab's reference range, age, sex, pregnancy, altitude, medications, or clinical context.

**Warning signs:**
- The app uses hard-coded ranges instead of the uploaded report's reference ranges.
- It explains a single abnormal value without saying context matters.
- It treats "borderline" as a definitive disease signal.

**Prevention:**
- Prefer the report's own reference range when available.
- If patient context is missing, say what context could change interpretation.
- Use cautious language: "above this lab's listed range" rather than "dangerously high" unless a red-flag threshold is met.

**Phase implications:** Start with explanation of report-provided flags; defer personalized interpretation until the app captures relevant context safely.

**Confidence:** MEDIUM-HIGH.

### Pitfall 11: Prompt Injection Through Uploaded Reports or User Text

**What goes wrong:** A report or user input includes text such as "ignore previous instructions" and causes the model to bypass safety rules or fabricate output.

**Warning signs:**
- Uploaded document text is inserted into the prompt without delimiters.
- Model obeys instructions found inside the report content.
- Q&A allows users to request diagnosis, medicine, or hidden prompt contents.

**Prevention:**
- Delimit user/report content as untrusted data.
- Keep safety/system instructions outside user-controllable fields.
- Reject or redirect requests for diagnosis, prescriptions, or prompt leakage.
- Prefer structured report facts over raw text whenever possible.

**Phase implications:** Add prompt-injection tests before report Q&A is considered demo-ready.

**Confidence:** MEDIUM-HIGH.

### Pitfall 12: Missing Escalation for Ambiguous or Severe Inputs

**What goes wrong:** The app tries to answer every concern, even when the right response is "I need more information" or "seek urgent care."

**Warning signs:**
- Very short prompts like "pain" receive detailed advice.
- Severe symptoms are handled with general self-care.
- The app never asks clarifying questions.

**Prevention:**
- Add minimum required symptom fields: symptom, duration, severity, age group, and red flags when relevant.
- For ambiguous inputs, ask one clarifying question instead of generating a full triage answer.
- Use conservative escalation when the input contains severe red flags.

**Phase implications:** Clarifying-question flow should be included for typed and voice symptoms before expanding symptom coverage.

**Confidence:** HIGH.

## Minor Pitfalls

### Pitfall 13: Disclaimers That Are Present But Ineffective

**What goes wrong:** The app includes a generic footer disclaimer, but the main answer still sounds authoritative.

**Warning signs:**
- Disclaimer appears only at the bottom or in small text.
- The answer itself does not express uncertainty.
- Urgent-care guidance is hidden after long explanation.

**Prevention:**
- Put safety framing inside the response content, not only in a footer.
- Keep urgent instructions near the top when relevant.
- Use concrete next steps over legalistic wording.

**Phase implications:** Include disclaimer copy in the shared response component from the first UI phase.

**Confidence:** HIGH.

### Pitfall 14: Demo Data That Accidentally Looks Real

**What goes wrong:** Synthetic reports include realistic names, IDs, dates, or hospital branding, causing confusion or privacy concerns during demos.

**Warning signs:**
- Sample files use real lab templates copied from the internet.
- Patient names or phone numbers appear in screenshots.
- Uploaded examples are stored under source control.

**Prevention:**
- Use clearly synthetic names such as "Demo Patient".
- Add a "sample report" watermark or label.
- Keep sample assets de-identified and intentionally fake.

**Phase implications:** Prepare sample data before UI recording or live judging.

**Confidence:** HIGH.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Backend API contract | Clients duplicate safety logic | Define one structured response schema and shared urgency enum first |
| Local Ollama model | Slow or inconsistent live demo | Benchmark exact prompts/model/hardware before client expansion |
| Report upload | LLM explains wrong parsed values | Add structured extraction, field confidence, and user confirmation |
| Report Q&A | Answers beyond report content | Require citations to extracted fields and "not found in report" behavior |
| Voice symptoms | Transcription errors become medical facts | Add transcript confirmation and low-confidence retry |
| English/Hindi | Translation changes urgency or meaning | Use explicit language selection, glossary, and bilingual safety tests |
| Low-literacy UX | User cannot identify next step | Fixed result layout with simple next-action language |
| Flutter mobile | LAN/API issues consume hackathon time | Build after web/backend happy path; keep mobile as thin API consumer |
| Privacy | Sensitive data leaks through logs/uploads | Use synthetic data, temp storage, redacted logs, and no upload commits |

## Recommended Phase Ordering From Pitfalls

1. **Core Safety Contract and Backend Slice** - Define response schema, urgency categories, safety prompt, refusal boundaries, and one typed symptom path through local Ollama.
2. **Report Extraction and Grounded Explanation** - Support one controlled report format, extract structured values, show confirmation, and generate explanations from extracted facts.
3. **Hindi and Low-Literacy Result UX** - Add explicit language selection, glossary-backed Hindi output, and a result screen optimized for next-step comprehension.
4. **Voice Input With Transcript Confirmation** - Add speech-to-text only after typed symptom triage works; require user confirmation before model reasoning.
5. **Flutter Thin Client** - Connect to the stable backend schema and reuse safety/urgency behavior rather than re-implementing logic.
6. **Demo Hardening** - Benchmark Ollama, add cached/sample data, sanitize logs, rehearse network setup, and add UAT cases for red flags and parse failures.

## Sources

- WHO, **Ethics and governance of artificial intelligence for health: WHO guidance** (2021). Confidence: HIGH. https://www.who.int/publications/i/item/9789240037403
- WHO, **Ethics and governance of artificial intelligence for health: guidance on large multi-modal models** (2024). Confidence: HIGH for generative AI health risk framing. https://www.who.int/publications/i/item/9789240090002
- FDA, **Clinical Decision Support Software Guidance**. Confidence: HIGH for decision-support boundary and human-review concerns. https://www.fda.gov/regulatory-information/search-fda-guidance-documents/clinical-decision-support-software
- HHS, **Health App Use Scenarios & HIPAA**. Confidence: HIGH for privacy risk framing. https://www.hhs.gov/hipaa/for-professionals/special-topics/health-apps/index.html
- HHS, **HIPAA and Cloud Computing**. Confidence: MEDIUM for MedTranslate because the app is local-first, but useful for infrastructure/privacy thinking. https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/hipaa-and-cloud-computing/index.html
- AHRQ PSNet, **Improving Patient Safety Systems for Patients With Limited English Proficiency**. Confidence: HIGH for language mismatch as patient-safety risk. https://psnet.ahrq.gov/issue/improving-patient-safety-systems-patients-limited-english-proficiency-guide-hospitals
- CDC, **Everyday Words for Public Health Communication**. Confidence: HIGH for plain-language/low-literacy communication principles. https://findtbresources.cdc.gov/view?id=342636
- Ollama API documentation, including `keep_alive` and generation/load metrics. Confidence: HIGH for operational controls; exact performance must be locally measured. https://ollama.readthedocs.io/en/api/
- OpenAI Whisper hallucination/transcription reporting and cited studies. Confidence: MEDIUM; useful as a warning for speech transcription risk, but MedTranslate's actual risk depends on the chosen transcription engine. https://www.theverge.com/2024/10/27/24281170/open-ai-whisper-hospitals-transcription-hallucinations-studies
