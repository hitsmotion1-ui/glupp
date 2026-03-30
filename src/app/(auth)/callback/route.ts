import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  const supabase = await createClient();

  // PKCE flow — échange un code pour une session
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (type === "recovery") {
        return NextResponse.redirect(new URL("/reset-password", requestUrl.origin));
      }
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // Token hash flow (reset password, email confirmation)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "recovery" | "email" | "signup",
    });

    if (!error) {
      if (type === "recovery") {
        return NextResponse.redirect(new URL("/reset-password", requestUrl.origin));
      }
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // Erreur — rediriger vers login avec message
  return NextResponse.redirect(
    new URL("/login?error=auth_callback_failed", requestUrl.origin)
  );
}
