"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "./ui/button";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Prevent hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
        <span className="sr-only">Loading theme toggle</span>
      </Button>
    );
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="w-9 h-9 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      {resolvedTheme === "light" ? (
        // If light, show Moon (suggesting switch to dark)
        <Moon className="h-4 w-4 transition-all" />
      ) : (
        // If dark, show Sun (suggesting switch to light)
        <Sun className="h-4 w-4 transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}