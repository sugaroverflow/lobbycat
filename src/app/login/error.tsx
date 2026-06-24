"use client";

import { ErrorShell } from "../_errors/error-shell";

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorShell
      error={error}
      reset={reset}
      headline="The cat couldn't unlock the door."
    />
  );
}
