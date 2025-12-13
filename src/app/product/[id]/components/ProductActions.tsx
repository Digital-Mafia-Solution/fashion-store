"use client";

import { useState, useEffect, useMemo, useReducer } from "react";
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

interface SelectionState {
  selectedSize?: string;
  selectedStoreId: string;
  selectedStoreName: string;
  selectedStorePrice: number | null;
  autoSelected: boolean;
}

type SelectionAction =
  | { type: "SET_SIZE"; size?: string }
  | {
      type: "SET_STORE";
      storeId: string;
      storeName: string;
      price: number | null;
    }
  | {
      type: "AUTO_SELECT_STORE";
      storeId: string;
      storeName: string;
      price: number | null;
    };

const initialSelectionState: SelectionState = {
  selectedSize: undefined,
  selectedStoreId: "",
  selectedStoreName: "",
  selectedStorePrice: null,
  autoSelected: false,
};

function selectionReducer(
  state: SelectionState,
  action: SelectionAction
): SelectionState {
  switch (action.type) {
    case "SET_SIZE":
      return { ...state, selectedSize: action.size };
    case "SET_STORE":
      return {
        ...state,
        selectedStoreId: action.storeId,
        selectedStoreName: action.storeName,
        selectedStorePrice: action.price,
        selectedSize: undefined,
      };
    case "AUTO_SELECT_STORE":
      return {
        ...state,
        selectedStoreId: action.storeId,
        selectedStoreName: action.storeName,
        selectedStorePrice: action.price,
        selectedSize: undefined,
        autoSelected: true,
      };
    default:
      return state;
  }
}

export function ProductActions({ product, totalStock }: ProductActionsProps) {
  const sizes =
    product.sizes && product.sizes.length > 0
      ? product.sizes
      : ["XS", "S", "M", "L", "XL"];

  const [selection, dispatch] = useReducer(
    selectionReducer,
    initialSelectionState
  );
  const [showStoreSelector, setShowStoreSelector] = useState(false);

  // Get unique stores with their available sizes
  const { storeInventoryMap, availableStores } = useMemo(() => {
    const map = new Map<
      string,
      { name: string; price: number; availableSizes: Set<string> }
    >();

    (product.inventory || [])
      .filter(
        (inv) => inv.locations?.type === "store" && (inv.quantity ?? 0) > 0
      )
      .forEach((inv) => {
        const storeId = inv.locations?.id || "";
        if (!storeId) return;

        if (!map.has(storeId)) {
          map.set(storeId, {
            name: inv.locations?.name || "",
            price: inv.price,
            availableSizes: new Set(),
          });
        }

        const store = map.get(storeId)!;
        if (inv.size_name) {
          store.availableSizes.add(inv.size_name);
        }
      });

    const stores = Array.from(map.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      address: undefined,
      quantity: 0,
      price: data.price ?? undefined,
    }));

    return { storeInventoryMap: map, availableStores: stores };
  }, [product.inventory]);

  // Get available sizes for selected store
  const selectedStoreData = selection.selectedStoreId
    ? storeInventoryMap.get(selection.selectedStoreId)
    : null;
  const availableSizesForStore = selectedStoreData
    ? Array.from(selectedStoreData.availableSizes)
    : sizes;

  const handleStoreSelect = (storeId: string, storeName: string) => {
    const storeData = storeInventoryMap.get(storeId);
    dispatch({
      type: "SET_STORE",
      storeId,
      storeName,
      price: storeData?.price ?? 0,
    });
  };

  // Auto-select store if there's only one available
  useEffect(() => {
    if (availableStores.length === 1 && !selection.autoSelected) {
      const store = availableStores[0];
      const storeData = storeInventoryMap.get(store.id);
      dispatch({
        type: "AUTO_SELECT_STORE",
        storeId: store.id,
        storeName: store.name,
        price: storeData?.price ?? 0,
      });
    }
  }, [availableStores, storeInventoryMap, selection.autoSelected]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">Select Store</h3>
        <button
          onClick={() => setShowStoreSelector(true)}
          className={cn(
            "w-full p-3 rounded-md border text-sm font-medium transition-all text-left flex justify-between items-center",
            selection.selectedStoreId
              ? "border-primary bg-primary/5"
              : "bg-background hover:bg-muted border-border"
          )}
        >
          <span>{selection.selectedStoreName || "Choose a store..."}</span>
          {selection.selectedStorePrice && (
            <span className="text-sm font-bold text-primary">
              R {selection.selectedStorePrice.toFixed(2)}
            </span>
          )}
        </button>
        {!selection.selectedStoreId && (
          <p className="text-xs text-destructive mt-2 animate-pulse">
            * Please select a store
          </p>
        )}
        {selection.selectedStoreId && totalStock > 0 && totalStock < 5 && (
          <p className="text-xs text-destructive font-semibold mt-2 bg-destructive/10 p-2 rounded">
            ⚠️ Only {totalStock} item{totalStock !== 1 ? "s" : ""} left in stock
          </p>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Select Size</h3>
        {selection.selectedStoreId ? (
          <div className="flex flex-wrap gap-2">
            {sizes.map((size: string) => {
              const isAvailable = availableSizesForStore.includes(size);
              return (
                <button
                  key={size}
                  onClick={() =>
                    isAvailable && dispatch({ type: "SET_SIZE", size })
                  }
                  disabled={!isAvailable}
                  className={cn(
                    "h-10 w-12 rounded-md border text-sm font-medium transition-all",
                    selection.selectedSize === size
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
        {selection.selectedStoreId && !selection.selectedSize && (
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
          disabled={totalStock === 0 || !selection.selectedSize}
          selectedSize={selection.selectedSize}
          selectedStoreId={selection.selectedStoreId}
          selectedStoreName={selection.selectedStoreName}
          storePrice={selection.selectedStorePrice}
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
