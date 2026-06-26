"use client";

import { ErrorShell } from "../_errors/error-shell";

export default function AboutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorShell error={error} reset={reset} />;
}
