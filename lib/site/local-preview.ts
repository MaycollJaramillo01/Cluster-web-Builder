const LOCAL_PREVIEW_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export function isLocalPreviewHost(host: string | null | undefined) {
  const value = (host ?? "").trim().toLowerCase();
  if (!value) return false;

  if (value.startsWith("[")) {
    const closingBracket = value.indexOf("]");
    return closingBracket > 1 && LOCAL_PREVIEW_HOSTS.has(value.slice(1, closingBracket));
  }

  // ponytail: the preview only needs the three loopback host forms, not a URL parser.
  return LOCAL_PREVIEW_HOSTS.has(value.split(":", 1)[0]);
}

export function isLocalPreviewRequest(host: string | null | undefined, environment = process.env.NODE_ENV) {
  return environment === "development" && isLocalPreviewHost(host);
}
