"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";

export function RefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Revalidate the page data without full page reload
      await fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).catch(() => {
        // If API doesn't exist, do a soft refresh
        window.location.reload();
      });

      // Wait a moment for revalidation
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Refresh the page
      window.location.reload();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleRefresh}
      disabled={isRefreshing}
      title="Refresh products"
    >
      <RotateCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
    </Button>
  );
}
