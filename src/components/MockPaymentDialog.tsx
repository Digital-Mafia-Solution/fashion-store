"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, CreditCard, ShieldCheck } from "lucide-react"; // Removed AlertCircle

interface MockPaymentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  onConfirm: () => void;
}

// Define specific error shape
type PaymentErrors = {
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
};

export function MockPaymentDialog({ open, onOpenChange, amount, onConfirm }: MockPaymentProps) {
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<"input" | "processing" | "success">("input");

  // Form State
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [errors, setErrors] = useState<PaymentErrors>({});

  // ... (handleCardNumberChange and handleExpiryChange remain the same) ...
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
    setCardNumber(formatted.substring(0, 19));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "");
    if (raw.length >= 2) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setExpiry(raw.substring(0, 5));
  };

  const validate = () => {
    // FIX: Typed errors object instead of 'any'
    const newErrors: PaymentErrors = {};
    
    if (cardNumber.replace(/\s/g, "").length < 16) {
      newErrors.cardNumber = "Invalid card number length";
    }

    if (expiry.length === 5) {
      const [mm, yy] = expiry.split("/").map(Number);
      const now = new Date();
      const currentYear = Number(now.getFullYear().toString().slice(-2));
      const currentMonth = now.getMonth() + 1;

      if (mm < 1 || mm > 12) newErrors.expiry = "Invalid month";
      if (yy < currentYear || (yy === currentYear && mm < currentMonth)) {
        newErrors.expiry = "Card expired";
      }
    } else {
      newErrors.expiry = "Invalid format";
    }

    if (cvv.length < 3) newErrors.cvv = "Invalid CVV";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setProcessing(true);
    setStep("processing");

    await new Promise((resolve) => setTimeout(resolve, 2500));

    setStep("success");
    setTimeout(() => {
      onConfirm();
      setProcessing(false);
      setStep("input");
      setCardNumber("");
      setExpiry("");
      setCvv("");
      setCardName("");
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !processing && onOpenChange(val)}>
      <DialogContent className="sm:max-w-md bg-background text-foreground border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            Secure Payment
          </DialogTitle>
          <DialogDescription>
            Total to pay: <span className="font-bold text-foreground">R {amount.toFixed(2)}</span>
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
                  onChange={handleCardNumberChange} 
                  required 
                  className={errors.cardNumber ? "border-red-500 pr-10" : "pr-10"}
                />
                <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {errors.cardNumber && <p className="text-xs text-red-500">{errors.cardNumber}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input 
                  placeholder="MM/YY" 
                  value={expiry} 
                  onChange={handleExpiryChange} 
                  required 
                  className={errors.expiry ? "border-red-500" : ""}
                />
                {errors.expiry && <p className="text-xs text-red-500">{errors.expiry}</p>}
              </div>
              <div className="space-y-2">
                <Label>CVV</Label>
                <div className="relative">
                  <Input 
                    placeholder="123" 
                    value={cvv} 
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} 
                    required 
                    maxLength={4}
                    type="password"
                    className={errors.cvv ? "border-red-500" : ""}
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full mt-4" size="lg">
              Pay R {amount.toFixed(2)}
            </Button>
            
            <div className="flex justify-center gap-2 items-center text-xs text-muted-foreground mt-2">
                <Lock className="w-3 h-3" />
                <span>256-bit SSL Encrypted</span>
            </div>
          </form>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="font-medium text-lg">Contacting Bank...</p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold">Approved</h3>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}