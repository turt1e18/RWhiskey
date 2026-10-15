import "server-only";
import axios, { type AxiosRequestConfig } from "axios";
import { LegacyProviderFailure } from "./legacyProviderGuard";

export type LegacyImageRequest = { data: string; type: 0 | 1 | 3 };
export type ImageSearchHit = { url: string | null; thumbnailUrl: string | null };
export interface ImageSearchProvider {
  search(query: string, limit: 1 | 3, signal: AbortSignal): Promise<ImageSearchHit[]>;
}
export type ImageSearchTransport = (url: string, options: AxiosRequestConfig) => Promise<{ data: unknown }>;
export type ImageSearchSettings = {
  providerName?: string;
  key?: string;
  engineId?: string;
  transport?: ImageSearchTransport;
  now?: () => number;
};

export const CSE_RETIRES_AT = Date.parse("2027-01-01T00:00:00Z");

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function safeImageUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048 || value !== value.trim()) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname !== "" && !url.username && !url.password &&
      (url.port === "" || url.port === "443") ? value : null;
  } catch { return null; }
}

export class GoogleCseImageSearchProvider implements ImageSearchProvider {
  constructor(
    private readonly key: string,
    private readonly engineId: string,
    private readonly transport: ImageSearchTransport = (url, options) => axios.get<unknown>(url, options),
    private readonly now: () => number = Date.now,
  ) {}

  async search(query: string, limit: 1 | 3, signal: AbortSignal): Promise<ImageSearchHit[]> {
    if (signal.aborted) throw new LegacyProviderFailure("REQUEST_DEADLINE_EXCEEDED", 503);
    if (this.now() >= CSE_RETIRES_AT) throw new LegacyProviderFailure("SEARCH_PROVIDER_RETIRED", 503);
    if (!this.key.trim() || !this.engineId.trim()) throw new LegacyProviderFailure("SEARCH_NOT_CONFIGURED", 503);
    const response = await this.transport("https://customsearch.googleapis.com/customsearch/v1", {
      params: { q: query, searchType: "image", num: limit, key: this.key, cx: this.engineId },
      signal, timeout: 5_000, maxRedirects: 0, maxContentLength: 131_072, maxBodyLength: 32_768,
    });
    const data = response.data;
    if (!record(data) || "error" in data || ("items" in data && !Array.isArray(data.items)))
      throw new LegacyProviderFailure("SEARCH_SCHEMA_INVALID", 503);
    const items = Array.isArray(data.items) ? data.items : [];
    if (items.length > limit) throw new LegacyProviderFailure("SEARCH_SCHEMA_INVALID", 503);
    // Preserve result positions: a bad first image must not be presented as an exact product match.
    return items.map((item: unknown) => {
      if (!record(item)) return { url: null, thumbnailUrl: null };
      const image = record(item.image) ? item.image : null;
      return { url: safeImageUrl(item.link), thumbnailUrl: safeImageUrl(image?.thumbnailLink) };
    });
  }
}

export function createImageSearchProvider(settings: ImageSearchSettings = {}): ImageSearchProvider {
  const name = (settings.providerName ?? process.env.IMAGE_SEARCH_PROVIDER ?? "CSE").trim().toUpperCase();
  if (name === "DISABLED") return { search: async () => [] };
  if (name !== "CSE") throw new LegacyProviderFailure("SEARCH_PROVIDER_NOT_APPROVED", 503);
  return new GoogleCseImageSearchProvider(
    settings.key ?? process.env.GOOGLESEARCH_ACCESS_KEY ?? "",
    settings.engineId ?? process.env.GOOGLESEARCHID_ACCESS_KEY ?? "",
    settings.transport, settings.now);
}

export function parseLegacyImageRequest(value: unknown): LegacyImageRequest {
  if (!record(value) || ![0, 1, 3].includes(value.type as number) || typeof value.data !== "string" ||
      !value.data.trim() || value.data.length > 4000)
    throw new LegacyProviderFailure("INVALID_REQUEST_BODY", 400);
  return { data: value.data, type: value.type as LegacyImageRequest["type"] };
}

export async function searchLegacyImages(
  value: unknown, signal: AbortSignal, settings: ImageSearchSettings = {},
): Promise<string | null | string[]> {
  const request = parseLegacyImageRequest(value);
  const hits = await createImageSearchProvider(settings).search(request.data, request.type === 1 ? 3 : 1, signal);
  if (request.type === 1) return hits.map((hit) => hit.thumbnailUrl).filter((url): url is string => url !== null);
  return hits[0]?.url ?? null;
}
