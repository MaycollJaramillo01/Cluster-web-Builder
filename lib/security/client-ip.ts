import { isIP } from "node:net";

type HeaderSource = Pick<Headers, "get">;

type ProxyTrust = {
  vercel: boolean;
  trustedProxy: boolean;
};

function firstValidIp(value: string | null): string | null {
  const candidate = value?.split(",", 1)[0]?.trim();
  return candidate && isIP(candidate) ? candidate : null;
}

/**
 * Returns an IP only from infrastructure configured as trusted. Vercel
 * overwrites x-forwarded-for; self-hosted proxies must be opted in explicitly.
 */
export function clientIpFromHeaders(
  headers: HeaderSource,
  trust: ProxyTrust = {
    vercel: process.env.VERCEL === "1",
    trustedProxy: process.env.TRUST_PROXY_HEADERS === "true",
  },
): string {
  if (trust.vercel) {
    return firstValidIp(headers.get("x-forwarded-for")) ?? "unknown";
  }

  if (trust.trustedProxy) {
    return firstValidIp(headers.get("x-real-ip"))
      ?? firstValidIp(headers.get("x-forwarded-for"))
      ?? "unknown";
  }

  return "local";
}

export function getClientIp(request: Pick<Request, "headers">): string {
  return clientIpFromHeaders(request.headers);
}
