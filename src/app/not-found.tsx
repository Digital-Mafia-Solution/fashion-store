import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-[60vh] px-4 py-12 mx-auto text-center gap-4">
      <div className="rounded-full bg-muted p-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
      </div>

      <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
        404
      </h1>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">Page not found</h2>
        <p className="text-muted-foreground max-w-[400px]">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It
          might have been removed or the link might be broken.
        </p>
      </div>

      <div className="flex gap-4 mt-4">
        <Button asChild>
          <Link href="/">Return Home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/contact">Contact Support</Link>
        </Button>
      </div>
    </div>
  );
}
