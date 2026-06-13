import { StaffMember } from "../types";
import { getSupabaseSafe } from "../lib/supabase";
import { ADMIN_EMAILS } from "../lib/auth";

const STORAGE_KEY = "nordhav_staff";

const DEFAULT_STAFF: StaffMember[] = [
  {
    id: "staff-owner",
    email: "chia.jamal93@gmail.com",
    fullName: "Chia Jamal",
    role: "admin",
    isActive: true,
    createdAt: new Date().toISOString(),
    createdBy: "system",
  },
];

function staffFromRow(row: Record<string, unknown>): StaffMember {
  return {
    id: row.id as string,
    email: row.email as string,
    fullName: (row.full_name as string) || "",
    role: "admin",
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    createdBy: (row.created_by as string) || undefined,
  };
}

function staffToRow(item: Partial<StaffMember> & { createdBy?: string }): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (item.email !== undefined) row.email = item.email.trim().toLowerCase();
  if (item.fullName !== undefined) row.full_name = item.fullName.trim();
  if (item.role !== undefined) row.role = item.role;
  if (item.isActive !== undefined) row.is_active = item.isActive;
  if (item.createdBy !== undefined) row.created_by = item.createdBy;
  return row;
}

function readLocal(): StaffMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STAFF));
      return DEFAULT_STAFF;
    }
    const parsed = JSON.parse(raw) as StaffMember[];
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_STAFF;
  } catch {
    return DEFAULT_STAFF;
  }
}

function writeLocal(items: StaffMember[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function isStaffEmail(email: string | null | undefined, staff?: StaffMember[]): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(normalized)) return true;
  const list = staff ?? readLocal();
  return list.some((s) => s.isActive && s.email.toLowerCase() === normalized);
}

export const staffService = {
  async getAll(): Promise<StaffMember[]> {
    const sb = getSupabaseSafe();
    if (!sb) return readLocal().sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const { data, error } = await sb
      .from("staff_members")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[Supabase] getAll staff:", error);
      return readLocal();
    }
    return (data ?? []).map(staffFromRow);
  },

  async add(
    input: { email: string; fullName: string },
    createdBy?: string
  ): Promise<StaffMember> {
    const sb = getSupabaseSafe();
    const payload = staffToRow({
      email: input.email,
      fullName: input.fullName,
      role: "admin",
      isActive: true,
      createdBy,
    });

    if (!sb) {
      const items = readLocal();
      const existing = items.find((s) => s.email.toLowerCase() === input.email.trim().toLowerCase());
      if (existing) {
        existing.isActive = true;
        existing.fullName = input.fullName.trim() || existing.fullName;
        writeLocal(items);
        return existing;
      }
      const created: StaffMember = {
        id: `staff-${Date.now()}`,
        email: input.email.trim().toLowerCase(),
        fullName: input.fullName.trim(),
        role: "admin",
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy,
      };
      items.unshift(created);
      writeLocal(items);
      return created;
    }

    const { data, error } = await sb.from("staff_members").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return staffFromRow(data);
  },

  async setActive(id: string, isActive: boolean): Promise<StaffMember> {
    const sb = getSupabaseSafe();
    if (!sb) {
      const items = readLocal();
      const idx = items.findIndex((s) => s.id === id);
      if (idx < 0) throw new Error("Personal hittades inte");
      items[idx] = { ...items[idx], isActive };
      writeLocal(items);
      return items[idx];
    }

    const { data, error } = await sb
      .from("staff_members")
      .update({ is_active: isActive })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return staffFromRow(data);
  },

  async remove(id: string): Promise<void> {
    const sb = getSupabaseSafe();
    if (!sb) {
      writeLocal(readLocal().filter((s) => s.id !== id));
      return;
    }
    const { error } = await sb.from("staff_members").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async resolveAdminAccess(userId: string, email: string): Promise<boolean> {
    const sb = getSupabaseSafe();
    if (!sb) return isStaffEmail(email);

    const { data: profile } = await sb
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.is_admin) return true;

    const { data: staff } = await sb
      .from("staff_members")
      .select("id")
      .ilike("email", email.trim())
      .eq("is_active", true)
      .maybeSingle();

    if (staff) return true;

    return ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email.trim().toLowerCase());
  },
};
