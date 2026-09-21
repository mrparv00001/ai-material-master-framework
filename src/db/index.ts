import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsDb?: typeof import("drizzle-orm/node-postgres").drizzle;
};

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // Vercel's build step evaluates modules before injecting env vars,
    // so we provide a placeholder. Runtime requests will validate below.
    return "postgresql://localhost:5432/app_db";
  }
  return url;
}

function createPool(): Pool {
  return new Pool({ connectionString: getDatabaseUrl() });
}

function getPool(): Pool {
  if (!globalForDb.__arenaNextJsPostgresqlPool) {
    globalForDb.__arenaNextJsPostgresqlPool = createPool();
  }
  return globalForDb.__arenaNextJsPostgresqlPool;
}

function createDrizzleClient() {
  return drizzle(getPool(), { schema });
}

export const pool = getPool();
export const db = createDrizzleClient();

export function assertDatabaseUrl(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }
}
