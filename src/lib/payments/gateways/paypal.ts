import type { PaymentGateway } from "../types";

const mockDelay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const paypalGateway: PaymentGateway = {
  id: "paypal",
  name: "PayPal (Mock)",
  description: "Simulates PayPal checkout",
  init: async () => {
    await mockDelay(150);
  },
  processPayment: async (amount) => {
    await mockDelay(1000);
    // simulate success 90% of time
    const ok = Math.random() > 0.1;
    return {
      success: ok,
      transactionId: ok ? `paypal_tx_${Date.now()}` : undefined,
      message: ok ? `PayPal mock success for ${amount}` : `PayPal mock failed`,
    };
  },
};

export default paypalGateway;
