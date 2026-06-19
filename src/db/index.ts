import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Lazy: don't throw at module-import time. Next 16 collects page data by
// evaluating route modules at build, and Vercel preview/build envs may not
// have DATABASE_URL set even when production runtime does. The throw now
// fires on first DB use, not on import.

declare global {
  // eslint-disable-next-line no-var
  var __pg: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var __drizzle: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (globalThis.__drizzle) return globalThis.__drizzle;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const client = globalThis.__pg ?? postgres(url, { prepare: false, max: 5 });
  if (process.env.NODE_ENV !== "production") globalThis.__pg = client;
  const instance = drizzle(client, { schema });
  if (process.env.NODE_ENV !== "production") globalThis.__drizzle = instance;
  return instance;
}

// Proxy: defers actual init to first property access, but presents as a normal
// drizzle instance to every existing call site (no API change for consumers).
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop, receiver) {
    const real = getDb();
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
