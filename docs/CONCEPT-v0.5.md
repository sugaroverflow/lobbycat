# Lobbycat v0.5 — Concept Doc

**Status:** DRAFT — pending Fatima's sign-off
**Authors:** Lotus 🪷 (in conversation with Fatima)
**Date opened:** 2026-06-19
**Supersedes:** v0.4 implementation plan (which over-built before the shape was right)

---

## What this doc is

A sign-off doc, not a feature ship. v0.4 shipped a working surface but over-built before the product shape was settled — too many features for a dataset and visual language that hadn't earned them yet. v0.5 is a deliberate narrowing: one city (London), one user (Aadi), a redesigned visual language, and a tightened information architecture that makes the **frames** the thing you actually use Lobbycat *for*.

Read this end-to-end before any code lands. Every section answers one question. When Fatima signs off, the implementation order in §9 becomes the build plan.

---

## 1. Product, one sentence

**Lobbycat is a curated map of London's AI-policy companies, organised across six frames, that helps Aadi scout the field and calibrate his sense of where each company sits — and, occasionally, prep before a meeting.**

Unpacked, briefly, so the sentence has teeth:

- **Curated** — not a directory, not a scraper output. Editorial choices, with rationale attached.
- **London** — the v0.5 dataset is London-only. The narrowing is the point: a small, well-known set we can score honestly and revisit when reality shifts.
- **Six frames** — the lens. Geographic remit, policy area scope, stage of company, policy posture, working style, team style. The frames *are* the IA (see §2).
- **Scout + Calibrate (sometimes Pre-meeting prep)** — the JTBD, in Fatima's words. Scout = "who's in this space?" Calibrate = "where do I think each one sits?" Pre-meeting prep = "what should I know before this conversation?" Everything else is a nice-to-have we are deliberately not building yet.
- **Aadi** — one user, one mental model, one set of priors. Designing for n=1 is the discipline that lets the frames carry editorial weight instead of pretending to be neutral.

Out of scope for v0.5, stated plainly so we don't drift: warm intros, ATS feeds, RSS ingestion, EU Transparency Register, US LDA, magic-link auth, in-app agent chat. v0.4 was the over-build; v0.5 is the pullback.
