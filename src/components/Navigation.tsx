"use client";

import Link from "next/link";
import {
  ShoppingBag,
  Search,
  User,
  LogOut,
  Home,
  ListOrdered,
  UserCircle,
} from "lucide-react";
import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useCart } from "@/context/CartContext";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Logo from "../app/logo.svg";

export default function Navigation() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const { cartCount } = useCart();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get("q")?.toString().trim();

    const params = new URLSearchParams(searchParams);
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    router.push(`/?${params.toString()}`);
  };

  // FIX 1: Wrap setMounted in setTimeout to avoid synchronous render warning
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // FIX 2: Check for reset requirement asynchronously
  useEffect(() => {
    const checkResetStatus = () => {
      // 1. Check URL flag from callback
      if (searchParams.get("reset_required") === "true") {
        sessionStorage.setItem("dmf_reset_lock", "true");
        setIsResetMode(true);
      }

      // 2. Check Session Storage (Persist across reloads)
      const isLocked = sessionStorage.getItem("dmf_reset_lock") === "true";
      if (isLocked) {
        setIsResetMode(true);
        // 3. Enforce Lock: If locked and not on update-password, redirect back
        if (pathname !== "/update-password") {
          router.replace("/update-password");
        }
      } else {
        setIsResetMode(false);
      }
    };

    const timer = setTimeout(checkResetStatus, 0);
    return () => clearTimeout(timer);
  }, [searchParams, pathname, router]);

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", userId)
        .single();

      if (data) setAvatarUrl(data.avatar_url);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      if (event === "PASSWORD_RECOVERY") {
        sessionStorage.setItem("dmf_reset_lock", "true");
        setIsResetMode(true);
        router.replace("/update-password");
      }

      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setAvatarUrl(null);
        if (event === "SIGNED_OUT") {
          router.replace("/login");
          router.refresh();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem("dmf_reset_lock");
    setIsResetMode(false);
    toast.success("Logged out successfully");
    router.push("/");
    router.refresh();
  };

  // Minimal Header for Reset Mode
  if (isResetMode) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur text-foreground">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="font-bold text-xl flex items-center gap-2 shrink-0 group"
          >
            <Image
              src={Logo}
              width={32}
              height={32}
              className="w-8 h-8 rounded-md flex items-center justify-center text-primary-foreground shadow-sm"
              alt="Splaza Logo"
            />
            <span className="hidden sm:inline-block tracking-tight text-foreground">
              Splaza
            </span>
          </Link>
          <Button variant="ghost" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* --- TOP NAVIGATION (Desktop & Mobile Header) --- */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur text-foreground supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="font-bold text-xl flex items-center gap-2 shrink-0 group"
          >
            <Image
              src={Logo}
              width={32}
              height={32}
              className="w-8 h-8 rounded-md flex items-center justify-center text-primary-foreground shadow-sm"
              alt="Splaza Logo"
            />
            <span className="hidden sm:inline-block tracking-tight text-foreground">
              Splaza
            </span>
          </Link>

          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-md relative mx-2"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Search drops..."
              className="pl-10 w-full bg-muted/50 border-input text-foreground placeholder:text-muted-foreground focus-visible:bg-background focus-visible:ring-primary/20 transition-all h-10"
              key={searchParams.get("q")}
              defaultValue={searchParams.get("q") || ""}
            />
          </form>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <Button
              variant="ghost"
              size="icon"
              className="relative hidden md:flex"
              asChild
            >
              <Link href="/cart">
                <ShoppingBag className="h-5 w-5" />
                {mounted && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] flex items-center justify-center text-primary-foreground font-bold">
                    {cartCount}
                  </span>
                )}
              </Link>
            </Button>

            <div className="hidden md:flex ml-2">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full h-8 w-8 p-0"
                    >
                      <Avatar className="h-8 w-8 cursor-pointer border border-border">
                        <AvatarImage src={avatarUrl || ""} alt="User" />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/orders">My Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Profile Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button size="sm" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* --- BOTTOM NAVIGATION (Mobile Only) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-safe">
        <div className="flex justify-around items-center h-16">
          <Link
            href="/"
            className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground hover:text-primary active:text-primary"
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>

          <Link
            href="/cart"
            className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground hover:text-primary active:text-primary relative"
          >
            <div className="relative">
              <ShoppingBag className="h-5 w-5" />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-1 -right-2 h-3.5 w-3.5 rounded-full bg-primary text-[9px] flex items-center justify-center text-primary-foreground font-bold">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">Cart</span>
          </Link>

          {user ? (
            <>
              <Link
                href="/orders"
                className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground hover:text-primary active:text-primary"
              >
                <ListOrdered className="h-5 w-5" />
                <span className="text-[10px] font-medium">Orders</span>
              </Link>
              <Link
                href="/profile"
                className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground hover:text-primary active:text-primary"
              >
                <UserCircle className="h-5 w-5" />
                <span className="text-[10px] font-medium">Profile</span>
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground hover:text-primary active:text-primary"
            >
              <UserCircle className="h-5 w-5" />
              <span className="text-[10px] font-medium">Sign In</span>
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
