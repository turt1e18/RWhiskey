import { jsonRequestHeaders } from "./apiClient";

/** An optional search picture must never turn a saved recommendation into a failure. */
export async function getRecommendationImage(query: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6_000);
  try {
    const response = await fetch("/api/google", {
      method: "POST", headers: jsonRequestHeaders(), credentials: "include",
      body: JSON.stringify({ data: query, type: 3 }), signal: controller.signal,
    });
    if (!response.ok) return null;
    const value: unknown = await response.json();
    if (typeof value !== "string" || value.length > 2048 || value !== value.trim()) return null;
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? value : null;
  } catch { return null; }
  finally { clearTimeout(timeout); }
}
