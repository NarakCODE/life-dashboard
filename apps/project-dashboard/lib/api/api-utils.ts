export function getApiBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!value) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  }

  return value.endsWith("/") ? value.slice(0, -1) : value;
}
