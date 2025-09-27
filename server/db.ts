import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use app_user connection for RLS security if credentials are provided
// Otherwise fall back to DATABASE_URL (for migrations/admin tasks)
function getConnectionString(): string {
  // Check if app_user credentials are provided via environment variables
  if (process.env.APP_DB_USER && process.env.APP_DB_PASSWORD && process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    url.username = process.env.APP_DB_USER;
    url.password = process.env.APP_DB_PASSWORD;
    return url.toString();
  }
  
  // Fall back to original DATABASE_URL for admin/migration tasks
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
  }
  return process.env.DATABASE_URL;
}

export const pool = new Pool({ connectionString: getConnectionString() });
export const db = drizzle({ client: pool, schema });
