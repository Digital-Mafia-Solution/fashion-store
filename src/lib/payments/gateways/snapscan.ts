import type { PaymentGateway } from "../types";
const mockDelay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const snapscanGateway: PaymentGateway = {
  id: "snapscan",
  name: "SnapScan (Mock)",
  description: "Simulates SnapScan QR payment",
  init: async () => {
    await mockDelay(120);
  },
  processPayment: async (amount) => {
    await mockDelay(700);
    const ok = Math.random() > 0.05;
    return {
      success: ok,
      transactionId: ok ? `snapscan_tx_${Date.now()}` : undefined,
      message: ok ? `SnapScan mock success for ${amount}` : `SnapScan mock failed`,
    };
  },
};

export default snapscanGateway;
