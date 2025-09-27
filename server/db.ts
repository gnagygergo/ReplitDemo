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

// Parse DATABASE_URL and replace credentials with app_user for RLS security
function createAppUserConnectionString(originalUrl: string): string {
  const url = new URL(originalUrl);
  // Replace username and password with app_user credentials
  url.username = 'app_user';
  url.password = 'app_secure_password_2024';
  return url.toString();
}

const appUserConnectionString = createAppUserConnectionString(process.env.DATABASE_URL);

export const pool = new Pool({ connectionString: appUserConnectionString });
export const db = drizzle({ client: pool, schema });
