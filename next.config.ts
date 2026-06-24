import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // v0.7 step 8 — the home page reads research/feed.json server-side to
  // render the welcome-back "new since you were last in" diff. Tell Next's
  // file tracer to bundle the JSON into the serverless function output so
  // Vercel keeps it around at runtime.
  outputFileTracingIncludes: {
    "/": ["./research/feed.json"],
  },
};

// Wrap with Sentry's webpack plugin. We don't have SENTRY_AUTH_TOKEN yet
// (will be added later for sourcemap upload to Sentry), so `silent: true`
// keeps the build clean when the token is missing.
export default withSentryConfig(nextConfig, {
  silent: true,
  // Source maps upload — disabled until SENTRY_AUTH_TOKEN is provisioned.
  // org/project read from SENTRY_ORG / SENTRY_PROJECT env at upload time;
  // no-op without an auth token, so safe to omit here.
  sourcemaps: {
    disable: true,
  },
});
