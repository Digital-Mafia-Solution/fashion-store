"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const url = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      console.log(`[Mock Analytics] Pageview: ${url}`);
    }
  }, [pathname, searchParams]);

  return null;
}