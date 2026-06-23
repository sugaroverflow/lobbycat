import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // v0.7 step 8 — the home page reads research/feed.json server-side to
  // render the welcome-back "new since you were last in" diff. Tell Next's
  // file tracer to bundle the JSON into the serverless function output so
  // Vercel keeps it around at runtime.
  outputFileTracingIncludes: {
    "/": ["./research/feed.json"],
  },
};

export default nextConfig;
