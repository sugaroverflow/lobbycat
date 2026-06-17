import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

// Single connection at module scope; Next.js dev caches modules so this is fine.
declare global {
  // eslint-disable-next-line no-var
  var __pg: ReturnType<typeof postgres> | undefined;
}

const client = globalThis.__pg ?? postgres(url, { prepare: false, max: 5 });
if (process.env.NODE_ENV !== "production") globalThis.__pg = client;

export const db = drizzle(client, { schema });
export { schema };
