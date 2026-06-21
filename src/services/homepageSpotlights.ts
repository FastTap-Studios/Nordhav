import { HomepageSpotlight } from "../types";
import { getSupabaseSafe } from "../lib/supabase";
import {
  DEFAULT_HOMEPAGE_SPOTLIGHTS,
  normalizeSpotlightList,
  resolveSpotlightCategoryNames,
} from "../lib/homepageSpotlights";

const STORAGE_KEY = "nordhav_homepage_spotlights";

function readLocal(): HomepageSpotlight[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_HOMEPAGE_SPOTLIGHTS;
    const parsed = JSON.parse(raw) as HomepageSpotlight[];
    return normalizeSpotlightList(
      Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_HOMEPAGE_SPOTLIGHTS
    );
  } catch {
    return DEFAULT_HOMEPAGE_SPOTLIGHTS;
  }
}

function writeLocal(items: HomepageSpotlight[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function rowFromSpotlight(item: HomepageSpotlight) {
  return {
    id: item.id,
    label: item.label,
    image_url: item.imageUrl,
    category_names: item.categoryNames,
    sort_order: item.sortOrder,
    is_active: item.isActive,
  };
}

function spotlightFromRow(row: Record<string, unknown>): HomepageSpotlight {
  const categoryNamesFromArray = Array.isArray(row.category_names)
    ? row.category_names.map(String).filter(Boolean)
    : [];

  return normalizeSpotlightList([
    {
      id: String(row.id),
      label: String(row.label),
      imageUrl: String(row.image_url ?? ""),
      categoryNames: categoryNamesFromArray,
      categoryName: row.category_name ? String(row.category_name) : undefined,
      sortOrder: Number(row.sort_order ?? 0),
      isActive: row.is_active !== false,
    },
  ])[0];
}

export const homepageSpotlightService = {
  async getAll(): Promise<HomepageSpotlight[]> {
    const sb = getSupabaseSafe();
    if (!sb) return readLocal();

    const { data, error } = await sb
      .from("homepage_spotlights")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.warn("[homepageSpotlights] Supabase fetch failed, using defaults:", error.message);
      return readLocal();
    }

    if (!data?.length) {
      await homepageSpotlightService.saveAll(DEFAULT_HOMEPAGE_SPOTLIGHTS);
      writeLocal(DEFAULT_HOMEPAGE_SPOTLIGHTS);
      return DEFAULT_HOMEPAGE_SPOTLIGHTS;
    }

    const items = normalizeSpotlightList(data.map(spotlightFromRow));
    writeLocal(items);
    return items;
  },

  async saveAll(items: HomepageSpotlight[]): Promise<HomepageSpotlight[]> {
    const normalized = normalizeSpotlightList(
      items.map((item) => ({
        ...item,
        categoryNames: resolveSpotlightCategoryNames(item),
      }))
    );
    const sb = getSupabaseSafe();
    if (!sb) {
      writeLocal(normalized);
      return normalized;
    }

    const { data: existing, error: fetchError } = await sb.from("homepage_spotlights").select("id");
    if (fetchError) throw fetchError;

    const keepIds = new Set(normalized.map((item) => item.id));
    const removeIds = (existing ?? []).map((r) => String(r.id)).filter((id) => !keepIds.has(id));
    if (removeIds.length) {
      const { error: deleteError } = await sb.from("homepage_spotlights").delete().in("id", removeIds);
      if (deleteError) throw deleteError;
    }

    const { error: upsertError } = await sb
      .from("homepage_spotlights")
      .upsert(normalized.map(rowFromSpotlight));
    if (upsertError) throw upsertError;

    writeLocal(normalized);
    return normalized;
  },
};
