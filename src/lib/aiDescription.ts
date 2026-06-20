import type { AiDescriptionTheme, CategoryVariantMode, ShopSettings } from "../types";

export const AI_THEME_LABELS: Record<AiDescriptionTheme, string> = {
  fishing: "Fiskebutik",
  generic: "Generisk e-handel",
  custom: "Egen ton",
};

export const AI_THEME_DESCRIPTIONS: Record<AiDescriptionTheme, string> = {
  fishing: "Säljande texter riktade till fiskare — används automatiskt för fiskekategorier.",
  generic: "Neutrala produktbeskrivningar — används automatiskt för övriga kategorier.",
  custom: "Skriv egna instruktioner som styr AI:ns ton, målgrupp och fokus.",
};

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  aiDescriptionTheme: "generic",
  aiDescriptionCustomPrompt: "",
};

const VALID_THEMES: AiDescriptionTheme[] = ["fishing", "generic", "custom"];

const LEGACY_FISHING_CATEGORIES = new Set(["Beten", "Spön", "Rullar", "Fiskekläder"]);

export function isFishingCategory(categoryName: string, variantMode?: CategoryVariantMode): boolean {
  const name = categoryName.trim();
  if (!name) return false;

  if (variantMode === "beten" || variantMode === "rod" || variantMode === "reel") return true;
  if (variantMode === "clothing") return /fiske/i.test(name);
  if (variantMode === "simple" || variantMode === "none") {
    return LEGACY_FISHING_CATEGORIES.has(name);
  }

  return LEGACY_FISHING_CATEGORIES.has(name);
}

export function aiThemeForCategory(categoryName: string, variantMode?: CategoryVariantMode): AiDescriptionTheme {
  return isFishingCategory(categoryName, variantMode) ? "fishing" : "generic";
}

export function normalizeShopSettings(input: Partial<ShopSettings> | null | undefined): ShopSettings {
  const theme = input?.aiDescriptionTheme;
  return {
    aiDescriptionTheme: VALID_THEMES.includes(theme as AiDescriptionTheme)
      ? (theme as AiDescriptionTheme)
      : DEFAULT_SHOP_SETTINGS.aiDescriptionTheme,
    aiDescriptionCustomPrompt: String(input?.aiDescriptionCustomPrompt ?? "").trim(),
  };
}

export function resolveEffectiveAiTheme(
  settings: Pick<ShopSettings, "aiDescriptionTheme" | "aiDescriptionCustomPrompt">,
  category: string,
  variantMode?: CategoryVariantMode
): AiDescriptionTheme {
  if (settings.aiDescriptionTheme === "custom") return "custom";
  if (settings.aiDescriptionTheme === "generic") return "generic";
  return isFishingCategory(category, variantMode) ? "fishing" : "generic";
}

function isEverydayClothingCategory(category: string, variantMode?: CategoryVariantMode): boolean {
  return variantMode === "clothing" && !/fiske/i.test(category.trim());
}

export function buildAiDescriptionPrompt(
  title: string,
  category: string,
  settings: Pick<ShopSettings, "aiDescriptionTheme" | "aiDescriptionCustomPrompt">,
  variantMode?: CategoryVariantMode
): string {
  const theme = resolveEffectiveAiTheme(settings, category, variantMode);
  const formatRules = "Skriv 2–4 meningar på svenska utan rubriker eller punktlistor.";

  switch (theme) {
    case "fishing":
      return `Skapa en lockande produktbeskrivning på svenska för en fiskeprodukt med titeln "${title}" i kategorin "${category}". Beskrivningen ska vara säljande, professionell och rik på detaljer om varför en fiskare skulle älska den. ${formatRules}`;
    case "generic": {
      const clothingHint = isEverydayClothingCategory(category, variantMode)
        ? `Detta är en vanlig klädesprodukt (mode/vardag) i kategorin "${category}" — INTE fiskekläder, vadare eller friluftsutrustning.\n\n`
        : "";

      return `${clothingHint}Du skriver produktbeskrivningar för en neutral webbutik — inte en fiskebutik.

Produkt: "${title}"
Kategori: "${category}"

Skriv en lockande, professionell produktbeskrivning på svenska. Fokusera på produktens fördelar, kvalitet, material och användning.

Strikt förbjudet i texten:
- fiske, fiskare, fisketur, fiskeutrustning
- beten, spön, rullar, kast, drag, waders, vadare
- arter, havsöring, gädda, abborre
- vattnet, båt, kust, sjö (om det inte är en badprodukt)

Skriv som för en vanlig e-handelsprodukt. Beskriv utifrån produktnamnet — ignorera butiksvarumärke om det låter fiskerelaterat.

${formatRules}`;
    }
    case "custom": {
      const custom = settings.aiDescriptionCustomPrompt?.trim();
      if (custom) {
        return `${custom}\n\nProdukt: "${title}"\nKategori: "${category}"\n\n${formatRules}`;
      }
      return `Skapa en lockande produktbeskrivning på svenska för produkten "${title}" i kategorin "${category}". Beskrivningen ska vara säljande och professionell. ${formatRules}`;
    }
  }
}

export function genericAiSystemInstruction(category?: string, variantMode?: CategoryVariantMode): string {
  const clothing = category && isEverydayClothingCategory(category, variantMode);
  return clothing
    ? "Du skriver mode- och vardagskläder för en vanlig webbutik. Nämn aldrig fiske, fiskare, vadare, waders eller frilufts/fiske-scenarier."
    : "Du skriver neutrala produktbeskrivningar för en allmän webbutik. Nämn aldrig fiske, fiskare eller fiskeutrustning om det inte uttryckligen efterfrågas i prompten.";
}

export function previewAiDescriptionPrompt(
  settings: ShopSettings,
  sampleTitle = "Exempel Produkt",
  sampleCategory = "Kategori",
  variantMode?: CategoryVariantMode
): string {
  return buildAiDescriptionPrompt(sampleTitle, sampleCategory, settings, variantMode);
}

export function buildImproveDescriptionPrompt(existingDescription: string): string {
  return `Förbättra och förfina följande produktbeskrivning på svenska.

Befintlig text:
"${existingDescription}"

Uppgift:
- Gör texten tydligare, mer professionell och välskriven.
- Behåll samma fakta, budskap och inriktning.
- Rätta stavning, grammatik och flyt.
- Lägg inte till ny information som inte finns i texten.
- Skriv om texten — kopiera den inte ordagrant.
- Returnera bara den förbättrade beskrivningen, utan rubriker eller punktlistor.`;
}

export function improveDescriptionSystemInstruction(): string {
  return "Du förbättrar befintliga produkttexter för e-handel. Behåll innebörden och faktan, gör språket mer professionellt. Lägg inte till ny information.";
}
