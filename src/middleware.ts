import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_PREFIX = "/auth";
const DEFAULT_REDIRECT = "/dashboard";
const LOGIN_PAGE = "/auth/login";

function getJwtExp(accessToken: string): number | null {
  // JWT: header.payload.signature (payload base64url → JSON com "exp" em segundos)
  const parts = accessToken.split(".");
  if (parts.length < 2) return null;

  try {
    const payloadB64Url = parts[1];
    const payloadB64 = payloadB64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = payloadB64.padEnd(
      payloadB64.length + ((4 - (payloadB64.length % 4)) % 4),
      "=",
    );
    const json = JSON.parse(atob(padded)) as {
      exp?: unknown;
    };
    return typeof json.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;
  const exp = accessToken ? getJwtExp(accessToken) : null;
  const isTokenExpired =
    typeof exp === "number" ? Date.now() / 1000 >= exp : false;
  const isLoggedIn = !!accessToken && !isTokenExpired;

  const isAuthRoute = pathname.startsWith(AUTH_PREFIX);

  // Rota raiz → redireciona conforme autenticação
  if (pathname === "/") {
    const target = isLoggedIn ? DEFAULT_REDIRECT : LOGIN_PAGE;
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Se está logado e tenta acessar rota de auth → redireciona pro dashboard
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL(DEFAULT_REDIRECT, request.url));
  }

  // Qualquer rota fora de /auth exige autenticação
  if (!isLoggedIn && !isAuthRoute) {
    const res = NextResponse.redirect(new URL(LOGIN_PAGE, request.url));
    // Se chegou aqui com token expirado, limpa cookies para não “parecer logado”
    res.cookies.delete("access_token");
    res.cookies.delete("refresh_token");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|_next/data|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
