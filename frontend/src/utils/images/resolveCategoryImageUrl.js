export const CATEGORY_FALLBACK_IMAGE = "/images/default-group.jpg";

export function resolveCategoryImageUrl(path, apiBaseUrl) {
  const normalizedPath = String(path || "").trim();
  const baseUrl = String(apiBaseUrl || "").replace(/\/$/, "");

  if (!normalizedPath) {
    return normalizedPath;
  }
  if (
    normalizedPath.startsWith("http://") ||
    normalizedPath.startsWith("https://")
  ) {
    return normalizedPath;
  }
  if (normalizedPath.startsWith("/")) {
    return `${baseUrl}${normalizedPath}`;
  }
  return `${baseUrl}/${normalizedPath}`;
}
