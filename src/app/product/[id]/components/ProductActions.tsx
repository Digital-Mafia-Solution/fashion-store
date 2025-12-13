"use client";

import { useState } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import { StoreSelector } from "@/components/StoreSelector";
import { cn } from "@/lib/utils";
import { Tables } from "@/lib/database.types";

type ProductWithInventory = Tables<"products"> & {
  inventory:
    | (Tables<"inventory"> & {
        locations: Tables<"locations"> | null;
      })[]
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

  // Get unique stores with their available sizes
  const storeInventoryMap = new Map<
    string,
    { name: string; price: number; availableSizes: Set<string> }
  >();

  (product.inventory || [])
    .filter((inv) => inv.locations?.type === "store" && (inv.quantity ?? 0) > 0)
    .forEach((inv) => {
      const storeId = inv.locations?.id || "";
      if (!storeId) return;

      if (!storeInventoryMap.has(storeId)) {
        storeInventoryMap.set(storeId, {
          name: inv.locations?.name || "",
          price: inv.price,
          availableSizes: new Set(),
        });
      }

      const store = storeInventoryMap.get(storeId)!;
      if (inv.size_name) {
        store.availableSizes.add(inv.size_name);
      }
    });

  const availableStores = Array.from(storeInventoryMap.entries()).map(
    ([id, data]) => ({
      id,
      name: data.name,
      address: undefined,
      quantity: 0,
      price: data.price ?? undefined,
    })
  );

  // Get available sizes for selected store
  const selectedStoreData = selectedStoreId
    ? storeInventoryMap.get(selectedStoreId)
    : null;
  const availableSizesForStore = selectedStoreData
    ? Array.from(selectedStoreData.availableSizes)
    : sizes;

  const handleStoreSelect = (storeId: string, storeName: string) => {
    setSelectedStoreId(storeId);
    setSelectedStoreName(storeName);
    const storeData = storeInventoryMap.get(storeId);
    setSelectedStorePrice(storeData?.price ?? 0);
    // Reset size selection when store changes
    setSelectedSize(undefined);
  };

  return (
    <div className="space-y-6">
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
        {selectedStoreId && totalStock > 0 && totalStock < 5 && (
          <p className="text-xs text-destructive font-semibold mt-2 bg-destructive/10 p-2 rounded">
            ⚠️ Only {totalStock} item{totalStock !== 1 ? "s" : ""} left in stock
          </p>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Select Size</h3>
        {selectedStoreId ? (
          <div className="flex flex-wrap gap-2">
            {sizes.map((size: string) => {
              const isAvailable = availableSizesForStore.includes(size);
              return (
                <button
                  key={size}
                  onClick={() => isAvailable && setSelectedSize(size)}
                  disabled={!isAvailable}
                  className={cn(
                    "h-10 w-12 rounded-md border text-sm font-medium transition-all",
                    selectedSize === size
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : isAvailable
                      ? "bg-background hover:bg-muted cursor-pointer"
                      : "bg-muted/30 text-muted-foreground cursor-not-allowed opacity-50"
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Select a store first to see available sizes
          </p>
        )}
        {selectedStoreId && !selectedSize && (
          <p className="text-xs text-destructive mt-2 animate-pulse">
            * Please select a size
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <AddToCartButton
          product={{
            ...product,
            price:
              product.inventory && product.inventory.length > 0
                ? Math.min(...product.inventory.map((inv) => inv.price ?? 0))
                : 0,
            inventory: product.inventory ?? [],
          }}
          disabled={totalStock === 0 || !selectedSize}
          selectedSize={selectedSize}
          selectedStoreId={selectedStoreId}
          selectedStoreName={selectedStoreName}
          storePrice={selectedStorePrice}
          className="flex-1 h-14"
        />
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
