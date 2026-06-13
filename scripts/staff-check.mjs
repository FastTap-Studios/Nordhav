#!/usr/bin/env node
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
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(url, serviceKey);

const { data: staff, error } = await sb.from("staff_members").select("email,role,is_active,full_name").order("email");
if (error) {
  console.error("staff_members:", error.message);
  process.exit(1);
}
console.log("Staff members:");
staff?.forEach((s) => console.log(`  - ${s.email} (${s.role}, active: ${s.is_active}) ${s.full_name || ""}`));

const { data: authUsers } = await sb.auth.admin.listUsers({ perPage: 20 });
console.log("\nAuth users:", authUsers?.users?.length ?? 0);
authUsers?.users?.forEach((u) => console.log(`  - ${u.email} confirmed: ${!!u.email_confirmed_at}`));
