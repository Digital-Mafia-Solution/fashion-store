"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, CreditCard, ShieldCheck } from "lucide-react";
// FIX: Removed unused 'toast' import

interface MockPaymentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  onConfirm: () => void;
}

export function MockPaymentDialog({ open, onOpenChange, amount, onConfirm }: MockPaymentProps) {
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<"input" | "processing" | "success">("input");

  // Mock Form State
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setStep("processing");

    // Simulate Payment Gateway Delay (2.5 seconds)
    await new Promise((resolve) => setTimeout(resolve, 2500));

    setStep("success");
    
    // Wait a moment to show success state before closing and triggering order
    setTimeout(() => {
      onConfirm(); // Trigger the actual order creation
      setProcessing(false);
      setStep("input"); // Reset for next time
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !processing && onOpenChange(val)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            Secure Payment
          </DialogTitle>
          <DialogDescription>
            Complete your purchase securely. Total: <span className="font-bold text-foreground">R {amount.toFixed(2)}</span>
          </DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <form onSubmit={handlePay} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Cardholder Name</Label>
              <Input 
                placeholder="J. Doe" 
                value={cardName} 
                onChange={(e) => setCardName(e.target.value)} 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Card Number</Label>
              <div className="relative">
                <Input 
                  placeholder="0000 0000 0000 0000" 
                  value={cardNumber} 
                  onChange={(e) => setCardNumber(e.target.value)} 
                  required 
                  minLength={16}
                  maxLength={19}
                />
                <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input 
                  placeholder="MM/YY" 
                  value={expiry} 
                  onChange={(e) => setExpiry(e.target.value)} 
                  required 
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label>CVV</Label>
                <div className="relative">
                  <Input 
                    placeholder="123" 
                    value={cvv} 
                    onChange={(e) => setCvv(e.target.value)} 
                    required 
                    maxLength={3}
                    type="password"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full mt-4" size="lg">
              Pay R {amount.toFixed(2)}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground mt-2">
              <Lock className="w-3 h-3 inline mr-1" />
              Payments are encrypted and secured.
            </p>
          </form>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="font-medium text-lg">Processing Transaction...</p>
            <p className="text-sm text-muted-foreground">Please do not close this window.</p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold">Payment Approved</h3>
            <p className="text-muted-foreground">Finalizing your order...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}