"use client";

import { useCart } from "@/context/CartContext";
import type { CartItem } from "@/context/CartContext";
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
import { Separator } from "@/components/ui/separator";
import {
  Trash2,
  Plus,
  Minus,
  Truck,
  Store as StoreIcon,
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
import { SavedAddresses } from "@/components/SavedAddresses";
import { z } from "zod";
import { cn } from "@/lib/utils";

const checkoutSchema = z.object({
  address: z.string().min(10, "Please select a valid address from the list"),
});

function StoreCartSection({
  storeId,
  storeName,
  items,
  onRemoveItem,
  onUpdateQuantity,
  onCheckout,
  loading,
}: {
  storeId: string;
  storeName: string;
  items: CartItem[];
  onRemoveItem: (itemId: string, size?: string) => void;
  onUpdateQuantity: (itemId: string, delta: number, size?: string) => void;
  onCheckout: (storeId: string) => void;
  loading: boolean;
}) {
  const storeTotal = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50">
        <div className="flex items-center gap-2">
          <StoreIcon className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">{storeName}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {items.map((item) => (
          <div
            key={`${item.id}-${item.size}`}
            className="flex gap-4 pb-4 border-b last:border-b-0 last:pb-0"
          >
            <Link
              href={`/product/${item.id}`}
              className="relative w-20 h-20 bg-muted rounded-md overflow-hidden shrink-0"
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
                    className="font-medium text-sm hover:text-primary hover:underline"
                  >
                    {item.name}
                  </Link>
                  {item.size && (
                    <p className="text-xs text-muted-foreground">
                      Size: {item.size}
                    </p>
                  )}
                </div>
                <p className="font-bold text-sm">R {item.price}</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center border rounded-md h-8">
                  <button
                    className="px-2 hover:bg-muted h-full"
                    onClick={() => onUpdateQuantity(item.id, -1, item.size)}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-medium">
                    {item.quantity}
                  </span>
                  <button
                    className="px-2 hover:bg-muted h-full"
                    onClick={() => onUpdateQuantity(item.id, 1, item.size)}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive h-8 px-2"
                  onClick={() => onRemoveItem(item.id, item.size)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex flex-col gap-3 border-t p-4">
        <div className="flex justify-between w-full font-bold">
          <span>Subtotal</span>
          <span>R {storeTotal.toFixed(2)}</span>
        </div>
        <Button
          className="w-full"
          onClick={() => onCheckout(storeId)}
          disabled={loading || items.length === 0}
        >
          Proceed to Checkout <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function CartPage() {
  const { cart, cartByStore, removeFromCart, updateQuantity, clearStoreCart } =
    useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string>("");

  // Per-store checkout state
  const [storeCheckoutState, setStoreCheckoutState] = useState<
    Record<
      string,
      {
        step: number;
        fulfillment: "courier" | "pickup";
        address: string;
        showPayment: boolean;
      }
    >
  >({});

  useEffect(() => {
    // Fetch current user ID
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    // Initialize checkout state for each store
    const initialState: typeof storeCheckoutState = {};
    Object.keys(cartByStore).forEach((storeId) => {
      initialState[storeId] = {
        step: 1,
        fulfillment: "courier",
        address: "",
        showPayment: false,
      };
    });
    setStoreCheckoutState(initialState);
  }, [cartByStore]);

  const getStoreState = (storeId: string) => {
    return (
      storeCheckoutState[storeId] || {
        step: 1,
        fulfillment: "courier",
        address: "",
        showPayment: false,
      }
    );
  };

  const updateStoreState = (
    storeId: string,
    updates: Partial<typeof getStoreState>
  ) => {
    setStoreCheckoutState((prev) => ({
      ...prev,
      [storeId]: {
        ...getStoreState(storeId),
        ...updates,
      },
    }));
  };

  const handleCheckout = async (storeId: string) => {
    const state = getStoreState(storeId);

    if (state.step === 1) {
      // Check login
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to proceed");
        router.push("/login?next=/cart");
        return;
      }
      updateStoreState(storeId, { step: 2 });
      return;
    }

    if (state.step === 2) {
      // Validate delivery info
      if (state.fulfillment === "courier") {
        const validation = checkoutSchema.safeParse({ address: state.address });
        if (!validation.success) {
          const msg = validation.error.issues[0].message;
          setError(msg);
          toast.error(msg);
          return;
        }
      }
      updateStoreState(storeId, { step: 3 });
      return;
    }
  };

  const handlePaymentSuccess = async (storeId: string) => {
    const state = getStoreState(storeId);
    const storeItems = cartByStore[storeId] || [];

    if (!storeItems.length) {
      toast.error("No items in this store's cart");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const deliveryFee = state.fulfillment === "courier" ? 100 : 0;
      const storeTotal = storeItems.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );
      const finalTotal = storeTotal + deliveryFee;

      // Use storeId as pickup_location_id (the store they selected items from)
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: user.id,
          total_amount: finalTotal,
          status: "paid",
          fulfillment_type: state.fulfillment,
          pickup_location_id: storeId,
          delivery_address:
            state.fulfillment === "courier" ? state.address : null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Process Items
      for (const item of storeItems) {
        const { error: itemsError } = await supabase
          .from("order_items")
          .insert({
            order_id: order.id,
            product_id: item.id,
            quantity: item.quantity,
            price_at_purchase: item.price,
          });

        if (itemsError) throw itemsError;

        // Decrement Stock - use storeId as location
        const { error: stockError } = await supabase.rpc("process_sale", {
          p_location_id: storeId,
          p_product_id: item.id,
          p_quantity: item.quantity,
        });

        if (stockError) throw stockError;
      }

      clearStoreCart(storeId);
      updateStoreState(storeId, { showPayment: false, step: 1 });
      const storeName = storeItems[0]?.storeName || "Store";
      toast.success(`Order from ${storeName} placed!`);
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
          <StoreIcon className="w-10 h-10 text-muted-foreground" />
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

  const storeIds = Object.keys(cartByStore);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Shopping Cart</h1>

      <div className="space-y-8">
        {storeIds.map((storeId) => {
          const storeItems = cartByStore[storeId] || [];
          const storeName = storeItems[0]?.storeName || "Store";
          const state = getStoreState(storeId);

          return (
            <div key={storeId}>
              {state.step === 1 && (
                <StoreCartSection
                  storeId={storeId}
                  storeName={storeName}
                  items={storeItems}
                  onRemoveItem={(itemId, size) =>
                    removeFromCart(itemId, storeId, size)
                  }
                  onUpdateQuantity={(itemId, delta, size) =>
                    updateQuantity(itemId, storeId, delta, size)
                  }
                  onCheckout={handleCheckout}
                  loading={loading}
                />
              )}

              {state.step === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <StoreIcon className="w-5 h-5 text-primary" />
                      Checkout - {storeName}
                    </CardTitle>
                    <CardDescription>
                      Step 1 of 2: Delivery Details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Delivery Method</h3>
                      <RadioGroup
                        value={state.fulfillment}
                        onValueChange={(v: "courier" | "pickup") =>
                          updateStoreState(storeId, { fulfillment: v })
                        }
                      >
                        <div
                          className={cn(
                            "flex items-center space-x-2 border p-4 rounded-lg cursor-pointer transition-all",
                            state.fulfillment === "courier"
                              ? "border-primary bg-primary/5"
                              : "hover:bg-muted/50"
                          )}
                        >
                          <RadioGroupItem
                            value="courier"
                            id={`${storeId}-courier`}
                          />
                          <Label
                            htmlFor={`${storeId}-courier`}
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
                                Standard delivery (2-5 days) - R 100
                              </span>
                            </div>
                          </Label>
                        </div>

                        <div
                          className={cn(
                            "flex items-center space-x-2 border p-4 rounded-lg cursor-pointer transition-all",
                            state.fulfillment === "pickup"
                              ? "border-primary bg-primary/5"
                              : "hover:bg-muted/50"
                          )}
                        >
                          <RadioGroupItem
                            value="pickup"
                            id={`${storeId}-pickup`}
                          />
                          <Label
                            htmlFor={`${storeId}-pickup`}
                            className="flex-1 cursor-pointer flex items-center gap-3"
                          >
                            <div className="bg-background p-2 rounded-full border">
                              <StoreIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <span className="block font-medium">
                                Store Pickup
                              </span>
                              <span className="text-sm text-muted-foreground">
                                Collect from {storeName} - Free
                              </span>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {state.fulfillment === "courier" && (
                      <div className="space-y-4 animate-in slide-in-from-top-2">
                        {userId && (
                          <div>
                            <SavedAddresses
                              userId={userId}
                              onAddressSelect={(addr) =>
                                updateStoreState(storeId, { address: addr })
                              }
                              displayOnly={false}
                            />
                          </div>
                        )}

                        <Separator />

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Enter New Address</Label>
                            {state.address && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  updateStoreState(storeId, { address: "" })
                                }
                                className="h-7 text-xs"
                              >
                                Change Address
                              </Button>
                            )}
                          </div>
                          <AddressAutocomplete
                            onAddressSelect={(addr) =>
                              updateStoreState(storeId, { address: addr })
                            }
                            defaultValue={state.address}
                            error={error}
                            disabled={!!state.address}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => updateStoreState(storeId, { step: 1 })}
                    >
                      Back to Cart
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => handleCheckout(storeId)}
                    >
                      Review Order <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {state.step === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <StoreIcon className="w-5 h-5 text-primary" />
                      Review Order - {storeName}
                    </CardTitle>
                    <CardDescription>Step 2 of 2: Payment</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      {storeItems.map((item) => (
                        <div
                          key={`${item.id}-${item.size}`}
                          className="flex justify-between text-sm border-b pb-3"
                        >
                          <span className="text-muted-foreground">
                            {item.quantity}x {item.name}
                            {item.size && ` (${item.size})`}
                          </span>
                          <span>
                            R {(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>
                          R{" "}
                          {storeItems
                            .reduce(
                              (acc, item) => acc + item.price * item.quantity,
                              0
                            )
                            .toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Delivery</span>
                        <span>
                          {state.fulfillment === "courier"
                            ? "R 100.00"
                            : "Free"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Delivery Method</span>
                        <span className="capitalize">
                          {state.fulfillment === "courier"
                            ? "Courier"
                            : "Store Pickup"}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>
                          R{" "}
                          {(
                            storeItems.reduce(
                              (acc, item) => acc + item.price * item.quantity,
                              0
                            ) + (state.fulfillment === "courier" ? 100 : 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <Card className="bg-primary/5 border-primary">
                      <CardContent className="p-4 flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-primary" />
                        <div>
                          <div className="font-medium text-sm">
                            Credit / Debit Card
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Secure payment processing
                          </div>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />
                      </CardContent>
                    </Card>
                  </CardContent>
                  <CardFooter className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => updateStoreState(storeId, { step: 2 })}
                      disabled={loading}
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() =>
                        updateStoreState(storeId, { showPayment: true })
                      }
                      disabled={loading}
                    >
                      {loading ? "Processing..." : "Pay Now"}
                    </Button>
                  </CardFooter>

                  <MockPaymentDialog
                    open={state.showPayment}
                    onOpenChange={(open) =>
                      updateStoreState(storeId, { showPayment: open })
                    }
                    amount={
                      storeItems.reduce(
                        (acc, item) => acc + item.price * item.quantity,
                        0
                      ) + (state.fulfillment === "courier" ? 100 : 0)
                    }
                    onConfirm={() => handlePaymentSuccess(storeId)}
                  />
                </Card>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
