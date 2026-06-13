#!/usr/bin/env node
/**
 * Sets Cloudflare Pages build config + env vars for future Git/CI deploys.
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) throw new Error(".env missing");
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

function loadWranglerToken() {
  const cfgPath = resolve(
    process.env.APPDATA || "",
    "xdg.config/.wrangler/config/default.toml"
  );
  const raw = readFileSync(cfgPath, "utf8");
  const m = raw.match(/oauth_token = "([^"]+)"/);
  if (!m) throw new Error("Wrangler not logged in");
  return m[1];
}

loadEnv();

const accountId = "f140c0513cc4e0394212f7eea664f1a8";
const project = "nordhav";
const token = loadWranglerToken();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnon = process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnon) {
  throw new Error("Missing VITE_SUPABASE_* in .env");
}

const body = {
  build_config: {
    build_command: "npm run build:pages",
    destination_dir: "dist",
  },
  deployment_configs: {
    production: {
      env_vars: {
        VITE_SUPABASE_URL: { value: supabaseUrl },
        VITE_SUPABASE_ANON_KEY: { value: supabaseAnon },
      },
    },
    preview: {
      env_vars: {
        VITE_SUPABASE_URL: { value: supabaseUrl },
        VITE_SUPABASE_ANON_KEY: { value: supabaseAnon },
      },
    },
  },
};

const res = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${project}`,
  {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }
);

const json = await res.json();
if (!json.success) {
  console.error("Cloudflare API error:", JSON.stringify(json.errors || json, null, 2));
  process.exit(1);
}

console.log("✅ Cloudflare Pages build config updated");
console.log("   Build command: npm run build:pages");
console.log("   Output dir: dist");
console.log("   Env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY");
