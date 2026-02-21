# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Metal-MES** — Manufacturing Execution System for a metal processing operation.

This is a **Dynamic-level** fullstack project (bkit pipeline phase 1, onboarding not yet completed). No application code exists yet; the project is in early setup.

## Development Context

- bkit PDCA pipeline is active (`docs/.pdca-status.json`, `docs/.bkit-memory.json`)
- Current pipeline phase: 1 (Schema / Terminology)
- Platform: Dynamic (fullstack — Next.js + Prisma + PostgreSQL, 온프레미스)

## Recommended Next Steps

Since no code exists yet, follow the bkit 9-phase pipeline:

1. `/phase-1-schema` — Define domain terminology and data model (production orders, heats, coils, quality specs, equipment, shifts, etc.)
2. `/phase-2-convention` — Establish coding conventions
3. `/phase-3-mockup` — UI/UX prototypes for MES screens (dashboard, work orders, quality tracking)
4. `/pdca plan` before implementing any feature
