import { ShopSettings } from "../types";
import { getSupabaseSafe } from "../lib/supabase";
import { DEFAULT_SHOP_SETTINGS, normalizeShopSettings } from "../lib/aiDescription";

const STORAGE_KEY = "nordhav_shop_settings";
const SETTINGS_ID = "default";

let cache: ShopSettings | null = null;

function readLocal(): ShopSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SHOP_SETTINGS;
    return normalizeShopSettings(JSON.parse(raw) as Partial<ShopSettings>);
  } catch {
    return DEFAULT_SHOP_SETTINGS;
  }
}

function writeLocal(settings: ShopSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function settingsFromRow(row: Record<string, unknown>): ShopSettings {
  return normalizeShopSettings({
    aiDescriptionTheme: row.ai_description_theme as ShopSettings["aiDescriptionTheme"],
    aiDescriptionCustomPrompt: row.ai_description_custom_prompt
      ? String(row.ai_description_custom_prompt)
      : "",
  });
}

function rowFromSettings(settings: ShopSettings) {
  return {
    id: SETTINGS_ID,
    ai_description_theme: settings.aiDescriptionTheme,
    ai_description_custom_prompt: settings.aiDescriptionCustomPrompt?.trim() || null,
    updated_at: new Date().toISOString(),
  };
}

export const shopSettingsService = {
  getCached(): ShopSettings {
    return cache ?? DEFAULT_SHOP_SETTINGS;
  },

  async get(): Promise<ShopSettings> {
    const sb = getSupabaseSafe();
    if (!sb) {
      const local = readLocal();
      cache = local;
      return local;
    }

    const { data, error } = await sb.from("shop_settings").select("*").eq("id", SETTINGS_ID).maybeSingle();

    if (error) {
      console.warn("[shopSettings] Supabase fetch failed, using local:", error.message);
      const fallback = readLocal();
      cache = fallback;
      return fallback;
    }

    if (!data) {
      await shopSettingsService.save(DEFAULT_SHOP_SETTINGS);
      cache = DEFAULT_SHOP_SETTINGS;
      return DEFAULT_SHOP_SETTINGS;
    }

    const settings = settingsFromRow(data);
    cache = settings;
    writeLocal(settings);
    return settings;
  },

  async save(settings: ShopSettings): Promise<ShopSettings> {
    const normalized = normalizeShopSettings(settings);
    cache = normalized;
    const sb = getSupabaseSafe();

    if (!sb) {
      writeLocal(normalized);
      cache = normalized;
      return normalized;
    }

    const { error } = await sb.from("shop_settings").upsert(rowFromSettings(normalized));
    if (error) throw error;

    writeLocal(normalized);
    cache = normalized;
    return normalized;
  },
};
