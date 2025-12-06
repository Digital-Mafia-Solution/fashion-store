import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t mt-12 py-6 bg-white/80 dark:bg-gray-900/80">
      <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-600 dark:text-gray-300">
        <div>
          © {new Date().getFullYear()} Boilerplate. All rights reserved.
        </div>
        <div className="flex flex-wrap gap-3 items-center justify-center">
          <Link href="/policy/privacy" className="hover:underline">
            Privacy
          </Link>
          <Link href="/policy/terms" className="hover:underline">
            Terms
          </Link>
          <Link href="/policy/cookies" className="hover:underline">
            Cookies
          </Link>
        </div>
      </div>
    </footer>
  );
}
