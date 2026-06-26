/**
 * v0.8 step 6 — apply / reject an end-of-session clarify proposal.
 *
 * Step 4 parses and persists the proposal payload onto the session row
 * (proposal_kind + proposal_data, with proposal_accepted = null until a
 * decision is made). Step 5's chat panel renders the accept/reject card.
 * This module is the seam that *applies* the payload to the user's data:
 *
 *   - `frame-weight`   → patch `user_profile.frameWeights` for the named
 *                        frame id, mapping must/should/could/wont to the
 *                        DB's 3-bucket low/medium/high (A6.1).
 *   - `new-frame`      → insert a new scale-kind frame at the end of the
 *                        sort order (matches the wizard's default shape).
 *   - `company-note`   → upsert the company_notes row for the company.
 *
 * In every case we then flip `clarify_sessions.proposalAccepted = true`.
 * Rejection just sets that column to false — no data side-effects.
 *
 * Path 1 (inline) — these are normal server actions wrapped from
 * `src/app/actions.ts`, same pattern as `run-session.ts`. We do NOT
 * import "use server" here; the wrappers do.
 *
 * Failure mode: if the proposal payload is malformed (e.g. the cat
 * invented a frame id that doesn't exist), we throw with a short
 * human-readable message. The panel surfaces it inline; the session
 * row stays undecided so the user can hit accept again after fixing.
 * See ASSUMPTIONS-v0.8.md A6.2.
 */

import { db } from "@/db";
import {
  clarifySessions,
  companies,
  companyNotes,
  frames as framesTable,
  userProfile,
} from "@/db/schema";
import { eq } from "drizzle-orm";

import type { ClarifyProposal } from "./run-session";

/* ------------------------------------------------------------------ */
/* must/should/could/wont → low/medium/high mapping (A6.1)             */
/* ------------------------------------------------------------------ */

/**
 * The skill emits Moscow-style weights. The DB stores Low/Medium/High on
 * `user_profile.frame_weights`. We collapse the 4 levels into 3:
 *
 *   must   → high
 *   should → medium
 *   could  → low
 *   wont   → low
 *
 * Rationale: "must" and "should" both signal "this matters", but
 * "should" sits below "must" in priority — medium feels honest. "Could"
 * and "wont" both mean "deprioritised"; the user can manually pin a
 * frame to "low" from /frames if they want it visibly down-weighted
 * further. A future v0.9 might add a fourth bucket. Logged as A6.1.
 */
const MOSCOW_TO_BUCKET: Record<string, "low" | "medium" | "high"> = {
  must: "high",
  should: "medium",
  could: "low",
  wont: "low",
  // Tolerant aliases (defensive — the model occasionally drifts):
  "won't": "low",
  high: "high",
  medium: "medium",
  low: "low",
};

function bucketFromWeight(raw: unknown): "low" | "medium" | "high" {
  const norm = String(raw ?? "")
    .trim()
    .toLowerCase();
  const bucket = MOSCOW_TO_BUCKET[norm];
  if (!bucket) {
    throw new Error(
      `Proposal had an unrecognised weight "${raw}". Expected one of: must, should, could, wont.`,
    );
  }
  return bucket;
}

/* ------------------------------------------------------------------ */
/* Apply                                                               */
/* ------------------------------------------------------------------ */

export type ApplyClarifyProposalArgs = {
  sessionId: number;
  /** The proposal as the panel saw it. We re-verify against the row
   *  to make sure we're applying what the user actually accepted. */
  proposal: ClarifyProposal;
};

export type ApplyClarifyProposalResult = {
  applied: true;
  kind: ClarifyProposal["kind"];
};

export async function applyClarifyProposal(
  args: ApplyClarifyProposalArgs,
): Promise<ApplyClarifyProposalResult> {
  const { sessionId, proposal } = args;

  // Re-fetch the session and confirm the proposal payload matches what
  // Step 4 stored. If the panel's `proposal` got out of sync (e.g.
  // double-submit after a session refresh), we trust the row.
  const [row] = await db
    .select()
    .from(clarifySessions)
    .where(eq(clarifySessions.id, sessionId))
    .limit(1);

  if (!row) throw new Error(`Clarify session ${sessionId} not found.`);
  if (row.proposalAccepted !== null) {
    // Already decided. Idempotent no-op: caller is treated as informed.
    return { applied: true, kind: proposal.kind };
  }
  if (!row.proposalKind || !row.proposalData) {
    throw new Error(
      "This session didn't end with a proposal — nothing to apply.",
    );
  }

  // Prefer the canonical row payload; fall back to the panel's copy if
  // the row somehow lost it (shouldn't happen but cheap to defend).
  const canonical: ClarifyProposal = {
    kind: (row.proposalKind as ClarifyProposal["kind"]) ?? proposal.kind,
    data: (row.proposalData as Record<string, unknown>) ?? proposal.data,
    summary: proposal.summary,
  };

  switch (canonical.kind) {
    case "frame-weight":
      await applyFrameWeight(canonical.data);
      break;
    case "new-frame":
      await applyNewFrame(canonical.data);
      break;
    case "company-note":
      await applyCompanyNote(canonical.data);
      break;
    default:
      throw new Error(
        `Unknown proposal kind "${(canonical as { kind: string }).kind}".`,
      );
  }

  await db
    .update(clarifySessions)
    .set({ proposalAccepted: true })
    .where(eq(clarifySessions.id, sessionId));

  return { applied: true, kind: canonical.kind };
}

