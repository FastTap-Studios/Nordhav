#!/usr/bin/env node
/**
 * Links Nordhav Cloudflare Pages project to GitHub (FastTap-Studios/Nordhav).
 * Recreates the Pages project with Git integration — required because
 * direct-upload projects cannot be switched to Git in-place.
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
  const cfgPath = resolve(process.env.APPDATA || "", "xdg.config/.wrangler/config/default.toml");
  const raw = readFileSync(cfgPath, "utf8");
  const m = raw.match(/oauth_token = "([^"]+)"/);
  if (!m) throw new Error("Wrangler not logged in");
  return m[1];
}

loadEnv();

const accountId = "f140c0513cc4e0394212f7eea664f1a8";
const projectName = "nordhav";
const cfToken = loadWranglerToken();
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnon = process.env.VITE_SUPABASE_ANON_KEY;

async function cf(method, path, body) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${cfToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(`${method} ${path}: ${JSON.stringify(json.errors || json)}`);
  }
  return json.result;
}

const existing = await cf("GET", `/pages/projects/${projectName}`).catch(() => null);
if (existing?.source?.type === "github") {
  console.log("✅ Cloudflare Pages already linked to GitHub");
  console.log(`   Repo: ${existing.source.config?.owner}/${existing.source.config?.repo_name}`);
  process.exit(0);
}

if (existing) {
  console.log("Removing direct-upload Pages project (Git link requires recreate)...");
  await cf("DELETE", `/pages/projects/${projectName}`);
}

console.log("Creating Pages project with GitHub source...");
const project = await cf("POST", "/pages/projects", {
  name: projectName,
  production_branch: "main",
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
  source: {
    type: "github",
    config: {
      owner: "FastTap-Studios",
      repo_name: "Nordhav",
      production_branch: "main",
      production_deployments_enabled: true,
      preview_deployment_setting: "all",
      deployments_enabled: true,
      pr_comments_enabled: true,
    },
  },
});

console.log("✅ Cloudflare Pages linked to GitHub");
console.log(`   URL: https://${project.subdomain || projectName + ".pages.dev"}`);
console.log(`   Repo: FastTap-Studios/Nordhav (branch: main)`);
