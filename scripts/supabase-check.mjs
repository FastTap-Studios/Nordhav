#!/usr/bin/env node
/**
 * Verifies Supabase connection and lists table row counts.
 * Usage: node scripts/supabase-check.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

loadEnv();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key || key.includes("your-anon-key")) {
  console.error("❌ Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env");
  console.error("   Get anon key: Supabase Dashboard → Project Settings → API → anon public");
  process.exit(1);
}

const sb = createClient(url, key);

const tables = ["products", "orders", "returns", "discount_codes"];

console.log(`Connecting to ${url}...\n`);

for (const table of tables) {
  const { count, error } = await sb.from(table).select("*", { count: "exact", head: true });
  if (error) {
    console.log(`  ${table}: ❌ ${error.message}`);
  } else {
    console.log(`  ${table}: ✅ ${count ?? 0} rows`);
  }
}

const { data: products, error: pErr } = await sb.from("products").select("id,name").limit(3);
if (!pErr && products?.length) {
  console.log("\nSample products:");
  products.forEach((p) => console.log(`  - ${p.name}`));
}

console.log("\nDone. Run SQL migration if tables are missing:");
console.log("  supabase/migrations/001_initial_schema.sql");
