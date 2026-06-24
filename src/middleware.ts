import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/_next", "/favicon", "/api/health"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const expected = process.env.LOBBYCAT_PASSWORD;
  if (!expected) return NextResponse.next(); // no gate configured = open

  const cookie = req.cookies.get("lc_auth")?.value;
  if (cookie && cookie === expected) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
