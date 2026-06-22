import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const password = process.env.APP_ACCESS_PASSWORD;
  if (!password) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Configura APP_ACCESS_PASSWORD para habilitar el espacio privado.", { status: 503 });
    }
    return NextResponse.next();
  }

  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Basic ")) {
    try {
      const [user, candidate] = atob(authorization.slice(6)).split(":");
      if (user === (process.env.APP_ACCESS_USER || "cluster") && candidate === password) {
        return NextResponse.next();
      }
    } catch {
      // Invalid credentials fall through to the challenge.
    }
  }

  return new NextResponse("Acceso restringido", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Cluster Workspace"' },
  });
}

export const config = {
  matcher: ["/dashboard/:path*", "/builder/:path*", "/api/sites/:path*", "/api/ai/:path*"],
};
