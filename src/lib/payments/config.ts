import type { PaymentMethodId } from "./types";

export const AVAILABLE_METHODS: PaymentMethodId[] = [
  "card",
  "paypal",
  "eft",
  "ozow",
  "snapscan",
];

export const DEFAULT_METHOD: PaymentMethodId = "card";

export const MOCK_MODE = true; // when true, use mock gateways; set false to use real gateways
