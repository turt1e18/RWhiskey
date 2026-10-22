import "server-only";
import { NextResponse } from "next/server";

export class LegacyProviderFailure extends Error {
  constructor(public readonly code: string, public readonly status: number) { super(code); }
}
export function legacyProviderError(error: unknown) {
  const known = error instanceof LegacyProviderFailure;
  return NextResponse.json({ code: known ? error.code : "PROVIDER_UNAVAILABLE" }, { status: known ? error.status : 503 });
}

/** All authorization is verified server-side. No caller-supplied permit or usage report is trusted. */
export async function authorizeLegacyProvider(req: Request, purpose: "GEMINI" | "IMAGE") {
  const timer = new AbortController();
  const timeout = setTimeout(() => timer.abort(), 20_000);
  let lease: string | undefined;
  const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL ||
    (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8080" : "");
  const headers = new Headers({ "Content-Type": "application/json" });
  if (req.headers.get("cookie")) headers.set("Cookie", req.headers.get("cookie")!);
  if (req.headers.get("x-xsrf-token")) headers.set("X-XSRF-TOKEN", req.headers.get("x-xsrf-token")!);
  const release = async () => {
    clearTimeout(timeout);
    req.signal.removeEventListener("abort", disconnected);
    if (lease) {
      try {
        await fetch(base.replace(/\/$/, "") + "/api/recommendations/legacy/admission/" + lease,
          { method: "DELETE", headers, signal: AbortSignal.timeout(1000), cache: "no-store", redirect: "error" });
      } catch { /* Lease expires if BE is unavailable. No allowance is refunded. */ }
    }
  };
  const disconnected = () => timer.abort();
  req.signal.addEventListener("abort", disconnected, { once: true });
  if (req.signal.aborted) timer.abort();
  try {
    if (!base) throw new LegacyProviderFailure("ADMISSION_UNAVAILABLE", 503);
    if (req.headers.get("origin") !== new URL(req.url).origin ||
        !req.headers.get("content-type")?.startsWith("application/json"))
      throw new LegacyProviderFailure("AUTH_REQUEST_REJECTED", 403);
    if (!headers.has("Cookie")) throw new LegacyProviderFailure("AUTH_REQUIRED", 401);
    const reader = req.clone().body?.getReader();
    if (!reader) throw new LegacyProviderFailure("INVALID_REQUEST_BODY", 400);
    let size = 0;
    const chunks: Uint8Array[] = [];
    const stopReading = () => { void reader.cancel(); };
    timer.signal.addEventListener("abort", stopReading, { once: true });
    try {
      while (true) {
        const chunk = await reader.read();
        if (timer.signal.aborted) throw new LegacyProviderFailure("REQUEST_DEADLINE_EXCEEDED", 503);
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > 32_768) { void reader.cancel(); throw new LegacyProviderFailure("INVALID_REQUEST_BODY", 413); }
        chunks.push(chunk.value);
      }
    } finally {
      timer.signal.removeEventListener("abort", stopReading);
      reader.releaseLock();
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    let body: unknown;
    try { body = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new LegacyProviderFailure("INVALID_REQUEST_BODY", 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new LegacyProviderFailure("INVALID_REQUEST_BODY", 400);
    const input = body as Record<string, unknown>;
    if (input.type !== 0 && input.type !== 1 && !(purpose === "IMAGE" && input.type === 3)) throw new LegacyProviderFailure("INVALID_REQUEST_BODY", 400);
    if (purpose === "IMAGE" || input.type === 0) {
      if (typeof input.data !== "string" || input.data.length > 4000) throw new LegacyProviderFailure("INVALID_REQUEST_BODY", 400);
    } else if (!input.data || typeof input.data !== "object" || Array.isArray(input.data)) {
      throw new LegacyProviderFailure("INVALID_REQUEST_BODY", 400);
    }
    const response = await fetch(base.replace(/\/$/, "") + "/api/recommendations/legacy/admission",
      { method: "POST", headers, body: JSON.stringify({ purpose }), signal: timer.signal, cache: "no-store", redirect: "error" });
    if (!response.ok) {
      const failure: unknown = await response.json().catch(() => null);
      const code = failure && typeof failure === "object" && "code" in failure && typeof failure.code === "string" ? failure.code : "ADMISSION_UNAVAILABLE";
      throw new LegacyProviderFailure(code, [400, 401, 403, 409, 429].includes(response.status) ? response.status : 503);
    }
    const allowed: unknown = await response.json();
    if (!allowed || typeof allowed !== "object" || !("leaseToken" in allowed) ||
        typeof allowed.leaseToken !== "string" || !/^[a-f0-9-]{36}$/.test(allowed.leaseToken))
      throw new LegacyProviderFailure("ADMISSION_UNAVAILABLE", 503);
    lease = allowed.leaseToken;
    return { signal: timer.signal, release };
  } catch (error) {
    await release();
    if (timer.signal.aborted) throw new LegacyProviderFailure("REQUEST_DEADLINE_EXCEEDED", 503);
    throw error;
  }
}
