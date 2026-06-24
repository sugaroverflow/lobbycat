"use client";

/**
 * Root error boundary for / (home).
 * Per-route boundaries below this in the tree override it; this one
 * catches anything that escapes them.
 *
 * v0.7.1 reliability Track B — see src/app/_errors/error-shell.tsx.
 */

import { ErrorShell } from "./_errors/error-shell";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorShell error={error} reset={reset} />;
}
