import { NextRequest, NextResponse } from "next/server";

import { hasTrustedMutationOrigin, isCsrfExemptPath } from "@/lib/security/request-origin";

function isDevHost(host: string) {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    /^192\.168\./.test(host) ||
    /^10\./.test(host) ||
    /^172\.(1[6-9]|2[0-9]|3[01])\./.test(host)
  );
}

export function proxy(request: NextRequest) {
  const root = process.env.PUBLIC_ROOT_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const host = request.headers.get("host")?.split(":")[0] || "";
  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith("/api/")
    && !isCsrfExemptPath(pathname)
    && !hasTrustedMutationOrigin(request)
  ) {
    return NextResponse.json(
      { error: "Origen de solicitud no permitido." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (root && host.endsWith(`.${root}`)) {
    const slug = host.slice(0, -(root.length + 1));
    if (pathname === "/" && slug && !slug.includes(".")) return NextResponse.rewrite(new URL(`/s/${slug}`, request.url));
  }
  let appHost = "localhost";
  try { if (process.env.NEXT_PUBLIC_APP_URL) appHost = new URL(process.env.NEXT_PUBLIC_APP_URL).hostname; } catch { /* Keep localhost for placeholder values. */ }
  const vercelHost = process.env.VERCEL_URL;
  if (host && host !== appHost && host !== vercelHost && !host.endsWith(".vercel.app") && !isDevHost(host)) {
    if (pathname === "/") return NextResponse.rewrite(new URL(`/d/${encodeURIComponent(host)}`, request.url));
    if (pathname === "/sitemap.xml") return NextResponse.rewrite(new URL(`/d/${encodeURIComponent(host)}/sitemap.xml`, request.url));
    if (pathname === "/robots.txt") return NextResponse.rewrite(new URL(`/d/${encodeURIComponent(host)}/robots.txt`, request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next|favicon.ico).*)"] };
