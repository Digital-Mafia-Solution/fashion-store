// Lightweight delivery provider registry + mock adapters.
// Purpose: provide a minimal, configurable interface for getting quotes
// and creating shipments. The implementation below is mocked and intentionally
// simple — swapping to a real provider means replacing the adapter functions
// with HTTP calls to the provider and using provider-specific credentials from
// environment variables.

import crypto from "crypto";

export type ProviderQuote = {
  id: string;
  name: string;
  service: string;
  fee: number; // in ZAR
  eta_days?: number;
  metadata?: Record<string, unknown>;
};

export type ShipmentAssignment = {
  provider_shipment_id: string;
  tracking_url?: string;
  cost: number;
  assigned_at: string;
  eta_days?: number;
};

// Providers configuration. In production you can replace this with real
// provider adapters or populate from env vars.
const PROVIDERS = [
  {
    id: "mock_fast",
    name: "MockExpress",
    base: Number(process.env.MOCK_DELIVERY_BASE_FAST ?? 40),
    per_kg: Number(process.env.MOCK_DELIVERY_PER_KG_FAST ?? 25),
    eta_days: 1,
    trackingUrlTemplate: process.env.MOCK_DELIVERY_TRACKING_URL_FAST ??
      "https://tracking.mockexpress.local/{trackingId}",
  },
  {
    id: "mock_economy",
    name: "MockEconomy",
    base: Number(process.env.MOCK_DELIVERY_BASE_ECON ?? 20),
    per_kg: Number(process.env.MOCK_DELIVERY_PER_KG_ECON ?? 12),
    eta_days: 3,
    trackingUrlTemplate: process.env.MOCK_DELIVERY_TRACKING_URL_ECON ??
      "https://tracking.mockeconomy.local/{trackingId}",
  },
];

// Compute fee from weight in grams. Simple linear formula: fee = base + per_kg * ceil(weight_kg)
function computeFee(base: number, perKg: number, weightGrams: number) {
  const weightKg = Math.max(0.001, weightGrams / 1000);
  const kgCeil = Math.ceil(weightKg);
  return Math.round((base + perKg * kgCeil) * 100) / 100;
}

export async function getProviderQuotes(opts: {
  address?: string;
  weight_grams: number;
  items?: Array<{ id: string; qty: number }>; // optional for provider logic
}) {
  // In a real implementation you could inspect `address` for zone-based pricing
  // and call multiple provider APIs. Here we return mocked quotes deterministically.
  const { weight_grams } = opts;

  const quotes: ProviderQuote[] = PROVIDERS.map((p) => ({
    id: p.id,
    name: p.name,
    service: p.id === "mock_fast" ? "express" : "standard",
    fee: computeFee(p.base, p.per_kg, weight_grams),
    eta_days: p.eta_days,
    metadata: { mock: true },
  }));

  // Optionally sort by fee
  quotes.sort((a, b) => a.fee - b.fee);
  return quotes;
}

// Assign a shipment with a provider (mock). Returns tracking info and cost.
export async function assignShipment(opts: {
  providerId: string;
  address: string;
  weight_grams: number;
  orderId?: string;
  items?: Array<{ id: string; qty: number }>;
}): Promise<ShipmentAssignment> {
  const provider = PROVIDERS.find((p) => p.id === opts.providerId);
  if (!provider) throw new Error("Unknown provider");

  // Compute cost same as quote
  const cost = computeFee(provider.base, provider.per_kg, opts.weight_grams);

  // Generate a mock tracking id
  const trackingId = `${provider.id.toUpperCase()}-${crypto
    .randomBytes(6)
    .toString("hex")}`;

  const tracking_url = provider.trackingUrlTemplate.replace(
    "{trackingId}",
    trackingId
  );

  // In real provider adapters, call their create-shipment API here and
  // return provider_shipment_id, tracking_url, assigned_at, cost, etc.
  return {
    provider_shipment_id: trackingId,
    tracking_url,
    cost,
    assigned_at: new Date().toISOString(),
    eta_days: provider.eta_days,
  };
}

// Exported for potential direct consumption by server code
export const registry = {
  getProviderQuotes,
  assignShipment,
};

export default PROVIDERS;
