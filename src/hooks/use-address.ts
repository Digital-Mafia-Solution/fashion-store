import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";

interface AddressResult {
  display_name: string;
  lat: string;
  lon: string;
}

export function useAddressSearch() {
  const [results, setResults] = useState<AddressResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search to prevent API spamming
  const searchAddress = useDebouncedCallback(async (query: string) => {
    if (query.length < 3) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      // FIX: Restrict to South Africa (countrycodes=za)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=za&addressdetails=1`,
        {
            headers: {
                "User-Agent": "FashionStore/1.0"
            }
        }
      );
      
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      setResults(data);
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, 500); // 500ms delay

  return { results, searchAddress, isSearching, setResults };
}