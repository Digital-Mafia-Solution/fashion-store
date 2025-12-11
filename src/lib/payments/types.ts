export type PaymentMethodId = "card" | "paypal" | "eft" | "ozow" | "snapscan";

export type PaymentResult = {
  success: boolean;
  transactionId?: string;
  message?: string;
  raw?: unknown;
};

export interface PaymentGateway {
  id: PaymentMethodId;
  name: string;
  description?: string;
  // amount is in cents (or minor units) depending on your app; here use number
  init: (options?: Record<string, unknown>) => Promise<void> | void;
  // processPayment receives amount and metadata, returns PaymentResult
  processPayment: (amount: number, metadata?: Record<string, unknown>) => Promise<PaymentResult>;
  // optional teardown
  teardown?: () => Promise<void> | void;
}
