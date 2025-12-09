"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, MapPin } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";

// Define strict types for the joined data
interface OrderItem {
  quantity: number;
  price_at_purchase: number;
  products: {
    id: string;
    name: string;
    image_url: string | null;
  } | null;
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  pickup_location_id: string | null;
  locations: {
    name: string;
    address: string;
  } | null;
  order_items: OrderItem[];
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchOrders() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          locations (name, address),
          order_items (
            quantity,
            price_at_purchase,
            products (id, name, image_url)
          )
        `
        )
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
      } else if (data) {
        // Safe cast to our defined interface
        setOrders(data as unknown as Order[]);
      }
      setLoading(false);
    }
    fetchOrders();
  }, [router]);

  if (loading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="container max-w-4xl py-4 md:py-12 mx-auto px-4 text-foreground">
      <h1 className="text-3xl font-bold mb-2">My Orders</h1>
      <p className="text-muted-foreground mb-8">
        Track and manage your recent purchases.
      </p>

      <div className="space-y-6">
        {orders.length === 0 ? (
          <div className="text-center py-20 border border-border rounded-lg bg-muted/20">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No orders yet</h3>
            <p className="text-muted-foreground">
              Start shopping to see your orders here.
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <Card
              key={order.id}
              className="overflow-hidden bg-card border-border"
            >
              <CardHeader className="bg-muted/30 border-b border-border pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">
                      Order #{order.id.slice(0, 8)}
                    </CardTitle>
                    <CardDescription>
                      Placed on {format(new Date(order.created_at), "PPP")}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right mr-2">
                      <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                        Total
                      </div>
                      <div className="font-bold">R {order.total_amount}</div>
                    </div>
                    <Badge
                      className={
                        order.status === "delivered"
                          ? "bg-green-600"
                          : order.status === "ready"
                          ? "bg-blue-600"
                          : "bg-orange-500"
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Location Info */}
                {order.pickup_location_id && order.locations && (
                  <div className="flex items-start gap-2 mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-200 rounded-md text-sm">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold block">
                        Collection Point:
                      </span>
                      {order.locations.name}
                    </div>
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-4">
                  {order.order_items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <Link
                        href={`/product/${item.products?.id}`}
                        className="relative w-16 h-16 bg-muted rounded overflow-hidden shrink-0"
                      >
                        {item.products?.image_url && (
                          <Image
                            src={item.products.image_url}
                            alt={item.products.name}
                            fill
                            className="object-cover"
                          />
                        )}
                      </Link>
                      <div className="flex-1">
                        <h4 className="font-medium line-clamp-1">
                          {item.products?.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="font-medium">
                        R {item.price_at_purchase}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
