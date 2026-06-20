import { ShopCategory } from "../types";
import { getSupabaseSafe } from "../lib/supabase";
import {
  DEFAULT_CATEGORIES,
  createCategoryId,
  normalizeCategoryList,
  setRuntimeCategories,
} from "../lib/categories";
import { dbService } from "./db";

const STORAGE_KEY = "nordhav_categories";

function readLocal(): ShopCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CATEGORIES;
    const parsed = JSON.parse(raw) as ShopCategory[];
    return normalizeCategoryList(Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_CATEGORIES);
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

function writeLocal(items: ShopCategory[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function rowFromCategory(c: ShopCategory) {
  return {
    id: c.id,
    name: c.name,
    sort_order: c.sortOrder,
    is_active: c.isActive,
    show_in_nav: c.showInNav,
    show_in_shop_filter: c.showInShopFilter,
    variant_mode: c.variantMode,
  };
}

function categoryFromRow(row: Record<string, unknown>): ShopCategory {
  return {
    id: String(row.id),
    name: String(row.name),
    sortOrder: Number(row.sort_order ?? 0),
    isActive: row.is_active !== false,
    showInNav: row.show_in_nav !== false,
    showInShopFilter: row.show_in_shop_filter !== false,
    variantMode: (row.variant_mode as ShopCategory["variantMode"]) || "simple",
  };
}

export const categoryService = {
  async getAll(): Promise<ShopCategory[]> {
    const sb = getSupabaseSafe();
    if (!sb) {
      const local = readLocal();
      setRuntimeCategories(local);
      return local;
    }

    const { data, error } = await sb
      .from("product_categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.warn("[categories] Supabase fetch failed, using defaults:", error.message);
      const fallback = readLocal();
      setRuntimeCategories(fallback);
      return fallback;
    }

    if (!data?.length) {
      await categoryService.saveAll(DEFAULT_CATEGORIES);
      setRuntimeCategories(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }

    const categories = normalizeCategoryList(data.map(categoryFromRow));
    setRuntimeCategories(categories);
    writeLocal(categories);
    return categories;
  },

  async saveAll(categories: ShopCategory[]): Promise<ShopCategory[]> {
    const normalized = normalizeCategoryList(categories);
    const sb = getSupabaseSafe();
    if (!sb) {
      writeLocal(normalized);
      setRuntimeCategories(normalized);
      return normalized;
    }

    const { data: existing, error: fetchError } = await sb.from("product_categories").select("id");
    if (fetchError) throw fetchError;

    const keepIds = new Set(normalized.map((c) => c.id));
    const removeIds = (existing ?? []).map((r) => String(r.id)).filter((id) => !keepIds.has(id));
    if (removeIds.length) {
      const { error: deleteError } = await sb.from("product_categories").delete().in("id", removeIds);
      if (deleteError) throw deleteError;
    }

    const { error: upsertError } = await sb.from("product_categories").upsert(normalized.map(rowFromCategory));
    if (upsertError) throw upsertError;

    writeLocal(normalized);
    setRuntimeCategories(normalized);
    return normalized;
  },

  async renameCategory(oldName: string, newName: string): Promise<void> {
    const trimmed = newName.trim();
    if (!oldName.trim() || !trimmed || oldName === trimmed) return;
    await dbService.renameProductCategory(oldName, trimmed);
  },

  countProducts(categoryName: string, products: { category: string }[]): number {
    return products.filter((p) => p.category === categoryName).length;
  },

  emptyCategory(name = ""): ShopCategory {
    return {
      id: createCategoryId(name || "ny-kategori"),
      name,
      sortOrder: 999,
      isActive: true,
      showInNav: true,
      showInShopFilter: true,
      variantMode: "simple",
    };
  },
};
