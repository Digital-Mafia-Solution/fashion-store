import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

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
            <div className="flex flex-col min-h-screen">
              <Navigation />
              
              {/* FIX: Removed 'container mx-auto px-4 py-8' */}
              {/* The layout now just provides the flex space. The Page handles the width. */}
              <main className="flex-1 w-full">
                {children}
              </main>
              
              <Footer />
            </div>
        </ThemeProvider>
      </body>
    </html>
  );
}