"use client";

import { useState } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import { StoreSelector } from "@/components/StoreSelector";
import { Button } from "@/components/ui/button";
import { Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tables } from "@/lib/database.types";

type ProductWithInventory = Tables<"products"> & {
  inventory:
    | {
        id: string;
        price: number | null;
        quantity: number | null;
        locations: {
          id: string;
          name: string;
          type: "store" | "warehouse" | "virtual_courier";
        } | null;
      }[]
    | null;
};

interface ProductActionsProps {
  product: ProductWithInventory;
  totalStock: number;
}

export function ProductActions({ product, totalStock }: ProductActionsProps) {
  const sizes =
    product.sizes && product.sizes.length > 0
      ? product.sizes
      : ["XS", "S", "M", "L", "XL"];

  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [selectedStoreName, setSelectedStoreName] = useState<string>("");
  const [selectedStorePrice, setSelectedStorePrice] = useState<number | null>(
    null
  );
  const [showStoreSelector, setShowStoreSelector] = useState(false);

  const availableStores = (product.inventory || [])
    .filter((inv) => inv.locations?.type === "store" && (inv.quantity ?? 0) > 0)
    .map((inv) => ({
      id: inv.locations?.id || "",
      name: inv.locations?.name || "",
      address: null,
      quantity: inv.quantity || 0,
      price: inv.price ?? product.price,
    }))
    .filter((store) => store.id);

  const handleStoreSelect = (storeId: string, storeName: string) => {
    setSelectedStoreId(storeId);
    setSelectedStoreName(storeName);
    const store = availableStores.find((s) => s.id === storeId);
    setSelectedStorePrice(store?.price ?? product.price);
  };

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

      <div>
        <h3 className="text-sm font-medium mb-3">Select Store</h3>
        <button
          onClick={() => setShowStoreSelector(true)}
          className={cn(
            "w-full p-3 rounded-md border text-sm font-medium transition-all text-left flex justify-between items-center",
            selectedStoreId
              ? "border-primary bg-primary/5"
              : "bg-background hover:bg-muted border-border"
          )}
        >
          <span>{selectedStoreName || "Choose a store..."}</span>
          {selectedStorePrice && (
            <span className="text-sm font-bold text-primary">
              R {selectedStorePrice.toFixed(2)}
            </span>
          )}
        </button>
        {!selectedStoreId && (
          <p className="text-xs text-destructive mt-2 animate-pulse">
            * Please select a store
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <AddToCartButton
          product={{
            ...product,
            inventory: product.inventory ?? [],
          }}
          disabled={totalStock === 0 || !selectedSize}
          selectedSize={selectedSize}
          selectedStoreId={selectedStoreId}
          selectedStoreName={selectedStoreName}
          storePrice={selectedStorePrice}
          className="flex-1 h-14"
        />

        <Button size="lg" variant="outline" className="h-14 w-14 p-0 shrink-0">
          <Truck className="w-6 h-6" />
        </Button>
      </div>

      <StoreSelector
        open={showStoreSelector}
        onOpenChange={setShowStoreSelector}
        stores={availableStores}
        onSelect={handleStoreSelect}
      />
    </div>
  );
}
