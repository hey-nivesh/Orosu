import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const returnTo = searchParams.get("returnTo") || searchParams.get("next") || "/dashboard";

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: any; value: any; options: any; }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore if cookies cannot be modified in certain contexts
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.session?.user) {
      const user = data.session.user;
      const session = data.session as any;

      // 1. Ensure user profile row exists
      try {
        await supabase.from("profiles").upsert(
          {
            id: user.id,
            email: user.email,
            full_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "User",
            avatar_url:
              user.user_metadata?.avatar_url ||
              user.user_metadata?.picture ||
              null,
          },
          { onConflict: "id", ignoreDuplicates: true }
        );
      } catch (err) {
        console.error("Error creating profile during Google callback:", err);
      }

      // 2. If Google OAuth returned provider tokens, store them in google_oauth_tokens
      const providerToken = session?.provider_token;
      const providerRefreshToken = session?.provider_refresh_token;

      if (providerToken) {
        try {
          await supabase.from("google_oauth_tokens").upsert(
            {
              user_id: user.id,
              access_token: providerToken,
              refresh_token: providerRefreshToken || null,
              expiry_date: Date.now() + 3500 * 1000,
              scope: "openid email profile https://www.googleapis.com/auth/gmail.compose",
              token_type: "Bearer",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
        } catch (tokenErr) {
          console.error("Error saving google_oauth_tokens from provider session:", tokenErr);
        }
      }

      // Determine redirect URL
      const isLocalEnv = process.env.NODE_ENV === "development";
      const forwardedHost = request.headers.get("x-forwarded-host");
      const baseOrigin = isLocalEnv ? origin : forwardedHost ? `https://${forwardedHost}` : origin;

      const response = NextResponse.redirect(`${baseOrigin}${returnTo}`);

      // Forward all cookies to the redirect response
      try {
        cookieStore.getAll().forEach((cookie) => {
          response.cookies.set(cookie.name, cookie.value);
        });
      } catch (cookieErr) {
        console.error("Error setting cookies on response:", cookieErr);
      }

      return response;
    }
  }

  // If code exchange failed or no code, redirect back to login
  return NextResponse.redirect(`${origin}/login?error=oauth_error`);
}
