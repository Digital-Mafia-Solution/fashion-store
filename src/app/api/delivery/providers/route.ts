import { NextResponse } from "next/server";
import { registry } from "@/lib/delivery/providers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const address = String(body?.address || "");
    const weight = Number(body?.weight_grams ?? 0);
    const items = Array.isArray(body?.items) ? body.items : undefined;

    if (!weight || Number.isNaN(weight)) {
      return NextResponse.json({ error: "invalid_weight" }, { status: 400 });
    }

    // Delegate to registry (mockable adapter)
    const quotes = await registry.getProviderQuotes({
      address,
      weight_grams: weight,
      items,
    });

    return NextResponse.json({ providers: quotes });
  } catch (err) {
    console.error("/api/delivery/providers error", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
