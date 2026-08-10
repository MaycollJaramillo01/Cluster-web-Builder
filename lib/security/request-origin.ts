const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CSRF_EXEMPT_PATHS = [
  /^\/api\/billing\/webhook\/?$/,
  /^\/api\/public\/sites\/[^/]+\/leads\/?$/,
];

type RequestOriginSource = Pick<Request, "headers" | "method" | "url">;

function normalizedOrigin(value: string | null | undefined): string | null {
  if (!value || value === "null") return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function requestOrigins(request: RequestOriginSource): Set<string> {
  const origins = new Set<string>();
  const add = (value: string | null | undefined) => {
    const origin = normalizedOrigin(value);
    if (origin) origins.add(origin);
  };

  const requestUrl = new URL(request.url);
  add(request.url);
  const host = request.headers.get("host");
  const protocol = requestUrl.protocol.replace(":", "");
  if (host) add(`${protocol}://${host}`);
  add(process.env.NEXT_PUBLIC_APP_URL);
  if (process.env.VERCEL_URL) add(`https://${process.env.VERCEL_URL}`);
  return origins;
}

export function isCsrfExemptPath(pathname: string): boolean {
  return CSRF_EXEMPT_PATHS.some((pattern) => pattern.test(pathname));
}

/**
 * Validates browser mutation origins while preserving non-browser API clients.
 * Browsers cannot forge Origin/Sec-Fetch-Site, which makes this an effective
 * defense for cookie-authenticated endpoints without issuing a separate token.
 */
export function hasTrustedMutationOrigin(request: RequestOriginSource): boolean {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return true;

  const allowed = requestOrigins(request);
  const originHeader = request.headers.get("origin");
  if (originHeader !== null) {
    const origin = normalizedOrigin(originHeader);
    return origin !== null && allowed.has(origin);
  }

  const refererHeader = request.headers.get("referer");
  if (refererHeader !== null) {
    const referer = normalizedOrigin(refererHeader);
    return referer !== null && allowed.has(referer);
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite !== null) return fetchSite === "same-origin" || fetchSite === "none";

  // Web browsers send at least one signal above for unsafe cross-site requests.
  // Headerless server-to-server clients remain supported.
  return true;
}
