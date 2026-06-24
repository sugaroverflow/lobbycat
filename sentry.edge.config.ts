// Sentry edge-runtime init. Used for middleware + edge route handlers.
// Loaded by src/instrumentation.ts during the edge runtime register() phase.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  debug: false,
  sendDefaultPii: false,
});
