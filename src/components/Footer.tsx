import Link from "next/link";

export default function Footer() {
  return (
    // FIX: Use semantic colors (bg-background) and border-border
    <footer className="w-full border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 py-8 mt-auto">
      {/* FIX: Use px-4 to align with Header and Main Content */}
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div>
          © {new Date().getFullYear()} Digital Mafia Fashion. All rights reserved.
        </div>
        
        <div className="flex flex-wrap gap-6 items-center justify-center">
          <Link href="/policy/privacy" className="hover:text-foreground transition-colors hover:underline underline-offset-4">
            Privacy Policy
          </Link>
          <Link href="/policy/terms" className="hover:text-foreground transition-colors hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="/policy/cookies" className="hover:text-foreground transition-colors hover:underline underline-offset-4">
            Cookie Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}