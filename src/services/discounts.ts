import { DiscountCode } from "../types";
import { getSupabaseSafe } from "../lib/supabase";
import { discountFromRow, discountToRow } from "../lib/supabaseMappers";

const STORAGE_KEY = "nordhav_discounts";

const DEFAULT_DISCOUNTS: DiscountCode[] = [
  {
    id: "disc-welcome10",
    code: "WELCOME10",
    type: "percent",
    value: 10,
    minOrderAmount: 0,
    maxUses: 0,
    usedCount: 12,
    isActive: true,
    validFrom: "",
    validUntil: "",
  },
  {
    id: "disc-frifrakt",
    code: "FRIFRAKT",
    type: "free_shipping",
    value: 0,
    minOrderAmount: 499,
    maxUses: 0,
    usedCount: 8,
    isActive: true,
    validFrom: "",
    validUntil: "",
  },
  {
    id: "disc-sommar50",
    code: "SOMMAR50",
    type: "fixed_amount",
    value: 50,
    minOrderAmount: 299,
    maxUses: 100,
    usedCount: 23,
    isActive: true,
    validFrom: "",
    validUntil: "",
  },
];

function readLocal(): DiscountCode[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DISCOUNTS));
    return DEFAULT_DISCOUNTS;
  }
  try {
    const parsed = JSON.parse(raw) as DiscountCode[];
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_DISCOUNTS;
  } catch {
    return DEFAULT_DISCOUNTS;
  }
}

function writeLocal(items: DiscountCode[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const discountService = {
  async validateCode(
    code: string,
    subtotal: number
  ): Promise<{ discount: DiscountCode | null; error?: string }> {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return { discount: null, error: "Ange en rabattkod." };

    const all = await discountService.getAll();
    const match = all.find((d) => d.code.toUpperCase() === normalized);

    if (!match || !match.isActive) {
      return { discount: null, error: "Ogiltig rabattkod." };
    }
    if (match.maxUses > 0 && match.usedCount >= match.maxUses) {
      return { discount: null, error: "Rabattkoden har nått max antal användningar." };
    }
    if (subtotal < match.minOrderAmount) {
      return {
        discount: null,
        error: `Minsta orderbelopp är ${match.minOrderAmount} kr för denna kod.`,
      };
    }
    if (match.validFrom && new Date(match.validFrom) > new Date()) {
      return { discount: null, error: "Rabattkoden är inte giltig än." };
    }
    if (match.validUntil && new Date(match.validUntil) < new Date()) {
      return { discount: null, error: "Rabattkoden har gått ut." };
    }

    return { discount: match };
  },

  async getAll(): Promise<DiscountCode[]> {
    const sb = getSupabaseSafe();
    if (!sb) return readLocal();

    const { data, error } = await sb.from("discount_codes").select("*").order("created_at", { ascending: false });
    if (error) {
      console.warn("[Supabase] getAll discounts:", error);
      return readLocal();
    }
    return (data ?? []).map(discountFromRow);
  },

  async save(item: Omit<DiscountCode, "id"> & { id?: string }): Promise<DiscountCode> {
    const sb = getSupabaseSafe();
    if (!sb) {
      const items = readLocal();
      if (item.id) {
        const idx = items.findIndex((d) => d.id === item.id);
        const updated: DiscountCode = { ...items[idx], ...item, id: item.id };
        if (idx >= 0) items[idx] = updated;
        else items.unshift(updated);
        writeLocal(items);
        return updated;
      }
      const created: DiscountCode = {
        ...item,
        id: "disc-" + Math.random().toString(36).slice(2, 9),
        usedCount: item.usedCount ?? 0,
      };
      items.unshift(created);
      writeLocal(items);
      return created;
    }

    if (item.id) {
      const { data, error } = await sb
        .from("discount_codes")
        .update(discountToRow(item))
        .eq("id", item.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return discountFromRow(data);
    }

    const { data, error } = await sb.from("discount_codes").insert(discountToRow(item)).select().single();
    if (error) throw new Error(error.message);
    return discountFromRow(data);
  },

  async delete(id: string) {
    const sb = getSupabaseSafe();
    if (!sb) {
      writeLocal(readLocal().filter((d) => d.id !== id));
      return;
    }
    const { error } = await sb.from("discount_codes").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

export const emptyDiscount = (): Omit<DiscountCode, "id"> => ({
  code: "",
  type: "percent",
  value: 0,
  minOrderAmount: 0,
  maxUses: 0,
  usedCount: 0,
  isActive: true,
  validFrom: "",
  validUntil: "",
});
