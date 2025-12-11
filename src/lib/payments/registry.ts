import type { PaymentGateway, PaymentMethodId } from "./types";

const registry = new Map<PaymentMethodId, PaymentGateway>();

export function registerGateway(gateway: PaymentGateway) {
  registry.set(gateway.id, gateway);
}

export function getGateway(id: PaymentMethodId): PaymentGateway | undefined {
  return registry.get(id);
}

export function listGateways(): PaymentGateway[] {
  return Array.from(registry.values());
}
