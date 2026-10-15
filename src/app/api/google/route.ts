import { NextResponse } from "next/server";
import { authorizeLegacyProvider, legacyProviderError } from "@/server/legacyProviderGuard";
import { searchLegacyImages } from "@/server/imageSearch";

export async function POST(req: Request) {
  let permit: Awaited<ReturnType<typeof authorizeLegacyProvider>>;
  try { permit = await authorizeLegacyProvider(req, "IMAGE"); } catch (error) { return legacyProviderError(error); }
  try {
    return NextResponse.json(await searchLegacyImages(await req.json(), permit.signal));
  } catch (error) {
    return legacyProviderError(error);
  } finally {
    await permit.release();
  }
}
