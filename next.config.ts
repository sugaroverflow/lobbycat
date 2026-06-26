import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // v0.7 step 8 — the home page reads research/feed.json server-side to
  // render the welcome-back "new since you were last in" diff. Tell Next's
  // file tracer to bundle the JSON into the serverless function output so
  // Vercel keeps it around at runtime.
  outputFileTracingIncludes: {
    "/": ["./research/feed.json"],
  },

  // v0.8.1 F6.1 — `/about` was renamed to `/profile` (it's product-wise the
  // user's profile page: their info + notes + conversations). Keep a 308
  // permanent redirect so any out-of-band links to `/about` still land.
  async redirects() {
    return [
      {
        source: "/about",
        destination: "/profile",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
