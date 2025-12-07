"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { toast } from "sonner";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
  maxStock: number;
}

// FIX: Allow nullable types from DB
interface ProductInput {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  inventory: {
    quantity: number | null; // Allow null
    locations: {
      type: string;
    } | null;
  }[];
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: ProductInput) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("fashion_cart");
      try {
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        console.error("Failed to parse cart", e);
        return [];
      }
    }
    return [];
  });

  // FIX: Use useRef instead of useState to track mounting. 
  // This avoids the "set-state-in-effect" lint error and prevents re-renders.
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    localStorage.setItem("fashion_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: ProductInput) => {
    const totalStock = product.inventory?.reduce((sum, item) => {
       const isStore = item.locations?.type === 'store';
       // Handle null quantity safely
       return isStore ? sum + (item.quantity ?? 0) : sum;
    }, 0) || 0;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      
      if (existing) {
        if (existing.quantity >= totalStock) {
          toast.error("Max stock reached for this item");
          return prev;
        }
        toast.success("Updated quantity in cart");
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      toast.success("Added to cart");
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: 1,
        maxStock: totalStock
      }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    toast.info("Item removed");
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => prev.map((item) => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty > item.maxStock) {
          toast.error("Max stock reached");
          return item;
        }
        if (newQty < 1) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("fashion_cart");
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};