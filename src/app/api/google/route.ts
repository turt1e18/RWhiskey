import axios from "axios";
import { NextResponse } from "next/server";
import { authorizeLegacyProvider, legacyProviderError } from "@/server/legacyProviderGuard";

const ACCESS_KEY = process.env.GOOGLESEARCH_ACCESS_KEY;
const ACCESS_KEY2 = process.env.GOOGLESEARCHID_ACCESS_KEY;

export async function POST(req: Request) {
  let permit: Awaited<ReturnType<typeof authorizeLegacyProvider>>;
  try { permit = await authorizeLegacyProvider(req, "IMAGE"); } catch (error) { return legacyProviderError(error); }
  try {
    const body = await req.json();
    if (!ACCESS_KEY || !ACCESS_KEY2) return NextResponse.json({ code: "SEARCH_NOT_CONFIGURED" }, { status: 503 });
    const response = await axios.get("https://customsearch.googleapis.com/customsearch/v1", {
      params: { q: body.data, searchType: "image", num: body.type === 1 ? 3 : 1, key: ACCESS_KEY, cx: ACCESS_KEY2 },
      signal: permit.signal, timeout: 5_000, maxRedirects: 0, maxContentLength: 131_072, maxBodyLength: 32_768,
    });
    const items: unknown = response.data.items;
    const safe = (value: unknown): value is string => {
      if (typeof value !== "string") return false;
      try { return new URL(value).protocol === "https:"; } catch { return false; }
    };
    const results = Array.isArray(items) ? items.slice(0, 3) : [];
    if (body.type === 1) return NextResponse.json(results.map((item) => item.image?.thumbnailLink).filter(safe));
    const image: unknown = results[0]?.link;
    return NextResponse.json(safe(image) ? image : null);
  } catch (error) {
    return legacyProviderError(error);
  } finally {
    await permit.release();
  }
}
