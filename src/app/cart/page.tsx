"use client";

import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Minus, Truck, Store, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// FIX: Allow nullable address
interface Warehouse {
  id: string;
  name: string;
  address: string | null;
}

export default function CartPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const [fulfillment, setFulfillment] = useState<"courier" | "pickup">("courier");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Load Warehouses for Pickup Option
  useEffect(() => {
    supabase
      .from("locations")
      .select("id, name, address")
      .eq("type", "warehouse")
      .eq("is_active", true)
      .then(({ data }) => {
        // Now compatible with the Warehouse interface
        if (data) setWarehouses(data);
      });
  }, []);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to checkout");
        router.push("/login");
        return;
      }

      if (fulfillment === "pickup" && !selectedLocation) {
        toast.error("Please select a pickup location");
        setLoading(false);
        return;
      }

      if (fulfillment === "courier" && !address) {
        toast.error("Please enter a delivery address");
        setLoading(false);
        return;
      }

      // 1. Create Order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: user.id,
          total_amount: cartTotal,
          status: "pending", // Pending payment/fulfillment
          fulfillment_type: fulfillment,
          pickup_location_id: fulfillment === "pickup" ? selectedLocation : null,
          delivery_address: fulfillment === "courier" ? address : null
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create Order Items
      const itemsData = cart.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_purchase: item.price
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(itemsData);
      if (itemsError) throw itemsError;

      // Success
      clearCart();
      toast.success("Order placed successfully!");
      router.push("/orders");

    } catch (error: unknown) {
        // Fix the error handling types
        let msg = "Failed to place order";
        if (error instanceof Error) msg = error.message;
        else if (typeof error === 'object' && error !== null && 'message' in error) {
            msg = String((error as { message: unknown }).message);
        }
        toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground mb-8">Looks like you haven&apos;t added anything yet.</p>
        <Button asChild>
          <Link href="/">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      
      <div className="grid lg:grid-cols-3 gap-12">
        
        {/* LEFT: Items List */}
        <div className="lg:col-span-2 space-y-6">
          {cart.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-4 flex gap-4 items-center">
                <div className="relative w-24 h-24 bg-muted rounded-md overflow-hidden shrink-0">
                  {item.image_url ? (
                    <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-muted-foreground">No Img</div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <p className="font-bold">R {item.price}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center border rounded-md">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={() => updateQuantity(item.id, -1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={() => updateQuantity(item.id, 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => removeFromCart(item.id)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* RIGHT: Checkout */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup defaultValue="courier" onValueChange={(v: "courier" | "pickup") => setFulfillment(v)}>
                <div className="flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="courier" id="r-courier" />
                  <Label htmlFor="r-courier" className="flex-1 cursor-pointer flex items-center gap-2">
                    <Truck className="w-4 h-4" /> 
                    <div>
                      <span className="block font-medium">Door-to-Door Courier</span>
                      <span className="text-xs text-muted-foreground">Delivered to your address</span>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="pickup" id="r-pickup" />
                  <Label htmlFor="r-pickup" className="flex-1 cursor-pointer flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <div>
                      <span className="block font-medium">Local Pickup</span>
                      <span className="text-xs text-muted-foreground">Collect from a nearby warehouse</span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {fulfillment === "pickup" && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <Label>Select Collection Point</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {fulfillment === "courier" && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <Label>Delivery Address</Label>
                  <Input placeholder="Street, Suburb, City, Code" value={address} onChange={e => setAddress(e.target.value)} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>R {cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span>{fulfillment === 'courier' ? 'R 100.00' : 'Free'}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>R {(cartTotal + (fulfillment === 'courier' ? 100 : 0)).toFixed(2)}</span>
              </div>
              
              <Button size="lg" className="w-full" onClick={handleCheckout} disabled={loading}>
                {loading ? "Processing..." : "Place Order"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}