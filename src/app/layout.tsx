import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "@/components/ui/sonner";
import CookieConsent from "@/components/CookieConsent";
import Analytics from "@/components/Analytics";
import { Suspense } from "react";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Splaza Online Store",
  description: "Get local, online.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Often used in PWAs to feel more like native apps
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CartProvider>
            <div className="flex flex-col min-h-screen">
              {/* FIX: Wrapped Navigation in Suspense to handle useSearchParams */}
              <Suspense
                fallback={<div className="h-16 border-b bg-background" />}
              >
                <Navigation />
              </Suspense>

              <main className="flex-1 w-full">{children}</main>
              <Footer />
            </div>
            <CookieConsent />
            <Toaster />
            <Suspense fallback={null}>
              <Analytics />
            </Suspense>

            <Script
              src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places`}
              strategy="beforeInteractive"
            />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
