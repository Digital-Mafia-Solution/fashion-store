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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCart } from "@/context/CartContext";


export default function Navigation() {
  const { cartCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    // FIX: Define the function INSIDE the effect, before it is called.
    const fetchProfile = async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", userId)
        .single();
      
      if (data) setAvatarUrl(data.avatar_url);
    };

    // 1. Get Auth User
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    // 2. Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setAvatarUrl(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    setAvatarUrl(null);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur text-foreground supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="font-bold text-xl flex items-center gap-2 shrink-0 group">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground shadow-sm group-hover:bg-primary/90 transition-colors">
            DM
          </div>
          <span className="hidden sm:inline-block tracking-tight text-foreground group-hover:text-primary transition-colors">
            Fashion Market
          </span>
        </Link>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for local drops..."
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
              {/* Add Badge */}
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] flex items-center justify-center text-primary-foreground font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
          </Button>

          {/* User Menu */}
          <div className="hidden md:flex ml-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                    <Avatar className="h-8 w-8 cursor-pointer border border-border">
                      <AvatarImage src={avatarUrl || ""} alt="User" />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/orders">My Orders</Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/profile">Profile Settings</Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
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
                {user ? (
                  <>
                    <Link 
                      href="/profile" 
                      className="flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-md hover:bg-muted transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="w-4 h-4" /> My Profile
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-md hover:bg-muted transition-colors text-destructive"
                    >
                      <LogOut className="w-4 h-4" /> Log Out
                    </button>
                  </>
                ) : (
                  <Link 
                    href="/login" 
                    className="flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-md hover:bg-muted transition-colors text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-4 h-4" /> Sign In / Register
                  </Link>
                )}
             </div>
           </nav>
         </div>
       )}
    </header>
  );
}