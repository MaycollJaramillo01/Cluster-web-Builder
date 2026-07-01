import { NextRequest, NextResponse } from "next/server";

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
  if (request.nextUrl.pathname !== "/") return NextResponse.next();
  const host = request.headers.get("host")?.split(":")[0] || "";
  if (root && host.endsWith(`.${root}`)) {
    const slug = host.slice(0, -(root.length + 1));
    if (slug && !slug.includes(".")) return NextResponse.rewrite(new URL(`/s/${slug}`, request.url));
  }
  let appHost = "localhost";
  try { if (process.env.NEXT_PUBLIC_APP_URL) appHost = new URL(process.env.NEXT_PUBLIC_APP_URL).hostname; } catch { /* Keep localhost for placeholder values. */ }
  const vercelHost = process.env.VERCEL_URL;
  if (host && host !== appHost && host !== vercelHost && !host.endsWith(".vercel.app") && !isDevHost(host)) {
    return NextResponse.rewrite(new URL(`/d/${encodeURIComponent(host)}`, request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next|favicon.ico|robots.txt|sitemap.xml).*)"] };
