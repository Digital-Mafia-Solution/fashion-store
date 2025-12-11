"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Json } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2, Plus, MapPin, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import AddressAutocomplete from "@/components/AddressAutocomplete";

interface SavedAddress {
  id?: string;
  address: string;
  default?: boolean;
}

interface SavedAddressesProps {
  userId?: string;
  onAddressSelect?: (address: string) => void;
  displayOnly?: boolean;
}

export function SavedAddresses({
  userId,
  onAddressSelect,
  displayOnly = false,
}: SavedAddressesProps) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const hasNotifiedDefault = useRef(false);

  const loadAddresses = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("billing_address")
        .eq("id", userId)
        .single();

      if (data?.billing_address) {
        const billingData = data.billing_address;
        let parsedAddresses: SavedAddress[] = [];

        if (typeof billingData === "string") {
          try {
            parsedAddresses = JSON.parse(billingData) as SavedAddress[];
          } catch {
            parsedAddresses = [];
          }
        } else if (Array.isArray(billingData)) {
          parsedAddresses = billingData as unknown as SavedAddress[];
        } else if (typeof billingData === "object" && billingData !== null) {
          // Handle legacy format with just one address
          const maybeAddr = billingData as { address?: string };
          parsedAddresses = [
            {
              id: "default",
              address: maybeAddr.address ?? "",
              default: true,
            },
          ];
        }

        const normalized = parsedAddresses.filter(Boolean).map((addr, idx) => ({
          ...addr,
          id: addr.id || `addr-${idx}`,
        }));

        setAddresses(normalized);

        const defaultAddr = normalized.find((a) => a.default);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id || "default");
          // Notify parent component of the default address only on initial load
          if (
            onAddressSelect &&
            defaultAddr.address &&
            !hasNotifiedDefault.current
          ) {
            onAddressSelect(defaultAddr.address);
            hasNotifiedDefault.current = true;
          }
        }
      }
    } catch (error) {
      console.error("Failed to load addresses", error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const handleAddAddress = async () => {
    if (!userId || !newAddress.trim()) {
      toast.error("Please select a valid address");
      return;
    }

    try {
      setLoading(true);
      const updatedAddresses: SavedAddress[] = [
        ...addresses,
        {
          id: `addr-${Date.now()}`,
          address: newAddress,
          default: addresses.length === 0,
        },
      ];

      const { error } = await supabase
        .from("profiles")
        .update({
          billing_address: updatedAddresses as unknown as Json,
        })
        .eq("id", userId);

      if (error) throw error;

      setAddresses(updatedAddresses);
      setNewAddress("");
      setShowAddDialog(false);
      toast.success("Address added successfully");
    } catch (error) {
      toast.error("Failed to add address");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!userId) return;

    try {
      setLoading(true);
      const updatedAddresses = addresses.map((addr) => ({
        ...addr,
        default: addr.id === id,
      }));

      const { error } = await supabase
        .from("profiles")
        .update({
          billing_address: updatedAddresses as unknown as Json,
        })
        .eq("id", userId);

      if (error) throw error;

      setAddresses(updatedAddresses);
      setSelectedAddressId(id);

      // Notify parent component of the new default address
      const selectedAddr = updatedAddresses.find((addr) => addr.id === id);
      if (selectedAddr && onAddressSelect) {
        onAddressSelect(selectedAddr.address);
      }

      toast.success("Default address updated");
    } catch (error) {
      toast.error("Failed to update default address");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!userId) return;

    try {
      setLoading(true);
      const updatedAddresses = addresses.filter((addr) => addr.id !== id);

      const { error } = await supabase
        .from("profiles")
        .update({
          billing_address: updatedAddresses as unknown as Json,
        })
        .eq("id", userId);

      if (error) throw error;

      setAddresses(updatedAddresses);
      if (selectedAddressId === id) {
        setSelectedAddressId(updatedAddresses[0]?.id || "");
      }
      toast.success("Address deleted");
    } catch (error) {
      toast.error("Failed to delete address");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAddress = (id: string) => {
    setSelectedAddressId(id);
    const selected = addresses.find((a) => a.id === id);
    if (selected && onAddressSelect) {
      onAddressSelect(selected.address);
    }
  };

  if (displayOnly && addresses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {addresses.length > 0 && (
        <div className="space-y-2">
          <Label className="text-base font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Saved Addresses
          </Label>
          <RadioGroup
            value={selectedAddressId}
            onValueChange={handleSelectAddress}
          >
            <div className="space-y-2">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <RadioGroupItem
                    value={address.id || ""}
                    id={address.id}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor={address.id}
                      className="text-sm font-medium cursor-pointer wrap-break-word"
                    >
                      {address.address}
                    </Label>
                    {address.default && (
                      <div className="text-xs text-primary font-medium flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Default Address
                      </div>
                    )}
                  </div>
                  {!displayOnly && (
                    <div className="flex gap-2 shrink-0">
                      {!address.default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(address.id || "")}
                          disabled={loading}
                          className="h-7 px-2 text-xs"
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAddress(address.id || "")}
                        disabled={loading}
                        className="h-7 px-2"
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
      )}

      {!displayOnly && (
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Add New Address
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Address</DialogTitle>
              <DialogDescription>
                Add a new delivery address to your profile
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Address</Label>
                <AddressAutocomplete
                  onAddressSelect={setNewAddress}
                  defaultValue={newAddress}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowAddDialog(false);
                    setNewAddress("");
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAddAddress}
                  disabled={loading || !newAddress.trim()}
                >
                  {loading ? "Adding..." : "Add Address"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {addresses.length === 0 && !displayOnly && (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-6 text-center">
            <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">
              No saved addresses yet
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
