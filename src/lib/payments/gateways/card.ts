import type { PaymentGateway } from "../types";

const mockDelay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const cardGateway: PaymentGateway = {
  id: "card",
  name: "Credit / Debit Card (Mock)",
  description: "Simulates a card payment flow",
  init: async () => {
    // simulate loading SDK
    await mockDelay(200);
  },
  processPayment: async (amount) => {
    await mockDelay(800);
    // simulate success
    return {
      success: true,
      transactionId: `card_tx_${Date.now()}`,
      message: `Mock card charged ${amount}`,
    };
  },
};

export default cardGateway;
