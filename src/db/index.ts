import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Use Neon's serverless HTTP driver instead of postgres-js.
// HTTP-based: no persistent connections held by the lambda; no pool exhaustion;
// no zombie connections accumulating across warm Vercel instances.
// One HTTP request per query, which is fine — Neon caches behind the proxy.

// Allow fetch caching (Next.js's revalidate semantics) for queries that opt in.
neonConfig.fetchConnectionCache = true;

declare global {
  // eslint-disable-next-line no-var, @typescript-eslint/no-explicit-any
  var __neon: any;
  // eslint-disable-next-line no-var, @typescript-eslint/no-explicit-any
  var __drizzle: any;
}

function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (globalThis.__drizzle) return globalThis.__drizzle;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const client = globalThis.__neon ?? neon(url);
  globalThis.__neon = client;
  const instance = drizzle(client, { schema });
  globalThis.__drizzle = instance;
  return instance;
}

// Proxy: defers init to first property access; presents as a normal drizzle instance
// to every existing call site (no API change for consumers).
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    const real = getDb();
    const value = (real as unknown as Record<string | symbol, unknown>)[prop as string];
    return typeof value === "function" ? (value as Function).bind(real) : value;
  },
});

export { schema };
