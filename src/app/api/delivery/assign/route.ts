import { NextResponse } from "next/server";
import { registry } from "@/lib/delivery/providers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const providerId = String(body?.provider_id || "");
    const address = String(body?.address || "");
    const weight = Number(body?.weight_grams ?? 0);
    const orderId = body?.order_id;

    if (!providerId) {
      return NextResponse.json({ error: "missing_provider_id" }, { status: 400 });
    }
    if (!weight || Number.isNaN(weight)) {
      return NextResponse.json({ error: "invalid_weight" }, { status: 400 });
    }

    // Delegate to registry to create (mock) shipment
    const assignment = await registry.assignShipment({
      providerId,
      address,
      weight_grams: weight,
      orderId,
      items: Array.isArray(body?.items) ? body.items : undefined,
    });

    return NextResponse.json({ assignment });
  } catch (err) {
    console.error("/api/delivery/assign error", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
