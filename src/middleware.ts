import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // 👈 On laisse passer librement les pages légales
  if (request.nextUrl.pathname.startsWith("/legal")) {
    return NextResponse.next();
  }

  // 👈 On laisse passer les API push (appelées par pg_net depuis Supabase)
  if (request.nextUrl.pathname.startsWith("/api/push/")) {
    return NextResponse.next();
  }

  // 👈 Intercepter les codes d'auth qui arrivent sur /login (Supabase PKCE flow)
  if (request.nextUrl.pathname === "/login" && request.nextUrl.searchParams.has("code")) {
    const code = request.nextUrl.searchParams.get("code");
    const callbackUrl = new URL("/auth/callback", request.url);
    callbackUrl.searchParams.set("code", code!);
    callbackUrl.searchParams.set("type", "recovery");
    callbackUrl.searchParams.set("next", "/reset-password");
    return NextResponse.redirect(callbackUrl);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
