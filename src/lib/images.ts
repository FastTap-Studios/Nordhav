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
