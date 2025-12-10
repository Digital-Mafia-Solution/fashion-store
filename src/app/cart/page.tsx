"use client";

import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Trash2,
  Plus,
  Minus,
  Truck,
  Store,
  ChevronRight,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { MockPaymentDialog } from "@/components/MockPaymentDialog";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { z } from "zod";
import { cn } from "@/lib/utils";

interface Location {
  id: string;
  name: string;
  type: string;
  address: string | null;
}

const checkoutSchema = z.object({
  address: z.string().min(10, "Please select a valid address from the list"),
});

// --- STEPS COMPONENT ---
function CheckoutSteps({ currentStep }: { currentStep: number }) {
  const steps = [
    { number: 1, title: "Cart" },
    { number: 2, title: "Delivery" },
    { number: 3, title: "Payment" },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <div className="relative flex justify-between">
        {/* Connector Line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -z-10 -translate-y-1/2" />
        <div
          className="absolute top-1/2 left-0 h-1 bg-primary -z-10 -translate-y-1/2 transition-all duration-300"
          style={{
            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
          }}
        />

        {steps.map((step) => (
          <div
            key={step.number}
            className="flex flex-col items-center bg-background px-2"
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all",
                currentStep >= step.number
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/30 text-muted-foreground bg-background"
              )}
            >
              {currentStep > step.number ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                step.number
              )}
            </div>
            <span
              className={cn(
                "text-xs mt-2 font-medium",
                currentStep >= step.number
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {step.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CartPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } =
    useCart();
  const router = useRouter();

  // --- STATE ---
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [error, setError] = useState("");

  // Persisted Form State
  const [fulfillment, setFulfillment] = useState<"courier" | "pickup">(() => {
    if (typeof window !== "undefined") {
      return (
        (sessionStorage.getItem("cart_fulfillment") as "courier" | "pickup") ||
        "courier"
      );
    }
    return "courier";
  });

  const [selectedLocation, setSelectedLocation] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("cart_location") || "";
    }
    return "";
  });

  const [address, setAddress] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("cart_address") || "";
    }
    return "";
  });

  const [saveAddress, setSaveAddress] = useState(false);

  // --- EFFECTS ---
  useEffect(() => {
    sessionStorage.setItem("cart_fulfillment", fulfillment);
    sessionStorage.setItem("cart_location", selectedLocation);
    sessionStorage.setItem("cart_address", address);
  }, [fulfillment, selectedLocation, address]);

  useEffect(() => {
    supabase
      .from("locations")
      .select("id, name, type, address")
      .eq("is_active", true)
      .then(({ data }) => {
        if (data) setLocations(data);
      });
  }, []);

  // --- HANDLERS ---

  const handleNextStep = async () => {
    setError("");

    // Step 1 -> 2: Check Login
    if (step === 1) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to proceed");
        router.push("/login?next=/cart");
        return;
      }
      setStep(2);
      window.scrollTo(0, 0);
      return;
    }

    // Step 2 -> 3: Validate Delivery Info
    if (step === 2) {
      if (!selectedLocation) {
        toast.error("Please select a fulfillment store");
        setError("Store selection is required for inventory check.");
        return;
      }

      if (fulfillment === "courier") {
        const validation = checkoutSchema.safeParse({ address });
        if (!validation.success) {
          const msg = validation.error.issues[0].message;
          setError(msg);
          toast.error(msg);
          return;
        }
      }
      setStep(3);
      window.scrollTo(0, 0);
    }
  };

  const handleBackStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const deliveryFee = fulfillment === "courier" ? 100 : 0;
      const finalTotal = cartTotal + deliveryFee;
      const fulfillmentLocationId = selectedLocation;

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: user.id,
          total_amount: finalTotal,
          status: "paid",
          fulfillment_type: fulfillment,
          pickup_location_id: fulfillmentLocationId,
          delivery_address: fulfillment === "courier" ? address : null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Process Items
      for (const item of cart) {
        const { error: itemsError } = await supabase
          .from("order_items")
          .insert({
            order_id: order.id,
            product_id: item.id,
            quantity: item.quantity,
            price_at_purchase: item.price,
          });

        if (itemsError) throw itemsError;

        // Decrement Stock
        const { error: stockError } = await supabase.rpc("process_sale", {
          p_location_id: fulfillmentLocationId,
          p_product_id: item.id,
          p_quantity: item.quantity,
        });

        if (stockError) console.error("Stock update failed", stockError);
      }

      // Save Address Logic
      if (fulfillment === "courier" && saveAddress && address) {
        await supabase
          .from("profiles")
          .update({ billing_address: { address: address } })
          .eq("id", user.id);
      }

      clearCart();
      sessionStorage.clear(); // Clear all checkout session data
      toast.success("Order placed successfully!");
      router.push("/orders");
    } catch (error: unknown) {
      toast.error("Failed to place order. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Store className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground mb-8">
          Looks like you haven&apos;t added anything yet.
        </p>
        <Button asChild size="lg">
          <Link href="/">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  const deliveryFee = fulfillment === "courier" ? 100 : 0;
  const finalTotal = cartTotal + deliveryFee;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Checkout</h1>

      <CheckoutSteps currentStep={step} />

      <div className="grid lg:grid-cols-3 gap-8 mt-8">
        {/* --- LEFT COLUMN: MAIN CONTENT --- */}
        <div className="lg:col-span-2 space-y-6">
          {/* STEP 1: CART REVIEW */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  Review Cart ({cart.length})
                </h2>
              </div>

              {cart.map((item) => (
                <Card
                  key={`${item.id}-${item.size}`}
                  className="overflow-hidden"
                >
                  <CardContent className="p-4 flex gap-4">
                    <Link
                      href={`/product/${item.id}`}
                      className="relative w-24 h-24 bg-muted rounded-md overflow-hidden shrink-0"
                    >
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                          No Img
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link
                            href={`/product/${item.id}`}
                            className="font-medium hover:text-primary hover:underline"
                          >
                            {item.name}
                          </Link>
                          {item.size && (
                            <p className="text-sm text-muted-foreground">
                              Size: {item.size}
                            </p>
                          )}
                        </div>
                        <p className="font-bold">R {item.price}</p>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center border rounded-md h-8">
                          <button
                            className="px-2 hover:bg-muted h-full"
                            onClick={() =>
                              updateQuantity(item.id, -1, item.size)
                            }
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            className="px-2 hover:bg-muted h-full"
                            onClick={() =>
                              updateQuantity(item.id, 1, item.size)
                            }
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive h-8 px-2"
                          onClick={() => removeFromCart(item.id, item.size)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* STEP 2: DELIVERY DETAILS */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Method</CardTitle>
                  <CardDescription>
                    Choose how you want to receive your order.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup
                    value={fulfillment}
                    onValueChange={(v: "courier" | "pickup") =>
                      setFulfillment(v)
                    }
                  >
                    <div
                      className={cn(
                        "flex items-center space-x-2 border p-4 rounded-lg cursor-pointer transition-all",
                        fulfillment === "courier"
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <RadioGroupItem value="courier" id="r-courier" />
                      <Label
                        htmlFor="r-courier"
                        className="flex-1 cursor-pointer flex items-center gap-3"
                      >
                        <div className="bg-background p-2 rounded-full border">
                          <Truck className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <span className="block font-medium">
                            Door-to-Door Courier
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Standard delivery (2-5 days)
                          </span>
                        </div>
                        <div className="ml-auto font-bold text-sm">
                          R 100.00
                        </div>
                      </Label>
                    </div>

                    <div
                      className={cn(
                        "flex items-center space-x-2 border p-4 rounded-lg cursor-pointer transition-all",
                        fulfillment === "pickup"
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <RadioGroupItem value="pickup" id="r-pickup" />
                      <Label
                        htmlFor="r-pickup"
                        className="flex-1 cursor-pointer flex items-center gap-3"
                      >
                        <div className="bg-background p-2 rounded-full border">
                          <Store className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <span className="block font-medium">
                            Local Pickup
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Collect from a store near you
                          </span>
                        </div>
                        <div className="ml-auto font-bold text-sm">Free</div>
                      </Label>
                    </div>
                  </RadioGroup>

                  <Separator />

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>
                        {fulfillment === "pickup"
                          ? "Select Pickup Store"
                          : "Select Fulfillment Store"}
                        {fulfillment === "courier" && (
                          <span className="text-xs font-normal text-muted-foreground ml-2">
                            (Stock source)
                          </span>
                        )}
                      </Label>
                      <Select
                        value={selectedLocation}
                        onValueChange={setSelectedLocation}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a location..." />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((loc) => (
                            <SelectItem key={loc.id} value={loc.id}>
                              {loc.name} ({loc.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {fulfillment === "courier" && (
                      <div className="space-y-2 animate-in slide-in-from-top-2">
                        <Label>Delivery Address</Label>
                        <AddressAutocomplete
                          onAddressSelect={(addr) => setAddress(addr)}
                          defaultValue={address}
                          error={error}
                        />
                        <div className="flex items-center space-x-2 pt-2">
                          <Checkbox
                            id="save-address"
                            checked={saveAddress}
                            onCheckedChange={(checked) =>
                              setSaveAddress(checked as boolean)
                            }
                          />
                          <Label
                            htmlFor="save-address"
                            className="text-sm font-normal cursor-pointer"
                          >
                            Save as my default billing address
                          </Label>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* STEP 3: PAYMENT & SUMMARY */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.quantity} x {item.name} ({item.size})
                      </span>
                      <span>R {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>R {cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Delivery Method
                    </span>
                    <span className="capitalize">{fulfillment}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span>
                      {deliveryFee === 0
                        ? "Free"
                        : `R ${deliveryFee.toFixed(2)}`}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total To Pay</span>
                    <span>R {finalTotal.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border p-4 rounded-lg flex items-center gap-3 bg-primary/5 border-primary">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <span className="font-medium">Credit / Debit Card</span>
                    <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    Secure payment processing via our payment partner.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* --- RIGHT COLUMN: SUMMARY STICKY --- */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">Total</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Items ({cart.length})</span>
                  <span>R {cartTotal.toFixed(2)}</span>
                </div>
                {step > 1 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Delivery</span>
                    <span>
                      {deliveryFee === 0 ? "Free" : `R ${deliveryFee}`}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-xl">
                  <span>R {finalTotal.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                {step === 1 && (
                  <Button className="w-full" size="lg" onClick={handleNextStep}>
                    Proceed to Checkout{" "}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
                {step === 2 && (
                  <>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleNextStep}
                    >
                      Proceed to Payment{" "}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleBackStep}
                    >
                      Back to Cart
                    </Button>
                  </>
                )}
                {step === 3 && (
                  <>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => setShowPayment(true)}
                      disabled={loading}
                    >
                      {loading ? "Processing..." : "Pay Now"}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleBackStep}
                      disabled={loading}
                    >
                      Back to Delivery
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <div className="flex -space-x-2">
                <div className="w-6 h-4 bg-gray-300 rounded" title="Visa"></div>
                <div
                  className="w-6 h-4 bg-gray-300 rounded"
                  title="Mastercard"
                ></div>
              </div>
              <span>Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>

      <MockPaymentDialog
        open={showPayment}
        onOpenChange={setShowPayment}
        amount={finalTotal}
        onConfirm={handlePaymentSuccess}
      />
    </div>
  );
}
