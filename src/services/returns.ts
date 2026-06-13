import { ReturnRequest } from "../types";
import { getSupabaseSafe } from "../lib/supabase";
import { returnFromRow, returnToRow } from "../lib/supabaseMappers";

const STORAGE_KEY = "nordhav_returns";

const DEFAULT_RETURNS: ReturnRequest[] = [
  {
    id: "ret-1",
    orderId: "demo-order-1",
    orderNumber: "NH-DEMO0001",
    customerName: "Erik Lindström",
    customerEmail: "erik@example.com",
    reason: "defect",
    reasonDetails: "Jerkbaitet har spricka i plasten vid förbindelsen.",
    status: "pending",
    refundAmount: 249,
    items: [{ productName: "Nordhav Hydro-Glide Jerkbait", quantity: 1, unitPrice: 249 }],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "ret-2",
    orderId: "demo-order-2",
    orderNumber: "NH-DEMO0002",
    customerName: "Anna Berg",
    customerEmail: "anna@example.com",
    reason: "regret",
    status: "approved",
    refundAmount: 149,
    items: [{ productName: "Havsöring Special Inline-Spinnare", quantity: 1, unitPrice: 149 }],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

function readLocal(): ReturnRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RETURNS));
      return DEFAULT_RETURNS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_RETURNS;
  } catch {
    return DEFAULT_RETURNS;
  }
}

function writeLocal(items: ReturnRequest[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const RETURN_REASONS: Record<ReturnRequest["reason"], string> = {
  defect: "Defekt produkt",
  wrong_product: "Fel produkt",
  regret: "Ångrat köp",
  shipping_damage: "Skadad vid frakt",
  other: "Övrigt",
};

export const RETURN_STATUS_LABELS: Record<ReturnRequest["status"], string> = {
  pending: "Väntar",
  approved: "Godkänd",
  rejected: "Avslagen",
  completed: "Slutförd",
};

export const returnService = {
  async getAll(): Promise<ReturnRequest[]> {
    const sb = getSupabaseSafe();
    if (!sb) return readLocal().sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const { data, error } = await sb.from("returns").select("*").order("created_at", { ascending: false });
    if (error) {
      console.warn("[Supabase] getAll returns:", error);
      return readLocal();
    }
    return (data ?? []).map(returnFromRow);
  },

  async save(item: Partial<ReturnRequest> & { id?: string }): Promise<ReturnRequest> {
    const sb = getSupabaseSafe();
    if (!sb) {
      const items = readLocal();
      if (item.id) {
        const idx = items.findIndex((r) => r.id === item.id);
        if (idx >= 0) {
          items[idx] = { ...items[idx], ...item } as ReturnRequest;
          writeLocal(items);
          return items[idx];
        }
      }
      const created: ReturnRequest = {
        id: `ret-${Date.now()}`,
        orderId: item.orderId || "",
        orderNumber: item.orderNumber || "",
        customerName: item.customerName || "",
        customerEmail: item.customerEmail || "",
        reason: item.reason || "other",
        reasonDetails: item.reasonDetails,
        status: item.status || "pending",
        refundAmount: item.refundAmount || 0,
        items: item.items || [],
        createdAt: item.createdAt || new Date().toISOString(),
      };
      items.unshift(created);
      writeLocal(items);
      return created;
    }

    if (item.id) {
      const { data, error } = await sb
        .from("returns")
        .update(returnToRow(item))
        .eq("id", item.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return returnFromRow(data);
    }

    const { data, error } = await sb.from("returns").insert(returnToRow(item)).select().single();
    if (error) throw new Error(error.message);
    return returnFromRow(data);
  },

  async update(id: string, data: Partial<ReturnRequest>): Promise<ReturnRequest | null> {
    const sb = getSupabaseSafe();
    if (!sb) {
      const items = readLocal();
      const idx = items.findIndex((r) => r.id === id);
      if (idx < 0) return null;
      items[idx] = { ...items[idx], ...data };
      writeLocal(items);
      return items[idx];
    }

    const { data: row, error } = await sb
      .from("returns")
      .update(returnToRow(data))
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return returnFromRow(row);
  },

  async delete(id: string) {
    const sb = getSupabaseSafe();
    if (!sb) {
      writeLocal(readLocal().filter((r) => r.id !== id));
      return;
    }
    const { error } = await sb.from("returns").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
