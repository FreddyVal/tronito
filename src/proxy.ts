import { NextResponse, type NextRequest } from "next/server";

/**
 * Auth simple vía env para /admin y /api/admin/*. Basic Auth es suficiente
 * ("auth simple vía env" del spec): sin estado, sin sesiones, sin cookies.
 */
export function proxy(request: NextRequest) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;

  if (!user || !pass) {
    return new NextResponse("Panel de admin no configurado (falta ADMIN_USER/ADMIN_PASSWORD)", {
      status: 500,
    });
  }

  const auth = request.headers.get("authorization");
  if (auth) {
    const [scheme, encoded] = auth.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = Buffer.from(encoded, "base64").toString("utf-8");
      const separatorIndex = decoded.indexOf(":");
      const givenUser = decoded.slice(0, separatorIndex);
      const givenPass = decoded.slice(separatorIndex + 1);
      if (givenUser === user && givenPass === pass) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Autenticación requerida", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Tronito Admin"' },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
