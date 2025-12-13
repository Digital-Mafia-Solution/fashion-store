"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Provider = {
  id: string;
  name: string;
  service: string;
  fee: number;
  eta_days?: number;
  metadata?: Record<string, unknown>;
};

export default function DeliveryProviderSelector({
  address,
  weightGrams,
  onSelect,
  selectedProviderId,
}: {
  address: string;
  weightGrams: number;
  onSelect: (p: Provider | null) => void;
  selectedProviderId?: string | null;
}) {
  const [providers, setProviders] = useState<Provider[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!address || !weightGrams) {
        setProviders(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/delivery/providers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, weight_grams: weightGrams }),
        });
        const json = await res.json();
        if (!res.ok)
          throw new Error(json?.error || "Failed to fetch providers");
        if (mounted) {
          const provs = json.providers || [];
          setProviders(provs);
          // auto-select first provider if none selected yet
          if (provs.length > 0 && !selectedProviderId) {
            onSelect(provs[0]);
          }
        }
      } catch (err: unknown) {
        console.error("Failed to load providers", err);
        if (mounted) setError("Could not load delivery options");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [address, weightGrams, onSelect, selectedProviderId]);

  return (
    <div className="space-y-3">
      <h4 className="font-medium">Delivery options</h4>
      {!address && (
        <div className="text-sm text-muted-foreground">
          Enter an address to see courier options.
        </div>
      )}
      {loading && (
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Fetching delivery
          options...
        </div>
      )}

      {error && <div className="text-sm text-destructive">{error}</div>}

      {providers && providers.length === 0 && (
        <div className="text-sm text-muted-foreground">
          No courier options available for this address.
        </div>
      )}

      {providers && providers.length > 0 && (
        <div className="grid gap-2">
          {providers.map((p) => (
            <div
              key={p.id}
              className={
                "p-3 border rounded-md flex items-center justify-between cursor-pointer " +
                (selectedProviderId === p.id
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50")
              }
              onClick={() => onSelect(p)}
            >
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">
                  {p.service} · ETA {p.eta_days} day(s)
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* allow deselect */}
      {providers && providers.length > 0 && (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onSelect(null)}>
            Clear selection
          </Button>
        </div>
      )}
    </div>
  );
}
