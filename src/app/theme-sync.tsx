"use client";

import { useEffect } from "react";

export default function ThemeSync() {
  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme) {
      document.cookie = `theme=${theme}; path=/; SameSite=Lax`;
    }
  }, []);

  return null;
}
