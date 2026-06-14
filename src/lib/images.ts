const LEGACY_PREFIX = "/src/assets/images/";

/** Public URL for static images (served from public/images in production). */
export function publicImagePath(filename: string): string {
  return `/images/${filename}`;
}

/** Normalize dev-only /src/assets paths and legacy DB values to /images/... */
export function resolveImageUrl(url: string | undefined | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  if (url.startsWith(LEGACY_PREFIX)) {
    return url.replace(LEGACY_PREFIX, "/images/");
  }
  return url;
}

export function resolveImageUrls(urls: string[] | undefined | null): string[] {
  if (!urls?.length) return [];
  return urls.map((url) => resolveImageUrl(url)).filter(Boolean);
}

export const LOGO_URL = publicImagePath("nordhav_logo_1781307846821.jpg");

export const HERO_BANNER = publicImagePath("nordhav_hero_banner_1781308018253.jpg");
export const CAT_LURES = publicImagePath("nordhav_cat_lures_1781309138230.jpg");
export const CAT_RODS = publicImagePath("nordhav_cat_rods_1781309153589.jpg");
export const CAT_REELS = publicImagePath("nordhav_cat_reels_1781309168529.jpg");
export const CAT_TACKLEBOX = publicImagePath("nordhav_tacklebox_1781308631491.jpg");
export const CAT_SPINNER = publicImagePath("nordhav_spinner_1781308605971.jpg");
export const CAT_JACKET = publicImagePath("nordhav_jacket_1781308592116.jpg");
export const CAT_NET = publicImagePath("nordhav_net_1781308643420.jpg");
