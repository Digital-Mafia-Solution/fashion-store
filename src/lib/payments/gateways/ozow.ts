import type { PaymentGateway } from "../types";
const mockDelay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const ozowGateway: PaymentGateway = {
  id: "ozow",
  name: "Ozow (Mock)",
  description: "Simulates Ozow instant EFT",
  init: async () => {
    await mockDelay(100);
  },
  processPayment: async (amount) => {
    await mockDelay(900);
    const ok = Math.random() > 0.05;
    return {
      success: ok,
      transactionId: ok ? `ozow_tx_${Date.now()}` : undefined,
      message: ok ? `Ozow mock success for ${amount}` : `Ozow mock failed`,
    };
  },
};

export default ozowGateway;
