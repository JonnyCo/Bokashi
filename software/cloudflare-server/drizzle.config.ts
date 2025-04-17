import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema.ts', // Path to your schema file
  out: './migrations',    // Directory for migration files
  dialect: 'sqlite',       // Specify SQLite dialect for D1
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
  verbose: true,
  strict: true,
  tablesFilter: ["!_cf_KV"],
}); 