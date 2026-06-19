/**
 * Normalised role record produced by every ATS adapter before it lands in the
 * `roles` table. Adapters MUST return this shape regardless of source so the
 * pipeline can dedupe/upsert uniformly via (company_id, external_id).
 */
export type NormalisedRole = {
  externalId: string;
  title: string;
  department: string | null;
  location: string | null;
  url: string;
  postedAt: Date | null;
  /** Raw vendor payload — kept for forensic debugging, never read at query time. */
  snapshot: Record<string, unknown>;
};

export type AtsSource = "greenhouse" | "lever" | "ashby";

export type AtsAdapter = (token: string) => Promise<NormalisedRole[]>;
