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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Trash2,
  Plus,
  Minus,
  Truck,
  Store as StoreIcon,
  ChevronRight,
  MapPin,
  Loader2,
} from "lucide-react";
import { getGateway } from "@/lib/payments/registry";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import type { PaymentMethodId } from "@/lib/payments/types";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import PaymentDialog from "@/components/PaymentDialog";
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
        fulfillment: "courier" | "pickup" | "warehouse";
        address: string;
        showPayment: boolean;
        paymentMethod?: PaymentMethodId;
        paymentDialogMode?: "select" | "pay";
        warehouseId?: string | null;
        warehouseName?: string | null;
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
        paymentMethod: undefined,
        paymentDialogMode: undefined,
        warehouseId: undefined,
        warehouseName: undefined,
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
        paymentMethod: undefined,
        paymentDialogMode: undefined,
        warehouseId: undefined,
        warehouseName: undefined,
      }
    );
  };

  function WarehouseSelector({ storeId }: { storeId: string }) {
    const state = getStoreState(storeId);
    const [warehouses, setWarehouses] = useState<
      { id: string; name: string }[]
    >([]);
    const [loadingWh, setLoadingWh] = useState(false);

    useEffect(() => {
      let mounted = true;
      const load = async () => {
        setLoadingWh(true);
        try {
          // Query all locations of type 'warehouse' — do not filter by stock
          const { data, error } = await supabase
            .from("locations")
            .select("id, name")
            .eq("type", "warehouse");
          if (error) throw error;

          const rows = (data ?? []) as Array<{ id?: string; name?: string }>;
          const items = rows
            .filter((r) => r.id)
            .map((r) => ({
              id: r.id as string,
              name: r.name || "Unnamed Warehouse",
            }));

          if (mounted) setWarehouses(items);
        } catch (err) {
          console.error("Failed to load warehouses", err);
        } finally {
          if (mounted) setLoadingWh(false);
        }
      };
      load();
      return () => {
        mounted = false;
      };
      // reload when storeId changes
    }, [storeId]);

    if (loadingWh) {
      return (
        <div className="py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      );
    }

    if (warehouses.length === 0) {
      return (
        <div className="text-sm text-muted-foreground italic">
          No warehouses available for these items.
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Label>Pick up point</Label>
        <Select
          value={state.warehouseId || ""}
          onValueChange={(val) =>
            updateStoreState(storeId, {
              warehouseId: val || undefined,
              warehouseName: warehouses.find((w) => w.id === val)?.name,
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a pick up point" />
          </SelectTrigger>
          <SelectContent>
            {warehouses.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  const updateStoreState = (
    storeId: string,
    updates: Partial<typeof getStoreState>
  ) => {
    setStoreCheckoutState((prev) => {
      const existing = prev[storeId] || {
        step: 1,
        fulfillment: "courier",
        address: "",
        showPayment: false,
        paymentMethod: undefined,
        paymentDialogMode: undefined,
      };
      return {
        ...prev,
        [storeId]: {
          ...existing,
          ...updates,
        },
      };
    });
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
      if (state.fulfillment === "warehouse") {
        if (!state.warehouseId) {
          const msg = "Please select a pick up point";
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
      const dbFulfillmentType =
        state.fulfillment === "warehouse"
          ? "warehouse_pickup"
          : state.fulfillment;
      const pickupLocationId =
        state.fulfillment === "warehouse" ? state.warehouseId : storeId;

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: user.id,
          total_amount: finalTotal,
          status: "paid",
          fulfillment_type: dbFulfillmentType,
          pickup_location_id: pickupLocationId,
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

                        <div
                          className={cn(
                            "flex items-center space-x-2 border p-4 rounded-lg cursor-pointer transition-all",
                            state.fulfillment === "warehouse"
                              ? "border-primary bg-primary/5"
                              : "hover:bg-muted/50"
                          )}
                        >
                          <RadioGroupItem
                            value="warehouse"
                            id={`${storeId}-warehouse`}
                          />
                          <Label
                            htmlFor={`${storeId}-warehouse`}
                            className="flex-1 cursor-pointer flex items-center gap-3"
                          >
                            <div className="bg-background p-2 rounded-full border">
                              <MapPin className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <span className="block font-medium">
                                Pick up point
                              </span>
                              <span className="text-sm text-muted-foreground">
                                Collect from a pick up point - Free
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

                    {state.fulfillment === "warehouse" && (
                      <div className="space-y-4 animate-in slide-in-from-top-2">
                        <WarehouseSelector storeId={storeId} />
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
                            : state.fulfillment === "pickup"
                            ? "Store Pickup"
                            : "Pick up point"}
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
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              Payment Method
                            </div>
                            <div className="text-sm">
                              {state.paymentMethod ? (
                                (() => {
                                  const g = getGateway(
                                    state.paymentMethod as PaymentMethodId
                                  );
                                  return g ? g.name : state.paymentMethod;
                                })()
                              ) : (
                                <span className="text-muted-foreground">
                                  No payment method selected
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex w-full sm:w-auto gap-2 items-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateStoreState(storeId, {
                                  showPayment: true,
                                  paymentDialogMode: "select",
                                })
                              }
                              className="w-full sm:w-auto h-8"
                            >
                              Select Payment Method
                            </Button>

                            {state.paymentMethod && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  updateStoreState(storeId, {
                                    paymentMethod: undefined,
                                  })
                                }
                                className="text-destructive h-8 w-full sm:w-auto"
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
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
                      onClick={async () => {
                        // If a method is already selected, process payment directly.
                        if (state.paymentMethod) {
                          const gateway = getGateway(
                            state.paymentMethod as PaymentMethodId
                          );
                          if (!gateway) {
                            toast.error("Payment gateway not available");
                            return;
                          }
                          setLoading(true);
                          try {
                            const amount =
                              storeItems.reduce(
                                (acc, item) => acc + item.price * item.quantity,
                                0
                              ) + (state.fulfillment === "courier" ? 100 : 0);
                            await gateway.init?.();
                            const res = await gateway.processPayment(
                              amount,
                              {}
                            );
                            if (res.success) {
                              toast.success(
                                res.message || "Payment successful (mock)"
                              );
                              await handlePaymentSuccess(storeId);
                            } else {
                              toast.error(
                                res.message || "Payment failed (mock)"
                              );
                            }
                          } catch (err) {
                            console.error(err);
                            toast.error("Payment failed. Please try again.");
                          } finally {
                            setLoading(false);
                          }
                        } else {
                          // No method selected -> open dialog to select or pay
                          updateStoreState(storeId, {
                            showPayment: true,
                            paymentDialogMode: "pay",
                          });
                        }
                      }}
                      disabled={loading}
                    >
                      {loading ? "Processing..." : "Pay Now"}
                    </Button>
                  </CardFooter>

                  <PaymentDialog
                    open={state.showPayment}
                    mode={state.paymentDialogMode}
                    initialMethod={state.paymentMethod}
                    onSelect={(method) =>
                      updateStoreState(storeId, { paymentMethod: method })
                    }
                    onOpenChange={(open: boolean) =>
                      updateStoreState(storeId, {
                        showPayment: open,
                        paymentDialogMode: undefined,
                      })
                    }
                    amount={
                      storeItems.reduce(
                        (acc, item) => acc + item.price * item.quantity,
                        0
                      ) + (state.fulfillment === "courier" ? 100 : 0)
                    }
                    onSuccess={async () => {
                      await handlePaymentSuccess(storeId);
                    }}
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
