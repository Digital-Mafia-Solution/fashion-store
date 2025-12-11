import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || "";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }

    // normalize email to avoid case/whitespace mismatches
    const normalizedEmail = String(email).trim().toLowerCase();

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      // Do not allow progression if service key isn't configured - return explicit error
      return NextResponse.json({ error: "no_service_key" }, { status: 503 });
    }

    const url = `${SUPABASE_URL.replace(/\/$/, "")}/auth/v1/admin/users?email=${encodeURIComponent(
      normalizedEmail
    )}`;

    const r = await fetch(url, {
      headers: {
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
      },
    });

    if (!r.ok) {
      return NextResponse.json({ error: "admin_failed", status: r.status }, { status: 502 });
    }

    const json = await r.json();

    // Admin endpoint may return either an array or an object with `users: [...]`.
    const candidates: unknown[] = Array.isArray(json)
      ? (json as unknown[])
      : Array.isArray((json as { users?: unknown[] }).users)
      ? (json as { users?: unknown[] }).users!
      : [];

    // Normalize the email we queried
    const normalized = String(email).trim().toLowerCase();

    // Try to find a user that matches the normalized email in common fields
    const matched = candidates.find((u) => {
      const obj = u as { email?: unknown; user_metadata?: { email?: unknown } };
      const e = String(obj.email ?? obj.user_metadata?.email ?? "").trim().toLowerCase();
      return e === normalized;
    }) as unknown | undefined;

    const exists = Boolean(matched);
    // Return only canonical result to the client
    return NextResponse.json({ exists });
  } catch (err) {
    console.error("/api/check-email error", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
