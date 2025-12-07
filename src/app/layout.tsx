import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Fashion Store",
  description: "Local fashion, online.",
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
                <Navigation />
                <main className="flex-1 w-full">
                  {children}
                </main>
                <Footer />
              </div>
              <Toaster />
            </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}