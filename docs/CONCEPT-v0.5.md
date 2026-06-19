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

---

## 2. The six frames

The frames are the product. Everything else — the Map, Compare, Surprise, fit-notes — is a way of putting a frame between Aadi and a company so he can see the company *in that light*. v0.4 shipped five frames; v0.5 adds a sixth (**Team style**) and renames/sharpens the others to match how Aadi actually talks about the field.

Each frame is a 1–5 scale with named poles. The poles aren't moral ("1 is bad, 5 is good") — they're directional, and which end is interesting depends on what Aadi's scouting for that day. The scores are editorial, with a one-sentence rationale stored alongside each (company × frame) cell. When the rationale and the score disagree on a re-read, the rationale wins and the score updates.

### 2.1 Geographic remit

**1 — Very UK-bound  ↔  5 — Globally distributed**

How much of the company's policy work happens *in and for the UK* versus across multiple jurisdictions. A 1 is a London shop that briefs UK regulators, talks to UK media, hires from UK PhD programmes, and treats Brussels and DC as someone else's problem. A 5 is a multi-hub operation where the London office is one node among several, the policy team coordinates across timezones, and "UK position" is a thing they have *opinions* about rather than a default.

For Aadi: relevant because the bet on the UK-specific career path narrows or widens depending on where a company's centre of gravity actually sits. A London office isn't the same as a London company.

### 2.2 Policy area scope

**1 — Single-issue specialist  ↔  5 — Broad multi-domain**

How wide the company's policy surface is. A 1 has picked one fight — model evaluations, or copyright, or open-weights licensing — and gone deep. A 5 touches everything from compute export controls to age-appropriate design to public-sector procurement, and accepts the cost of being shallower in any one area.

For Aadi: the specialists are where you learn the dossier; the generalists are where you learn the *shape* of the field. Both are interesting; they're interesting for different reasons.

### 2.3 Stage of company

**1 — Pre-product / early-stage  ↔  5 — Scaled / established**

Where the company sits on the maturity curve — funding, headcount, product-in-market, regulatory footprint. A 1 is six people in a WeWork with a Stripe account and a strong opinion. A 5 has a global comms team, a regulatory affairs function, and a seat at the table when the AI Safety Institute calls a meeting.

For Aadi: not a quality signal — early-stage shops do some of the most consequential policy thinking precisely because they have to define their own posture rather than inherit one. But the *kind* of work, and the *speed* of learning, differ sharply by stage.

### 2.4 Policy posture

**1 — Frontier-defining  ↔  5 — Compliance-maintaining**

Whether the company is *writing* the rules of the game or *playing* the existing ones well. A 1 publishes Responsible Scaling Policies, drafts model cards before anyone asks for them, and shows up to consultations with new frameworks rather than responses to existing ones. A 5 has a mature compliance function, reads every new statutory instrument carefully, and competes on doing the known thing reliably.

For Aadi: this is the frame that most often *changes his mind* about a company. The two ends look superficially similar from the outside (both are "the policy team"); the day-to-day work could not be more different.

### 2.5 Working style

**1 — Writing-led  ↔  5 — Government affairs-led**

How the policy team spends its hours. A 1 is a writing shop: long-form public posts, position papers, technical reports, blog essays that other people in the field quote. A 5 is a government affairs shop: meetings in Westminster, briefings to officials, coalition work, off-the-record conversations that show up in regulation months later.

For Aadi: a personal-fit frame. He can do either; he has a preference for one. Knowing where a company actually sits (not where they say they sit on a careers page) is most of the question for him.

### 2.6 Team style

**1 — Set the frontier  ↔  5 — Execute the playbook**

Whether the team is figuring out what good looks like as they go, or executing a known playbook well. A 1 is a small team building the practice from scratch — no template to follow, lots of judgement calls, lots of "we'll know in two years if this was right." A 5 has a clear set of plays, runs them tightly, and measures the team on consistency rather than novelty.

For Aadi: closely related to **Policy posture** but distinct — a company can be frontier-defining on its *public* posture (1 on §2.4) while running a tight internal playbook (5 here), and vice versa. This frame is about what a Monday morning on the team actually feels like.

---

### A note on what the frames are *not*

They are not a scoring system that ranks companies. There is no "best frame" and no aggregate "lobbycat score" anywhere in v0.5. A company that's a 1 on every frame and a company that's a 5 on every frame are equally valid; the frames exist so Aadi can find the *interesting variation* across the field, not so the field can be linearly ordered.

They are also not stable across time. A company's stage changes; a posture can shift after a leadership hire; the geographic remit moves when a hub opens. The (company × frame) scores are editorial *as of a date*, and a re-curation pass is part of the v0.5 implementation order (§9).
