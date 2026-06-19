"use client";

import { useEffect, useRef } from "react";
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { markOnboarded } from "@/app/actions-mark-onboarded";

const COOKIE_NAME = "lc_onboarded_v2";
const COOKIE_MAX_AGE_DAYS = 365;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1] ?? "") : null;
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(
    value,
  )}; path=/; max-age=${maxAge}; samesite=lax`;
}

export interface CoachmarkOnboardingProps {
  /** Pre-onboarded users get nothing rendered. `null` from server means
   *  either no profile row or `onboarded_at IS NULL` — show the tour. */
  onboardedAt: string | null;
  /** First name for the hero greeting; falls back gracefully. */
  firstName: string | null;
  /** When true, force the tour to run regardless of server/cookie state
   *  (used by the "show me around again" link from /about). */
  force?: boolean;
}

export function CoachmarkOnboarding({
  onboardedAt,
  firstName,
  force = false,
}: CoachmarkOnboardingProps) {
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    if (!force && onboardedAt) return;
    if (!force && readCookie(COOKIE_NAME)) return;
    ranRef.current = true;

    const greeting = firstName
      ? `Hi ${firstName}!`
      : "Hi!";

    let d: Driver | null = null;
    const finish = () => {
      writeCookie(COOKIE_NAME, "1");
      // Fire-and-forget; we don't block the UI on the DB write.
      void markOnboarded().catch(() => {});
      d?.destroy();
    };

    d = driver({
      showProgress: true,
      progressText: "{{current}} of {{total}}",
      nextBtnText: "next →",
      prevBtnText: "← back",
      doneBtnText: "let's go",
      onCloseClick: () => finish(),
      onDestroyed: () => finish(),
      steps: [
        {
          element: "[data-coachmark='hero']",
          popover: {
            title: greeting,
            description:
              "Fatima's fleet of agents built this dashboard for you to explore different opportunities and lenses as you're looking into your next adventure.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "[data-coachmark='frames-nav']",
          popover: {
            title: "First, edit your frames.",
            description:
              "Frames are the lenses you look through. Open /frames and add or tweak one — make at least one of them yours before mapping anything.",
            side: "bottom",
            align: "center",
          },
        },
        {
          element: "[data-coachmark='axis-picker']",
          popover: {
            title: "Now, map the companies.",
            description:
              "Pick any two scale-frames and watch the field rearrange. When you want to talk something through, the cat is here — just ask.",
            side: "bottom",
            align: "start",
          },
        },
      ],
    });

    d.drive();

    return () => {
      d?.destroy();
    };
  }, [onboardedAt, firstName, force]);

  return null;
}
