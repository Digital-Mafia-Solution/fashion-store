import Link from "next/link";

export default function Footer() {
  return (
    // FIX: Added pb-24 for mobile to account for the fixed bottom navigation bar
    <footer className="w-full border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 py-8 pb-24 md:pb-8 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="text-center md:text-left">
          © {new Date().getFullYear()} Digital Mafia Fashion. All rights
          reserved.
        </div>

        <div className="flex flex-wrap gap-6 items-center justify-center">
          <Link
            href="/about"
            className="hover:text-foreground transition-colors hover:underline underline-offset-4"
          >
            About Us
          </Link>
          <Link
            href="/contact"
            className="hover:text-foreground transition-colors hover:underline underline-offset-4"
          >
            Contact
          </Link>
          <Link
            href="/policy/privacy"
            className="hover:text-foreground transition-colors hover:underline underline-offset-4"
          >
            Privacy Policy
          </Link>
          <Link
            href="/policy/terms"
            className="hover:text-foreground transition-colors hover:underline underline-offset-4"
          >
            Terms of Service
          </Link>
          <Link
            href="/policy/cookies"
            className="hover:text-foreground transition-colors hover:underline underline-offset-4"
          >
            Cookie Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
