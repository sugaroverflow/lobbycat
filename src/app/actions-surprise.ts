"use server";

import { pickSurprise, type SurprisePick, type SurpriseVariant } from "@/lib/surprise";

/**
 * Server action backing the Surprise modal (§3.5).
 *
 * Client tracks already-shown company ids + which variants it's cycled
 * through this session and ships both back so we don't repeat a pick or
 * stall on a single variant.
 */
export async function getSurpriseAction(input: {
  excludeIds: number[];
  excludeVariants: SurpriseVariant[];
}): Promise<{ ok: true; pick: SurprisePick } | { ok: false; reason: string }> {
  try {
    const pick = await pickSurprise(input);
    if (!pick) {
      return {
        ok: false,
        reason: "The cat has run out of fresh picks for now. Try changing your weights.",
      };
    }
    return { ok: true, pick };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}
