/** The HTTP Host is the browser target; Next may rewrite req.url to its internal hostname.
 * Never trust forwarded-host headers or equate localhost with 127.0.0.1. */
export function isSameOriginRequest(req: Request): boolean {
  try {
    const internal = new URL(req.url);
    const host = req.headers.get('host') ?? internal.host;
    if (!host || /[\s,/@\\#?]/.test(host)) return false;
    const target = new URL(`${internal.protocol}//${host}`);
    if (!['http:', 'https:'].includes(target.protocol) || target.host.toLowerCase() !== host.toLowerCase()) return false;
    return req.headers.get('origin') === target.origin;
  } catch { return false; }
}
