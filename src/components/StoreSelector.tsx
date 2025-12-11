"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MapPin, Store } from "lucide-react";
import { cn } from "@/lib/utils";

interface StoreLocation {
  id: string;
  name: string;
  address?: string | null;
  quantity: number;
  price?: number;
}

interface StoreSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stores: StoreLocation[];
  onSelect: (storeId: string, storeName: string) => void;
  loading?: boolean;
}

export function StoreSelector({
  open,
  onOpenChange,
  stores,
  onSelect,
  loading = false,
}: StoreSelectorProps) {
  const [selectedStore, setSelectedStore] = useState<string>("");

  const handleSelect = () => {
    if (selectedStore) {
      const store = stores.find((s) => s.id === selectedStore);
      if (store) {
        onSelect(selectedStore, store.name);
        setSelectedStore("");
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Select Store
          </DialogTitle>
          <DialogDescription>
            Choose which store you want to buy from
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {stores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No stores have this item in stock</p>
            </div>
          ) : (
            <RadioGroup value={selectedStore} onValueChange={setSelectedStore}>
              <div className="space-y-3">
                {stores.map((store) => (
                  <div
                    key={store.id}
                    className={cn(
                      "flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all",
                      selectedStore === store.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/30"
                    )}
                  >
                    <RadioGroupItem value={store.id} id={store.id} />
                    <Label htmlFor={store.id} className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-start gap-2">
                        <div className="font-medium">{store.name}</div>
                        {store.price && (
                          <div className="font-bold text-primary">
                            R {store.price.toFixed(2)}
                          </div>
                        )}
                      </div>
                      {store.address && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {store.address}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground mt-1">
                        {store.quantity} units available
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSelect}
            disabled={!selectedStore || loading}
          >
            {loading ? "Adding..." : "Add to Cart"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
