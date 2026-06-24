// Sentry client-side init. Loaded automatically by @sentry/nextjs on the browser.
// Keep this lean — the heavy lifting is on the server (sentry.server.config.ts),
// since the opaque "Server Components render" errors we care about happen there.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  debug: false,
  // No session replay — privacy + cost.
  sendDefaultPii: false,
});
