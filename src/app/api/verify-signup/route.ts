import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || "";

// Simple cache for HIBP prefix responses to reduce calls
const hibpCache = new Map<string, { text: string; expiresAt: number }>();
const HIBP_TTL = 1000 * 60 * 60 * 24; // 24h

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim();
    const prefix = String(body?.prefix || "").toUpperCase();
    const suffix = String(body?.suffix || "").toUpperCase();

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    if (!/^[0-9A-F]{5}$/.test(prefix) || !/^[0-9A-F]+$/.test(suffix)) {
      return NextResponse.json({ error: "Invalid hash parts" }, { status: 400 });
    }

    // Check if user exists using Supabase Admin endpoint (service role key required)
    let exists = false;
    try {
      if (!SUPABASE_URL || !SERVICE_ROLE) {
        console.warn("Service role key or Supabase URL not configured for verify-signup");
      } else {
        const url = `${SUPABASE_URL.replace(/\/$/, "")}/auth/v1/admin/users?email=${encodeURIComponent(email)}`;
        const r = await fetch(url, {
          headers: {
            apikey: SERVICE_ROLE,
            Authorization: `Bearer ${SERVICE_ROLE}`,
          },
        });
        if (r.ok) {
          const json = await r.json();
          // Admin endpoint may return either an array or an object with `users: [...]`.
          const candidates: unknown[] = Array.isArray(json)
            ? (json as unknown[])
            : Array.isArray((json as { users?: unknown[] }).users)
            ? (json as { users?: unknown[] }).users!
            : [];

          const normalized = String(email).trim().toLowerCase();
          const matched = candidates.find((u) => {
            const obj = u as { email?: unknown; user_metadata?: { email?: unknown } };
            const e = String(obj.email ?? obj.user_metadata?.email ?? "").trim().toLowerCase();
            return e === normalized;
          });
          if (matched) exists = true;
        } else {
          // If admin endpoint fails, log and continue (fail open for user creation check)
          console.warn("verify-signup: admin users lookup failed", r.status);
        }
      }
    } catch (err) {
      console.warn("verify-signup: error checking admin users", err);
    }

    // Check HIBP for breach using prefix/suffix
    let breached = false;
    try {
      const cached = hibpCache.get(prefix);
      let text: string;
      if (cached && cached.expiresAt > Date.now()) {
        text = cached.text;
      } else {
        const r = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
        if (!r.ok) {
          // Fail open if HIBP is unavailable
          return NextResponse.json({ exists, breached: false });
        }
        text = await r.text();
        hibpCache.set(prefix, { text, expiresAt: Date.now() + HIBP_TTL });
      }

      const regex = new RegExp(`^${suffix}:`, "mi");
      breached = regex.test(text);
    } catch (err) {
      console.warn("verify-signup: error checking HIBP", err);
      breached = false;
    }

    return NextResponse.json({ exists, breached });
  } catch (err) {
    console.error("/api/verify-signup error", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
