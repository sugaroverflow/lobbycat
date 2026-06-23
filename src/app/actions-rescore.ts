"use server";

import { revalidatePath } from "next/cache";
import { rescoreCompany, type ScoringResult } from "@/lib/scoring";

/**
 * Re-score a company across all frames (or one frame if specified).
 * Called from:
 *   - the home "Re-score" button when an aggregate is marked stale
 *   - the company detail page
 *   - the frames page after a definition edit
 */
export async function rescoreCompanyAction(
  companyId: number,
  frameId?: number,
  opts?: { force?: boolean },
): Promise<{
  ok: boolean;
  results?: ScoringResult[];
  error?: string;
}> {
  try {
    const results = await rescoreCompany(companyId, frameId, opts ?? {});
    revalidatePath("/");
    revalidatePath(`/companies/${companyId}`);
    revalidatePath("/frames");
    return { ok: true, results };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
