# MedTranslate Agent Guide

## Project Context

Read `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, and `.planning/STATE.md` before making project changes.

MedTranslate is a hackathon app that helps patients understand medical reports and health concerns in plain English or Hindi. It uses a local Ollama medical model through a shared backend, with desktop web and Flutter mobile clients.

## Core Constraints

- The product explains and provides triage-style guidance; it must not claim to diagnose, prescribe medicine, or replace emergency care.
- Backend owns all Ollama calls, prompts, report parsing, language handling, and medical safety checks.
- Web and Flutter clients should stay thin and consume the same backend API.
- v1 supports English and Hindi only.
- Optimize for a working hackathon demo before production completeness.

## GSD Workflow

Use GSD planning artifacts as the source of truth:

- Current roadmap: `.planning/ROADMAP.md`
- Current phase state: `.planning/STATE.md`
- v1 requirements and traceability: `.planning/REQUIREMENTS.md`
- Research notes: `.planning/research/`

Before substantial edits, continue through the next GSD command:

- `$gsd-discuss-phase 1` to clarify Phase 1 implementation
- `$gsd-plan-phase 1` to produce the Phase 1 execution plan

## Current Next Step

Phase 1 is **Backend Safety Foundation**: shared API, Ollama adapter, structured medical response contract, and safety guardrails.
