import type { PaymentGateway } from "../types";
const mockDelay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const eftGateway: PaymentGateway = {
  id: "eft",
  name: "EFT (Mock)",
  description: "Simulates bank EFT payment",
  init: async () => {
    await mockDelay(100);
  },
  processPayment: async (amount) => {
    await mockDelay(1500);
    // EFT may be pending
    return {
      success: true,
      transactionId: `eft_tx_${Date.now()}`,
      message: `EFT mock initiated for ${amount} — will settle later`,
    };
  },
};

export default eftGateway;
