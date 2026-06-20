import { CategoryVariantMode, ShopCategory } from "../types";

export const DEFAULT_CATEGORIES: ShopCategory[] = [
  {
    id: "cat-beten",
    name: "Beten",
    sortOrder: 0,
    isActive: true,
    showInNav: true,
    showInShopFilter: true,
    variantMode: "beten",
  },
  {
    id: "cat-spön",
    name: "Spön",
    sortOrder: 1,
    isActive: true,
    showInNav: true,
    showInShopFilter: true,
    variantMode: "rod",
  },
  {
    id: "cat-rullar",
    name: "Rullar",
    sortOrder: 2,
    isActive: true,
    showInNav: true,
    showInShopFilter: true,
    variantMode: "reel",
  },
  {
    id: "cat-klader",
    name: "Fiskekläder",
    sortOrder: 3,
    isActive: true,
    showInNav: true,
    showInShopFilter: true,
    variantMode: "clothing",
  },
  {
    id: "cat-tillbehor",
    name: "Tillbehör",
    sortOrder: 4,
    isActive: true,
    showInNav: true,
    showInShopFilter: true,
    variantMode: "simple",
  },
];

export const VARIANT_MODE_LABELS: Record<CategoryVariantMode, string> = {
  beten: "Beten (vikt + färg)",
  clothing: "Kläder (storlek + färg)",
  rod: "Spön (längd)",
  reel: "Rullar (storlek)",
  simple: "Enkel variantlista",
  none: "Inga varianter",
};

let runtimeCategories: ShopCategory[] = [...DEFAULT_CATEGORIES];

export function setRuntimeCategories(categories: ShopCategory[]) {
  runtimeCategories = categories.length ? [...categories] : [...DEFAULT_CATEGORIES];
}

export function getRuntimeCategories(): ShopCategory[] {
  return [...runtimeCategories].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getCategoryByName(name: string): ShopCategory | undefined {
  return getRuntimeCategories().find((c) => c.name === name);
}

function inferLegacyVariantMode(category: string): CategoryVariantMode {
  switch (category) {
    case "Beten":
      return "beten";
    case "Fiskekläder":
      return "clothing";
    case "Spön":
      return "rod";
    case "Rullar":
      return "reel";
    case "Tillbehör":
      return "simple";
    default:
      return "none";
  }
}

export function getVariantMode(category: string): CategoryVariantMode {
  return getCategoryByName(category)?.variantMode ?? inferLegacyVariantMode(category);
}

export function categoryUsesVariantsByMode(category: string): boolean {
  return getVariantMode(category) !== "none";
}

export function sortCategories(categories: ShopCategory[]): ShopCategory[] {
  return [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function createCategoryId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9åäö]+/gi, "-")
    .replace(/^-|-$/g, "");
  return `cat-${slug || Date.now()}`;
}

export function normalizeCategoryList(raw: ShopCategory[]): ShopCategory[] {
  return sortCategories(
    raw.map((c, index) => ({
      ...c,
      id: c.id || createCategoryId(c.name),
      name: c.name.trim(),
      sortOrder: Number.isFinite(c.sortOrder) ? c.sortOrder : index,
      isActive: c.isActive !== false,
      showInNav: c.showInNav !== false,
      showInShopFilter: c.showInShopFilter !== false,
      variantMode: c.variantMode || "simple",
    }))
  );
}
