"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetOnboarding } from "@/app/actions-mark-onboarded";
import { resetWizard } from "@/app/actions-wizard";

const COOKIE_NAME = "lc_onboarded_v2";

/**
 * v0.7 step 11 — "redo my setup" affordance on /about.
 *
 * Clears `onboardedAt` (legacy coachmark), clears `wizardCompletedAt`
 * (v0.7 wizard gate), drops the cookie fallback, and bounces to
 * `/wizard` so the user re-enters at step 1.
 */
export function ReplayOnboardingLink() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (typeof document !== "undefined") {
          document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
        }
        startTransition(async () => {
          await Promise.all([resetOnboarding(), resetWizard()]);
          router.push("/wizard");
        });
      }}
      className="mono text-[0.65rem] uppercase tracking-[0.16em] text-whisper hover:text-moss disabled:opacity-50"
    >
      {pending ? "loading…" : "replay onboarding →"}
    </button>
  );
}
