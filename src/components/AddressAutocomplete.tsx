"use client";

import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

interface AddressAutocompleteProps {
  onAddressSelect: (address: string, lat: number, lng: number) => void;
  defaultValue?: string;
  error?: string;
}

export default function AddressAutocomplete({ onAddressSelect, defaultValue = "", error }: AddressAutocompleteProps) {
  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: "za" }, // Restrict to South Africa
    },
    debounce: 300,
    defaultValue,
  });

  const [isOpen, setIsOpen] = useState(false);

  // Sync with default value if provided
  useEffect(() => {
    if (defaultValue) setValue(defaultValue, false);
  }, [defaultValue, setValue]);

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();
    setIsOpen(false);

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      onAddressSelect(address, lat, lng);
    } catch (error) {
      console.error("Error: ", error);
    }
  };

  return (
    <div className="space-y-2 relative">
      <Label>Delivery Address</Label>
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setIsOpen(true);
          }}
          disabled={!ready}
          placeholder="Start typing your street address..."
          className={error ? "border-red-500 pl-10" : "pl-10"}
          autoComplete="off" // Prevent browser autocomplete fighting Google
        />
        {/* Status Icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
             {!ready ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
        </div>
      </div>
      
      {error && <span className="text-xs text-red-500">{error}</span>}

      {/* Suggestions Dropdown */}
      {status === "OK" && isOpen && (
        <ul className="absolute z-50 w-full bg-popover border rounded-md shadow-lg mt-1 max-h-60 overflow-auto animate-in fade-in-0 zoom-in-95">
          {data.map(({ place_id, description }) => (
            <li
              key={place_id}
              onClick={() => handleSelect(description)}
              className="px-4 py-3 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm border-b last:border-b-0 transition-colors"
            >
              {description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}