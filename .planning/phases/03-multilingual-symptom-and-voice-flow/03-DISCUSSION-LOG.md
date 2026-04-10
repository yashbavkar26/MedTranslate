# Phase 03: Multilingual Symptom and Voice Flow - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 03-Multilingual Symptom and Voice Flow
**Areas discussed:** Language handling, Voice transcript flow, Input API shape, Urgency and self-care wording

---

## Language Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Discuss backend/frontend language behavior | Clarify explicit selection, auto-detection, Hindi/Hinglish behavior, and ownership | |
| Skip language UI decisions | User stated the frontend already handles the language part | yes |

**User's choice:** Skip this area because the frontend already handles language.
**Notes:** Backend should still honor the language value sent by the frontend and keep fallback detection as a safety net.

---

## Voice Transcript Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Backend owns raw audio/STT | Backend accepts uploaded audio and transcribes it before analysis | |
| Frontend owns STT and confirmation | Frontend records/transcribes voice, user confirms transcript, backend receives text only | yes |
| Voice output only | App speaks answers aloud, but input remains report or typed text | |

**User's choice:** Frontend owns STT and confirmation.
**Notes:** User confirmed that backend input should be either report content or text prompt only. Voice reaches the backend only as confirmed text.

---

## Input API Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse `/api/analyze` | Fastest hackathon path; typed symptoms and confirmed voice transcripts both send `{ text, language }` | yes |
| Add `/api/concerns/text` | Cleaner endpoint naming for clients, while reusing the same internal concern logic | |
| the agent decides | Choose the smallest backend change that keeps clients clean | |

**User's choice:** Go with the recommendation to reuse `/api/analyze`.
**Notes:** Backend does not need to know whether text came from typing or voice in Phase 3.

---

## Urgency and Self-Care Wording

| Option | Description | Selected |
|--------|-------------|----------|
| Conservative urgency behavior | Always map to `urgent`, `soon`, or `self_care`; restrict home-care guidance to mild cases | yes |
| More permissive remedy behavior | Include home-care style suggestions across more cases | |
| the agent decides | Planner picks wording during implementation | |

**User's choice:** Conservative urgency behavior.
**Notes:** For urgent or unclear concerns, response should avoid remedy framing and focus on getting medical help.

---

## the agent's Discretion

- Exact internal helper/function structure for reusing `/api/analyze`.
- Specific low-literacy wording, as long as it remains conservative and safe.

## Deferred Ideas

- Backend-owned speech-to-text or raw audio upload.
- Separate concern-specific endpoint.
- Language-selection UI work.
