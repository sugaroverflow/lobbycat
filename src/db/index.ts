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

// --- Retry layer -------------------------------------------------------------
// Single-query failures against Neon's HTTP proxy occasionally surface to
// Server Components as 500s (proxy hiccup, cold start, transient 5xx). We
// retry transient failures 2x with exponential backoff before giving up.
// Non-transient errors (4xx, syntax errors, constraint violations) are
// re-thrown immediately so they aren't masked by spurious latency.

const RETRY_DELAYS_MS = [100, 300] as const; // attempts 2 and 3
const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;

export function isRetryableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as Record<string, unknown>;

  // Node/undici network-layer errors. These are the classic transient set.
  const code = typeof e.code === "string" ? e.code : undefined;
  if (code) {
    const NET_CODES = new Set([
      "ECONNRESET",
      "ECONNREFUSED",
      "ETIMEDOUT",
      "EAI_AGAIN",
      "ENETUNREACH",
      "ENOTFOUND",
      "EPIPE",
      "UND_ERR_SOCKET",
      "UND_ERR_CONNECT_TIMEOUT",
      "UND_ERR_HEADERS_TIMEOUT",
      "UND_ERR_BODY_TIMEOUT",
    ]);
    if (NET_CODES.has(code)) return true;
  }

  // Neon's HTTP driver surfaces HTTP errors with a numeric `status` or
  // `sourceError.status`. Retry on 5xx; bail on 4xx.
  const status =
    typeof e.status === "number"
      ? e.status
      : typeof (e.sourceError as Record<string, unknown> | undefined)?.status === "number"
        ? ((e.sourceError as Record<string, unknown>).status as number)
        : undefined;
  if (typeof status === "number") {
    return status >= 500 && status < 600;
  }

  // Neon proxy: db-side Postgres errors carry a SQLSTATE in `code`/`severity`.
  // SQLSTATE 08xxx = connection exception. Treat those as transient too.
  if (code && /^08/.test(code)) return true;

  // Plain fetch failures from undici land here ("fetch failed", "TypeError").
  const message = typeof e.message === "string" ? (e.message as string) : "";
  if (/fetch failed|network|socket hang up|other side closed/i.test(message)) {
    return true;
  }

  return false;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { delays?: readonly number[]; isRetryable?: (e: unknown) => boolean } = {},
): Promise<T> {
  const delays = opts.delays ?? RETRY_DELAYS_MS;
  const retryable = opts.isRetryable ?? isRetryableError;
  const max = delays.length + 1;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= max; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === max || !retryable(err)) throw err;
      await sleep(delays[attempt - 1]);
    }
  }
  throw lastErr;
}

// Wrap a neon() client so every invocation is retried on transient failure.
// The client returned by neon() is itself a function (it can be used as a
// tagged template or as `client(query, params)`), so we proxy the function
// and intercept .apply.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function wrapWithRetry<T extends (...args: any[]) => any>(client: T): T {
  return new Proxy(client, {
    apply(target, thisArg, args) {
      return withRetry(() => Reflect.apply(target, thisArg, args));
    },
  }) as T;
}

// --- DB singleton ------------------------------------------------------------

function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (globalThis.__drizzle) return globalThis.__drizzle;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const raw = globalThis.__neon ?? wrapWithRetry(neon(url));
  globalThis.__neon = raw;
  const instance = drizzle(raw, { schema });
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
