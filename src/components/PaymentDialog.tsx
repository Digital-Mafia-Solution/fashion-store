"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { List } from "lucide-react";
import { getGateway, listGateways } from "@/lib/payments/registry";
import { registerMocks } from "@/lib/payments/mock-register";
import { MOCK_MODE, DEFAULT_METHOD } from "@/lib/payments/config";
import { toast } from "sonner";
import type { PaymentMethodId } from "@/lib/payments/types";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number; // minor units or app's units
  onSuccess?: (result: { method: PaymentMethodId; result: unknown }) => void;
  // selection-only mode: user selects method and we call onSelect
  mode?: "select" | "pay";
  onSelect?: (method: PaymentMethodId) => void;
  // initial selected method when opening the dialog
  initialMethod?: PaymentMethodId;
}

export function PaymentDialog({
  open,
  onOpenChange,
  amount,
  onSuccess,
  mode = "pay",
  onSelect,
  initialMethod,
}: PaymentDialogProps) {
  const [selected, setSelected] = useState<PaymentMethodId>(
    initialMethod ?? DEFAULT_METHOD
  );
  const [loading, setLoading] = useState(false);
  const [methods, setMethods] = useState<PaymentMethodId[]>([]);

  useEffect(() => {
    if (MOCK_MODE) {
      registerMocks();
    }
    const available = listGateways().map((g) => g.id);
    setMethods(available as PaymentMethodId[]);
    if (!available.includes(selected)) {
      setSelected((available[0] as PaymentMethodId) || DEFAULT_METHOD);
    }
    // only run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep selected in sync when dialog opens or initialMethod changes
  useEffect(() => {
    if (open) {
      setSelected(initialMethod ?? DEFAULT_METHOD);
    }
  }, [open, initialMethod]);

  const handlePay = async () => {
    const gateway = getGateway(selected);
    if (!gateway) return;
    setLoading(true);
    try {
      await gateway.init?.();
      const res = await gateway.processPayment(amount, {});
      setLoading(false);
      if (res.success) {
        if (onSuccess) onSuccess({ method: selected, result: res });
        toast.success(res.message || "Payment successful (mock)");
      } else {
        toast.error(res.message || "Payment failed (mock)");
      }
      onOpenChange(false);
    } catch (e) {
      setLoading(false);
      console.error(e);
      toast.error("Payment failed (mock)");
    }
  };

  const handleSelect = () => {
    if (onSelect) onSelect(selected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <List className="w-5 h-5" /> Select Payment Method
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="text-sm text-muted-foreground">Amount</div>
            <div className="font-bold text-xl">R {amount.toFixed(2)}</div>
          </div>

          <RadioGroup
            value={selected}
            onValueChange={(v) => setSelected(v as PaymentMethodId)}
          >
            <div className="space-y-2">
              {methods.map((m) => {
                const g = getGateway(m as PaymentMethodId)!;
                return (
                  <label
                    key={m}
                    className="flex items-center gap-3 p-3 border rounded-md cursor-pointer"
                  >
                    <RadioGroupItem value={m} id={m} />
                    <div className="flex-1">
                      <div className="font-medium">{g.name}</div>
                      {g.description && (
                        <div className="text-xs text-muted-foreground">
                          {g.description}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </RadioGroup>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={() => (mode === "select" ? handleSelect() : handlePay())}
              disabled={loading}
            >
              {loading
                ? "Processing..."
                : mode === "select"
                ? "Select"
                : "Pay Now"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PaymentDialog;
