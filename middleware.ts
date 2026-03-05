import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const AUTH_PREFIX = "/auth"
const DASHBOARD_PREFIX = "/dashboard"
const DEFAULT_REDIRECT = "/dashboard"
const LOGIN_PAGE = "/auth/login"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get("access_token")?.value
  const isLoggedIn = !!accessToken

  const isAuthRoute = pathname.startsWith(AUTH_PREFIX)
  const isDashboardRoute = pathname.startsWith(DASHBOARD_PREFIX)

  // Se está logado e tenta acessar rota de auth → redireciona pro dashboard
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL(DEFAULT_REDIRECT, request.url))
  }

  // Se não está logado e tenta acessar rota protegida → redireciona pro login
  if (!isLoggedIn && isDashboardRoute) {
    return NextResponse.redirect(new URL(LOGIN_PAGE, request.url))
  }

  // Rota raiz → redireciona conforme autenticação
  if (pathname === "/") {
    const target = isLoggedIn ? DEFAULT_REDIRECT : LOGIN_PAGE
    return NextResponse.redirect(new URL(target, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|_next/data|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
