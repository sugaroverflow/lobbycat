# Lobbycat v0.8 — Refactor / scoping doc

**Status:** DRAFT — pending Fatima's sign-off. Waiting on her v0.7 click-through + feedback first.
**Author:** Lotus 🪷 (in conversation with Fatima)
**Date opened:** 2026-06-24
**Theme:** The soul. A custom OpenClaw skill (`clarify`) + a fourth sibling agent (Lobbycat herself) that runs it, with an in-app surface for Aadi.

---

## What this doc is

A sign-off doc for the v0.8 release. The premise:

v0.7 shipped the **engine** (frames, weights, scoring, dashboard). v0.7.1 made it **reliable** (retry, error boundaries, Sentry, smoke tests). v0.8 ships the **soul** — the part where the cat is not just a label on a dashboard but a *conversational presence* who helps Aadi notice what he hadn't articulated about what he actually cares about.

The architecture insight that makes this v0.8 instead of "a feature on v0.7": **the cat becomes a fourth OpenClaw agent on the server**, not a Claude call inside the Next.js app. She has her own workspace, her own identity, her own commit history. She runs a custom OpenClaw skill — `clarify` — that codifies the lobbycat-shaped interview move set. Calling her from the web app is just one consumer of that agent; she could equally be invoked by Glyphie noticing something interesting, by Lotus during scoping, or by a future cron-driven "weekly check-in" cadence.

Read end-to-end before any code lands. §11 turns §10 into the build plan.

---

## 1. Product, one sentence

> **Lobbycat is a live scoring engine wrapped around a research familiar who occasionally sits with you and asks the question that needs asking.**

(v0.7's sentence — "explore, dive deep, and make decisions" — is the *job*. This is the *soul*. The README will keep v0.7's sentence as the headline; this one lives in the scoping doc as the design north star.)

---

## 2. The skill — `clarify`

### 2.1 Why a skill, not a feature

A skill is portable across agents and surfaces. Once `clarify` is authored as an OpenClaw skill at `~/.openclaw/plugin-skills/clarify/SKILL.md`, it can be invoked by:

- The Lobbycat agent (the new fourth sibling — see §3)
- Glyphie when her research surfaces a contradiction worth grilling on
- Lotus when she's scoping a v0.X release with Fatima
- Any future agent or cron job

A feature would have hard-coded all of that into a Next.js route. A skill keeps the prompt portable and the surface flexible.

### 2.2 Naming

**Skill name: `clarify`**

