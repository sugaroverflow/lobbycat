"use client";

import { useState, useTransition } from "react";
import { toggleCompanyFavorite } from "@/app/actions";

/**
 * v0.8.1 Phase B item 13 (F3.5) — shared favorite-star toggle.
 *
 * Extracted from `dashboard-cards.tsx` (PR #62) so both the dashboard
 * `CompanyCard` and the company detail page (`/companies/[slug]`) can
 * render the same control without duplicating optimistic-toggle state
 * machinery.
 *
 * Visual contract:
 *   - filled polygon (currentColor) when favorited, outline when not
 *   - filled uses `text-action` (magenta); empty uses a muted tone
 *     chosen by the caller via `unfavoritedClassName` so the star reads
 *     correctly against both the card interior (whisper) and the page
 *     background (muted) without us hard-coding the wrong contrast
 *
 * Behaviour contract:
 *   - optimistic flip on click + reconcile against the server result
 *   - revert on action throw
 *   - aria-pressed for AT, aria-label includes the company name so a
 *     screen-reader user landing on the control without prior context
 *     still knows what they are favoriting
 */

type Props = {
  companyId: number;
  companyName: string;
  initialFavorited: boolean;
  /** px width/height of the inline SVG. Default 18 (matches CompanyCard). */
  size?: number;
  /** Extra classes on the <button> (padding, rounding, etc.). */
  className?: string;
  /** Color classes when the star is currently filled (favorited). */
  favoritedClassName?: string;
  /** Color classes when the star is currently outlined (not favorited). */
  unfavoritedClassName?: string;
};

export function FavoriteStar({
  companyId,
  companyName,
  initialFavorited,
  size = 18,
  className = "p-1 rounded-sm transition-colors",
  favoritedClassName = "text-action hover:text-action-hover",
  unfavoritedClassName = "text-card-interior-whisper hover:text-card-interior-muted",
}: Props) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [, startTransition] = useTransition();

  const onToggle = () => {
    const next = !favorited;
    setFavorited(next);
    startTransition(async () => {
      try {
        const res = await toggleCompanyFavorite(companyId);
        // Server is the truth; reconcile in case the optimistic guess
        // and the actual outcome diverge (e.g. two clicks while
        // in-flight).
        setFavorited(res.favorited);
      } catch {
        setFavorited(!next);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={favorited}
      aria-label={
        favorited ? `Unfavorite ${companyName}` : `Favorite ${companyName}`
      }
      title={favorited ? "Unfavorite" : "Favorite"}
      className={
        className + " " + (favorited ? favoritedClassName : unfavoritedClassName)
      }
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={favorited ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </button>
  );
}
