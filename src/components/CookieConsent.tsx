"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Delay check to avoid hydration mismatch
    const timer = setTimeout(() => {
      const consent = localStorage.getItem("cookie_consent");
      if (!consent) setShow(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const accept = () => {
    localStorage.setItem("cookie_consent", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border shadow-2xl z-50 animate-in slide-in-from-bottom-5">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground text-center sm:text-left">
          We use cookies to improve your experience and manage the shopping cart.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShow(false)}>
            Decline
          </Button>
          <Button size="sm" onClick={accept}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}