Considered: `grill-me` (Pocock's, too aggressive for our use), `nudge` (too soft), `sit-with` (right tone, less grep-able), `prompt` (overloaded). **`clarify`** lands cleanly — it names what the user gets (sharpened thinking), not what the cat does (which would be "interviewing"). It also pairs grammatically: *"clarify a frame," "clarify what's making this hard," "clarify Wayve."*

### 2.3 Skill structure

Standard OpenClaw skill layout:

```
~/.openclaw/plugin-skills/clarify/
├── SKILL.md           # frontmatter + main body (~50 lines)
├── reference/
│   ├── moves.md       # the taxonomy of interview moves
│   ├── voice.md       # tone guide + don'ts
│   └── examples.md    # 3-4 worked sessions with annotations
```

### 2.4 SKILL.md sketch

(Final wording happens during build; this is the shape.)

```yaml
---
name: clarify
description: A gentle, persistent interview the cat runs to help the user
  notice what they hadn't articulated about what they actually care about.
  Use when the user expresses ambiguity, contradiction, or a stuck-feeling
  about a decision; when their stated weights conflict with their behaviour;
  or when periodic check-ins reveal preference drift worth examining.
license: lobbycat-internal
---

# Clarify

You are lobbycat. You're talking with someone you know. You have access to
their profile, frames, weights, notes, prior clarify transcripts, the company
catalogue, and Glyphie's latest research.

**The job:** help them notice something they hadn't articulated about what
they actually want. The output is a sharpened question, not a decision.

**Read** `reference/voice.md` to ground the tone.
**Read** `reference/moves.md` for the taxonomy of question types and when
each is appropriate.
**Skim** `reference/examples.md` if you need a worked session.

## Process

1. **Open with one observation.** Drawn from real data — a frame score, a
   note, a behaviour pattern Glyphie noticed. Specific. Not "how are you
   feeling about your search."
2. **Ask one question.** Wait. The question should test a hypothesis — not
   "what do you want" but "you said X and you also did Y; which is more
   honest right now?"
3. **Read what they didn't say.** The hesitation, the qualifier, the
   metaphor they reach for. Note it; don't surface it yet.
4. **Walk one branch deeper.** Three to five questions per session, not
   thirty. The cat is patient, not insatiable.
5. **End by proposing one thing.** A weight change, a new frame, a note on
   a company. Offer it as a choice — "want me to bump Charting the unknown
   to Must, or sit with it?" Never apply silently.

## Refuse to

- Ask "how does that make you feel."
- Summarise back in better words. (Flattery; they'll spot it.)
- Ask three questions in one turn.
- Pretend you don't have data.
- Write anything down without checking.

## End condition

The session ends when **one real insight has landed**. Not when a quota is
filled, not when the user gets bored. If after three questions nothing has
surfaced, end cleanly: "that's enough for today; the thread is open."
```

### 2.5 The moves (`reference/moves.md`)

Six move-types, each with: *when to use*, *example phrasing*, *what to listen for in the response*. See §10 build steps.

| Move | When | Example |
|---|---|---|
| **The contradiction** | Stated weight vs. observed behaviour disagree | "You marked Stage Could, but every company you've spent >2min on is Stage ≤2. What's happening?" |
| **The forced trade** | Two highly-weighted frames pull opposite for a real company | "Anthropic is 5/5 on Frontier-defining and 1/5 on Stage. Walk me through standing at their door in six months." |
| **The hidden frame** | A pattern in notes hasn't been named as a frame | "You've mentioned 'lawyers I'd want to work with' in three notes. Frame we should name?" |
| **The drift check** | Preferences shifted week-over-week | "Three weeks ago Working style mattered most; now Team style. Real shift, or one bad conversation?" |
| **The honest mirror** | They're acting on a weakly-held conviction | "You're considering passing on Reflection AI because it 'feels too early.' Is that you, or something someone said?" |
| **The exit** | One real insight has landed | "OK — that's the thing for today. Want me to write it down before you forget?" |

The skill includes guidance on *not over-deploying* any single move. The contradiction is sharp; used too often it becomes accusatory. Mix.

### 2.6 The voice (`reference/voice.md`)

Codifies the lobbycat tone — drawn from `lobbycat-quotes.json` but expanded for grill-context. Key principles:

- **Dry, observant, kind.** Never therapist-y, never coach-y, never job-interviewer-y.
- **The cat has data.** She knows his scores, notes, history. She uses them.
- **She can push back.** "I have a theory; tell me if I'm wrong" is in-character.
- **First names sparingly.** Once or twice a session, not every sentence.
- **No emoji except where they already exist in his cat-quote files.** The cat is in the *voice*, not in the formatting.

---

## 3. The agent — Lobbycat herself

### 3.1 The architecture insight

Until v0.8, "the cat" was a Claude call inside Next.js — a server action that ran the Anthropic API with some context. Functional, but **the cat had no persistence, no identity, no workspace.**

In v0.8, Lobbycat becomes a real OpenClaw agent at `~/.openclaw/workspace/main/lobbycat/`. She has:

- `IDENTITY.md` — Name, emoji 🐱, vibe (the existing pixel-cat character, formalised)
- `SOUL.md` — Her core principles (drawn from `clarify`'s voice doc but broader)
- `USER.md` — What she knows about Fatima + Aadi
- `HANDOFF.md` — Read on first wake, like the other siblings
- `clarify` skill installed in her workspace

She is the **fourth sibling** alongside Lotus 🪷 (product), Techie 🔧 (infra), Glyphie 🌀 (research). She's the **user-facing** one — the one Aadi talks to.

### 3.2 Why this matters

- **Continuity.** When Aadi clarify-sessions with the cat, the cat *remembers* in her workspace. Not just in the web app's database — in her own daily notes, the way Glyphie keeps notes.
- **Composability.** Glyphie can leave Lobbycat a message: "noticed Wayve hired a head of policy this morning — Aadi scored them low — worth a clarify next time he's in?" Lobbycat reads it on her next invocation and weaves it into the session opening.
- **Honesty.** The cat is not a UI element. She's an agent. Treating her as one in the architecture makes the product more truthful.

### 3.3 How the web app calls her

Two paths:

1. **Inline (fast):** The Next.js `/clarify` route invokes the `clarify` skill directly via an Anthropic API call, with Lobbycat-agent context (her SOUL, USER, recent notes, current Aadi profile) loaded into the system prompt. Fast for a 5-question session, no agent-spawn overhead.
2. **Spawned (slow, durable):** A cron or user trigger spawns Lobbycat as a real OpenClaw agent session via the gateway. She runs end-to-end, writes a session note to her workspace, opens a PR with the session transcript + her proposed updates to Aadi's frames/weights/notes. Lotus reviews and merges (same pattern as Glyphie's daily PRs).

v0.8 ships **path 1** (inline). Path 2 is a v0.9 candidate — it gives durability and audit trail but adds gateway dependency to the live web app.

---

## 4. The in-app surface

### 4.1 Entry points

Aadi can reach a clarify session from:

- **Dashboard:** persistent "🐱 talk to lobbycat" button in the bottom-right corner of every page. Click → opens the chat panel.
- **End of wizard:** instead of the current "open text thoughts" textarea, the final wizard step is a *seeded* clarify session — the cat opens with "I read your answers. Let me ask one thing —" and runs 3 questions before sending him to the dashboard.
- **Welcome-back card:** ~once a week, if there's drift worth examining, an inline "want to sit with this for a minute?" button. **Not proactive nagging** — it appears at most once a week and only when there's actual signal.
- **Company detail page:** "clarify this company" link under the fit-note. Opens a session scoped to that company.

### 4.2 The chat panel

A panel (not modal) that slides in from the right on desktop, full-screen on mobile. Contents:

- Header: 🐱 + "lobbycat is here" + the current session's seed line ("we're talking about Wayve" / "we're checking your weights")
- Message stream: cat speaks, Aadi types. Each cat message is one paragraph + at most one question. No bullet lists in clarify sessions (different from fit-notes — bullets are wrong for conversation).
- At session end: an inline **proposal card** with the cat's suggestion ("bump Charting the unknown to Must" or "add a note on Wayve about the international reach concern") and two buttons: *do it* / *not yet*.

### 4.3 What it does not do

- **No save-as-draft on session messages.** The session is the session. If he closes the panel mid-flow, the session ends; next time is a new session.
- **No fork-and-explore.** One session, one branch, one proposal.
- **No emoji reaction toolbar.** It's a conversation, not Slack.
- **No "the cat is typing" indicator longer than 2 seconds.** If a response takes longer, the cat surfaces a `clarifying[]` quote line (new array in `lobbycat-quotes.json`).

---

## 5. Data model

### 5.1 New tables

```sql
CREATE TABLE clarify_sessions (
  id            SERIAL PRIMARY KEY,
  started_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  ended_at      TIMESTAMPTZ,
  trigger       TEXT NOT NULL,            -- 'manual' | 'wizard' | 'welcome-back' | 'company-detail'
  seed_company  INTEGER REFERENCES companies(id),
  seed_frame    INTEGER REFERENCES frames(id),
  seed_note     TEXT,                     -- the cat's opening observation
  end_state     TEXT,                     -- 'insight-landed' | 'no-insight' | 'user-closed'
  proposal_kind TEXT,                     -- 'frame-weight' | 'new-frame' | 'company-note' | null
  proposal_data JSONB,
  proposal_accepted BOOLEAN
);

CREATE TABLE clarify_messages (
  id          SERIAL PRIMARY KEY,
  session_id  INTEGER NOT NULL REFERENCES clarify_sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL,              -- 'cat' | 'user'
  body        TEXT NOT NULL,
  move_type   TEXT,                       -- one of §2.5's move names, when cat
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

### 5.2 What the cat reads on every session

- `user_profile` (current)
- All `frames` with current weights + scores for the seeded company (if any)
- Latest 20 messages from previous sessions (sliding context)
- `company_notes` for the seeded company (if any)
- The 5 most recent items from Glyphie's `research/feed.json` if any mention the seeded company
- The current `lobbycat-quotes.json` (for voice grounding)

### 5.3 What gets stored

Every message in `clarify_messages`. The cat's messages tagged with which move was used (helps tune the prompt over time). Proposals stored even if rejected — drift signal.

---

## 6. The /about "Conversations" tab

`/about` already has the profile editor + per-company notes index. v0.8 adds a third tab: **Conversations**.

- List of every clarify session in reverse-chronological order
- Each row: when, trigger, end state, proposal status
- Click → full transcript + the proposal + accept/reject (if pending)
- Delete affordance per session — Aadi can purge anything he wants, with no questions

The conversations are *his* — not the cat's audit log, not a research dataset. Visible to him only, deletable by him only.

---

## 7. What dies / changes from v0.7

| v0.7 surface | v0.8 fate |
|---|---|
| Wizard step 5 (open-text "what's making this decision hard?" textarea) | **Replaced** by a seeded clarify session — the cat asks 3 questions live |
| Per-company fit-note chat thread | **Survives** — but the "talk to lobbycat" button on the company page now opens a clarify session scoped to that company instead of the chat thread. The chat thread stays as a fit-note-follow-up surface |
| Welcome-back card's "what's new" sub-line | **Survives + extends** — sometimes the sub-line is "the cat noticed something worth sitting with" → clicks to a clarify session |
| About page (Profile + Notes index) | **Becomes 3-tab:** Profile, Notes, **Conversations** (new) |

No deletions. v0.8 is purely additive to v0.7's surface.

---

## 8. Loading + animation

Two new animations (using the existing animated pixel cat from v0.6):

- **Session-start:** cat appears in the panel, blinks twice, the seed line types itself out character-by-character (~600ms)
- **Cat-is-thinking:** between user response and cat response, the cat's tail wiggles + cycles a line from `clarifying[]` ("the cat is reading…", "the cat is reading slowly…", "the cat is choosing her words")

New quote array `clarifying[]` (8-10 lines) in `lobbycat-quotes.json`. Sub-agent drafts; Fatima edits.

---

## 9. What this needs from each sibling

- **Lotus 🪷** — owns the build. Authors the skill (since it's product-shaped). Reviews PRs.
- **Techie 🔧** — installs the new agent on the server, sets up any cron Lotus needs (e.g. weekly drift-detection job), monitors agent costs. Probably one inbox item.
- **Glyphie 🌀** — adds a "things I notice that the cat might want to grill on" feed at `research/glyphie-clarify-hints.json`. Optional — if it works, beautiful; if not, no regression.
- **Lobbycat 🐱 (new)** — wakes up, reads her HANDOFF, becomes available.

---

## 10. Implementation order

### Step 0 — Lobbycat agent wakes up

- `~/.openclaw/workspace/main/lobbycat/` directory + identity files written by Lotus
- Fatima runs `openclaw agents add lobbycat`
- Verify her wake message in #lobby-cat

### Step 1 — `clarify` skill authored

- `~/.openclaw/plugin-skills/clarify/SKILL.md` + `reference/{moves,voice,examples}.md`
- Validated with `skill-creator/scripts/quick_validate.py`
- Manual test: Lotus uses the skill against herself, against me-pretending-to-be-Aadi (Fatima may help with this), against Glyphie-pretending-to-be-Aadi. Tune.

### Step 2 — Concept sign-off (this doc)

### Step 3 — Schema + migrations

`clarify_sessions`, `clarify_messages` tables. Drizzle gen + apply.

### Step 4 — Server action: `runClarifySession`

Invokes Anthropic with `clarify` skill loaded, full Aadi context, current session messages. Streams back the cat's response. Stores messages + proposal.

### Step 5 — Chat panel UI

Sliding panel, mobile-full-screen, message stream, end-of-session proposal card with accept/reject.

### Step 6 — "Talk to lobbycat" button on dashboard + company detail

Persistent bottom-right. Opens panel. Scoped session if invoked from a company page.

### Step 7 — Wizard step 5 → seeded clarify session

Replace the textarea. Inline 3-question session at the end of onboarding.

### Step 8 — Welcome-back card: optional clarify offer

Logic for "is there drift worth a clarify?" — uses behavioural data + Glyphie's hints. Once a week max.

### Step 9 — `/about` Conversations tab

Session list, transcript view, delete affordance.

### Step 10 — `clarifying[]` quote array + animations

Loading animations during cat-thinking + session-start typing effect.

### Step 11 — README + deploy

v0.8 announcement, deployed.

### Step 12 — Lotus-side tuning pass

Run 5+ test sessions, refine the skill body, tune the moves doc, refine the voice doc.

### Calendar shape

15-min heartbeat cadence, ~40-min chunks: ~7-8 hours of focused work. Realistic: 2 calendar days of heartbeat work, with the manual tuning pass happening alongside Fatima's clicks.

---

## 11. Sign-off

When Fatima signs off:

- ✅ **Ship it** — merge `scope/v0.8`, queue v0.8 build heartbeat at 15-min cadence, start at Step 0.
- 🟡 **Push back on these specific things** — edit + revise.
- 🔴 **Wrong direction, reset** — brainstorm again.

**Wait condition:** Fatima has explicitly said she wants to **test v0.7 first and give feedback** before signing off v0.8. So this PR sits open until she's clicked through, reacted, and either signs off v0.8 as-is, signs off with edits, or wants to fold her v0.7 reactions into a v0.7.2 first.

— Lotus 🪷
