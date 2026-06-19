"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetOnboarding } from "@/app/actions-mark-onboarded";

const COOKIE_NAME = "lc_onboarded_v2";

/**
 * Small "show me around again" link for /about that clears `onboardedAt`
 * (and the belt-and-braces cookie) and bounces the user to the homepage
 * where <CoachmarkOnboarding /> will re-fire from step 1.
 */
export function ReplayOnboardingLink() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        // Clear the cookie fallback so the tour re-fires immediately even
        // if the DB write is slow or the profile row is missing.
        if (typeof document !== "undefined") {
          document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
        }
        startTransition(async () => {
          await resetOnboarding();
          router.push("/");
        });
      }}
      className="mono text-[0.65rem] uppercase tracking-[0.16em] text-whisper hover:text-moss disabled:opacity-50"
    >
      {pending ? "loading…" : "show me around again →"}
    </button>
  );
}
