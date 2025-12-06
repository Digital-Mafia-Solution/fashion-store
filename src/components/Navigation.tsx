"use client";

import Link from "next/link";
import { ShoppingBag, Search, Menu, X, User, LogOut } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { User as SupabaseUser } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
  };

  return (
    // FIX: Added text-foreground to header
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur text-foreground supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="font-bold text-xl flex items-center gap-2 shrink-0 group">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground shadow-sm group-hover:bg-primary/90 transition-colors">
            DM
          </div>
          {/* FIX: Explicit text color */}
          <span className="hidden sm:inline-block tracking-tight text-foreground group-hover:text-primary transition-colors">
            Fashion Market
          </span>
        </Link>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for local drops..."
            // FIX: Added border-input and proper background colors
            className="pl-10 w-full bg-muted/50 border-input text-foreground placeholder:text-muted-foreground focus-visible:bg-background focus-visible:ring-primary/20 transition-all"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />

          <Button variant="ghost" size="icon" className="relative text-foreground hover:text-primary" asChild>
            <Link href="/cart">
              <ShoppingBag className="h-5 w-5" />
              <span className="sr-only">Cart</span>
            </Link>
          </Button>

          {/* User Menu */}
          <div className="hidden md:flex ml-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full text-foreground hover:text-primary">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Orders</DropdownMenuItem>
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" asChild className="text-primary-foreground">
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </div>
          
           {/* Mobile Menu Toggle */}
           <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      
       {/* Mobile Menu Dropdown */}
       {isMenuOpen && (
         <div className="md:hidden border-t border-border p-4 space-y-4 bg-background text-foreground absolute w-full shadow-xl animate-in slide-in-from-top-2">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-10 bg-muted/50 border-input" />
           </div>
           <nav className="flex flex-col gap-1">
             <Link 
               href="/about" 
               className="text-sm font-medium px-4 py-3 rounded-md hover:bg-muted transition-colors"
               onClick={() => setIsMenuOpen(false)}
             >
               About Us
             </Link>
             <Link 
               href="/contact" 
               className="text-sm font-medium px-4 py-3 rounded-md hover:bg-muted transition-colors"
               onClick={() => setIsMenuOpen(false)}
             >
               Contact Support
             </Link>
             <div className="border-t border-border my-2 pt-2">
                <Link 
                  href="/login" 
                  className="flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-md hover:bg-muted transition-colors text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-4 h-4" /> Sign In / Register
                </Link>
             </div>
           </nav>
         </div>
       )}
    </header>
  );
}