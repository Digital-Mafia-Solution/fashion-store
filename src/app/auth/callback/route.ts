import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  // Get the 'next' param or default to root
  const next = requestUrl.searchParams.get("next") || "/";

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Prefer an explicit site URL (set via env) so redirects go to the
  // deployed site even if the incoming request origin is localhost.
  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;
  const redirectTo = new URL(next, siteOrigin);

  if (type === "recovery" || next.includes("update-password")) {
    redirectTo.searchParams.set("reset_required", "true");
  }

  // Redirect to the specified next page (e.g., /update-password)
  return NextResponse.redirect(redirectTo);
}