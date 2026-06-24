// Next 15+ instrumentation hook. Boots the Sentry server/edge configs depending
// on which runtime this process is. Also re-exports onRequestError so Sentry
// captures Server Components render errors (the opaque "specific message is
// omitted in production builds" ones we actually want to debug).
import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  ...args
) => {
  const Sentry = await import("@sentry/nextjs");
  return Sentry.captureRequestError(...args);
};
