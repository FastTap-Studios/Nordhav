import { HomepageSpotlight } from "../types";
import { publicImagePath } from "./images";

export const DEFAULT_HOMEPAGE_SPOTLIGHTS: HomepageSpotlight[] = [
  {
    id: "hp-gaddfiske",
    label: "Gäddfiske",
    imageUrl: publicImagePath("nordhav_cat_lures_1781309138230.jpg"),
    categoryNames: ["Beten"],
    sortOrder: 0,
    isActive: true,
  },
  {
    id: "hp-abborrfiske",
    label: "Abborrfiske",
    imageUrl: publicImagePath("nordhav_cat_reels_1781309168529.jpg"),
    categoryNames: ["Rullar"],
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "hp-kustfiske",
    label: "Kustfiske",
    imageUrl: publicImagePath("nordhav_tacklebox_1781308631491.jpg"),
    categoryNames: ["Tillbehör"],
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "hp-flugfiske",
    label: "Flugfiske",
    imageUrl: publicImagePath("nordhav_spinner_1781308605971.jpg"),
    categoryNames: ["Beten"],
    sortOrder: 3,
    isActive: true,
  },
  {
    id: "hp-klader",
    label: "Kläder",
    imageUrl: publicImagePath("nordhav_jacket_1781308592116.jpg"),
    categoryNames: ["Fiskekläder"],
    sortOrder: 4,
    isActive: true,
  },
  {
    id: "hp-elektronik",
    label: "Elektronik",
    imageUrl: publicImagePath("nordhav_net_1781308643420.jpg"),
    categoryNames: ["Tillbehör"],
    sortOrder: 5,
    isActive: true,
  },
];

type LegacySpotlight = HomepageSpotlight & { categoryName?: string };

export function resolveSpotlightCategoryNames(item: LegacySpotlight): string[] {
  if (Array.isArray(item.categoryNames) && item.categoryNames.length) {
    return item.categoryNames.map((name) => name.trim()).filter(Boolean);
  }
  const legacy = item.categoryName?.trim();
  return legacy ? [legacy] : [];
}

export function formatSpotlightCategories(names: string[]): string {
  return names.join(", ");
}

export function spotlightShopPath(categoryNames: string[]): string {
  const names = categoryNames.map((name) => name.trim()).filter(Boolean);
  if (!names.length) return "/shop";
  return `/shop?category=${names.map(encodeURIComponent).join(",")}`;
}

export function parseShopCategoryParam(param: string | null): string[] {
  if (!param) return [];
  return param
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

export function createSpotlightId(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9åäö]+/gi, "-")
    .replace(/^-|-$/g, "");
  return `hp-${slug || Date.now()}`;
}

export function sortSpotlights(items: HomepageSpotlight[]): HomepageSpotlight[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function normalizeSpotlightList(raw: LegacySpotlight[]): HomepageSpotlight[] {
  return sortSpotlights(
    raw.map((item, index) => ({
      id: item.id || createSpotlightId(item.label),
      label: item.label.trim(),
      imageUrl: item.imageUrl.trim(),
      categoryNames: resolveSpotlightCategoryNames(item),
      sortOrder: Number.isFinite(item.sortOrder) ? item.sortOrder : index,
      isActive: item.isActive !== false,
    }))
  );
}

export function emptySpotlight(productCategories: string[]): HomepageSpotlight {
  const first = productCategories[0]?.trim();
  return {
    id: createSpotlightId("nytt-kort"),
    label: "",
    imageUrl: "",
    categoryNames: first ? [first] : [],
    sortOrder: 999,
    isActive: true,
  };
}
