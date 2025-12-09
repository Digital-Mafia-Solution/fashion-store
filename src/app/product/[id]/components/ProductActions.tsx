"use client";

import { useState } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import { Button } from "@/components/ui/button";
import { Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tables } from "@/lib/database.types";

// FIX: Define proper type matching the database query
type ProductWithInventory = Tables<"products"> & {
  inventory:
    | {
        quantity: number | null;
        locations: {
          type: "store" | "warehouse" | "virtual_courier";
        } | null;
      }[]
    | null;
};

interface ProductActionsProps {
  product: ProductWithInventory; // Replaced 'any' with strict type
  totalStock: number;
}

export function ProductActions({ product, totalStock }: ProductActionsProps) {
  // Mock sizes if none exist in DB (as we just added the field)
  const sizes =
    product.sizes && product.sizes.length > 0
      ? product.sizes
      : ["XS", "S", "M", "L", "XL"];

  const [selectedSize, setSelectedSize] = useState<string | undefined>();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">Select Size</h3>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size: string) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={cn(
                "h-10 w-12 rounded-md border text-sm font-medium transition-all",
                selectedSize === size
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "bg-background hover:bg-muted"
              )}
            >
              {size}
            </button>
          ))}
        </div>
        {!selectedSize && (
          <p className="text-xs text-destructive mt-2 animate-pulse">
            * Please select a size
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <AddToCartButton
          // FIX: Ensure inventory is never null when passing to AddToCartButton
          product={{
            ...product,
            inventory: product.inventory ?? [],
          }}
          disabled={totalStock === 0 || !selectedSize}
          selectedSize={selectedSize}
          className="flex-1 h-14"
        />

        <Button size="lg" variant="outline" className="h-14 w-14 p-0 shrink-0">
          <Truck className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
