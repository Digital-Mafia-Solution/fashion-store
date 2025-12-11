import { NextResponse } from "next/server";

type CacheEntry = { breached: boolean; count?: number; expiresAt: number };

const cache = new Map<string, CacheEntry>();
const TTL = 1000 * 60 * 60 * 24; // 24 hours

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prefix = String(body?.prefix || "").toUpperCase();
    const suffix = String(body?.suffix || "").toUpperCase();

    if (!/^[0-9A-F]{5}$/.test(prefix) || !/^[0-9A-F]+$/.test(suffix)) {
      return NextResponse.json({ error: "Invalid prefix/suffix" }, { status: 400 });
    }

    const key = `${prefix}:${suffix}`;
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({ breached: cached.breached, count: cached.count });
    }

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!res.ok) {
      // Fail open if HIBP is unavailable
      return NextResponse.json({ breached: false });
    }

    const text = await res.text();
    // Response lines: SUFFIX:COUNT
    const lines = text.split("\n");
    let found = false;
    let foundCount: number | undefined = undefined;
    for (const line of lines) {
      const [suf, countStr] = line.split(":");
      if (!suf) continue;
      if (suf.trim().toUpperCase() === suffix) {
        found = true;
        foundCount = Number((countStr || "0").trim());
        break;
      }
    }

    cache.set(key, { breached: found, count: foundCount, expiresAt: Date.now() + TTL });

    return NextResponse.json({ breached: found, count: foundCount });
  } catch (err) {
    console.error("/api/check-breach error", err);
    return NextResponse.json({ breached: false });
  }
}