/* ------------------------------------------------------------------ */
/* Reject                                                              */
/* ------------------------------------------------------------------ */

export async function rejectClarifyProposal(
  sessionId: number,
): Promise<{ rejected: true }> {
  const [row] = await db
    .select()
    .from(clarifySessions)
    .where(eq(clarifySessions.id, sessionId))
    .limit(1);
  if (!row) throw new Error(`Clarify session ${sessionId} not found.`);
  if (row.proposalAccepted !== null) {
    // Already decided — idempotent.
    return { rejected: true };
  }
  await db
    .update(clarifySessions)
    .set({ proposalAccepted: false })
    .where(eq(clarifySessions.id, sessionId));
  return { rejected: true };
}

/* ------------------------------------------------------------------ */
/* Kind-specific appliers                                              */
/* ------------------------------------------------------------------ */

async function applyFrameWeight(data: Record<string, unknown>): Promise<void> {
  const frameIdRaw = data.frameId;
  const frameId =
    typeof frameIdRaw === "number"
      ? frameIdRaw
      : typeof frameIdRaw === "string"
        ? Number.parseInt(frameIdRaw, 10)
        : NaN;
  if (!Number.isFinite(frameId)) {
    throw new Error("Proposal was missing a numeric frameId.");
  }

  const [frame] = await db
    .select({ id: framesTable.id })
    .from(framesTable)
    .where(eq(framesTable.id, frameId))
    .limit(1);
  if (!frame) {
    throw new Error(`Frame ${frameId} doesn't exist any more — can't apply.`);
  }

  const bucket = bucketFromWeight(data.weight);

  const [existing] = await db.select().from(userProfile).limit(1);
  if (!existing) throw new Error("No user profile to update weights on.");

  const current = (existing.frameWeights ?? {}) as Record<
    string,
    "low" | "medium" | "high"
  >;
  const next = { ...current, [String(frameId)]: bucket };

  await db
    .update(userProfile)
    .set({ frameWeights: next, updatedAt: new Date() })
    .where(eq(userProfile.id, existing.id));
}

async function applyNewFrame(data: Record<string, unknown>): Promise<void> {
  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (!name) throw new Error("New-frame proposal had no name.");

  // Scale defaults to 5 (matches the wizard). Other shape fields are
  // optional — the user can polish them from /frames after accepting.
  const description =
    typeof data.description === "string" ? data.description.trim() || null : null;
  const scaleRaw = data.scale;
  const scale =
    typeof scaleRaw === "number"
      ? scaleRaw
      : typeof scaleRaw === "string"
        ? Number.parseInt(scaleRaw, 10)
        : NaN;
  const safeScale = Number.isFinite(scale) && scale >= 2 && scale <= 10 ? scale : 5;
  const lowLabel =
    typeof data.lowLabel === "string" ? data.lowLabel.trim() || null : null;
  const highLabel =
    typeof data.highLabel === "string" ? data.highLabel.trim() || null : null;

  const existing = await db.select({ sortIndex: framesTable.sortIndex }).from(framesTable);
  const maxSort = existing.reduce(
    (m, f) => (f.sortIndex > m ? f.sortIndex : m),
    -1,
  );

  await db.insert(framesTable).values({
    name,
    description,
    kind: "scale",
    scale: safeScale,
    lowLabel,
    highLabel,
    sortIndex: maxSort + 1,
  });
}

async function applyCompanyNote(data: Record<string, unknown>): Promise<void> {
  const companyIdRaw = data.companyId;
  const companyId =
    typeof companyIdRaw === "number"
      ? companyIdRaw
      : typeof companyIdRaw === "string"
        ? Number.parseInt(companyIdRaw, 10)
        : NaN;
  if (!Number.isFinite(companyId)) {
    throw new Error("Company-note proposal was missing a numeric companyId.");
  }
  const note = typeof data.note === "string" ? data.note.trim() : "";
  if (!note) throw new Error("Company-note proposal had an empty note.");

  const [company] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);
  if (!company) {
    throw new Error(
      `Company ${companyId} doesn't exist any more — can't apply.`,
    );
  }

  // Upsert — one note row per company. If it exists, replace the body.
  const [existingNote] = await db
    .select({ id: companyNotes.id })
    .from(companyNotes)
    .where(eq(companyNotes.companyId, companyId))
    .limit(1);

  if (existingNote) {
    await db
      .update(companyNotes)
      .set({ body: note, updatedAt: new Date() })
      .where(eq(companyNotes.id, existingNote.id));
  } else {
    await db.insert(companyNotes).values({ companyId, body: note });
  }
}
