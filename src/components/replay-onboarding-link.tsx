"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { resetWizard } from "@/app/actions-wizard";

const COOKIE_NAME = "lc_onboarded_v2";

/**
 * "Re-take the setup" — a real visible button at the top of /about that
 * resets the wizard gate and bounces back to /wizard step 1.
 *
 * Confirms before resetting: the wizard answers stay in the DB, but
 * `wizardCompletedAt` clears so the home page sends him back through.
 */
export function ReplayOnboardingLink() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const doReset = () => {
    if (typeof document !== "undefined") {
      document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
    }
    startTransition(async () => {
      await resetWizard();
      router.push("/wizard");
    });
  };

  if (confirming) {
    return (
      <div className="border border-[var(--accent-action)] rounded-md p-4 bg-[var(--bg-panel)] flex items-center justify-between gap-3 flex-wrap">
        <div className="serif text-sm text-prose">
          Re-take setup? Your previous answers stay saved — you can change them as you go.
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="mono text-xs uppercase tracking-wider px-3 py-2 border border-[var(--rule)] text-whisper hover:text-prose rounded"
            disabled={pending}
          >
            Not now
          </button>
          <button
            type="button"
            onClick={doReset}
            disabled={pending}
            className="mono text-xs uppercase tracking-wider px-3 py-2 bg-[var(--accent-action)] text-[var(--bg-canvas)] rounded hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "starting…" : "yes, re-take →"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="mono text-xs uppercase tracking-[0.16em] px-4 py-2.5 border border-[var(--accent-action)] text-[var(--accent-action)] rounded hover:bg-[var(--accent-action)] hover:text-[var(--bg-canvas)] transition"
    >
      🪷 re-take the setup
    </button>
  );
}
