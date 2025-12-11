"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
  maxStock: number;
  size?: string;
  storeId: string;
  storeName: string;
}

interface ProductInput {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  inventory: {
    quantity: number | null;
    locations: {
      id: string;
      name: string;
      type: string;
    } | null;
  }[];
}

type CartByStore = {
  [storeId: string]: CartItem[];
};

interface CartContextType {
  cart: CartItem[];
  cartByStore: CartByStore;
  addToCart: (
    product: ProductInput,
    storeId: string,
    storeName: string,
    size?: string,
    storePrice?: number | null
  ) => void;
  removeFromCart: (id: string, storeId: string, size?: string) => void;
  updateQuantity: (
    id: string,
    storeId: string,
    delta: number,
    size?: string
  ) => void;
  clearCart: () => void;
  clearStoreCart: (storeId: string) => void;
  cartCount: number;
  cartTotal: number;
  getStoreTotal: (storeId: string) => number;
  getStoreCartCount: (storeId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = localStorage.getItem("fashion_cart");
      if (saved) {
        try {
          setCart(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse cart", e);
        }
      }
      setIsInitialized(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("fashion_cart", JSON.stringify(cart));
    }
  }, [cart, isInitialized]);

  const addToCart = (
    product: ProductInput,
    storeId: string,
    storeName: string,
    size?: string,
    storePrice?: number | null
  ) => {
    const storeInventory = product.inventory?.find(
      (inv) => inv.locations?.id === storeId
    );
    const maxStock = storeInventory?.quantity ?? 0;

    if (maxStock <= 0) {
      toast.error("This item is not available at this store");
      return;
    }

    const price = storePrice ?? product.price;

    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.id === product.id &&
          item.storeId === storeId &&
          item.size === size
      );

      if (existing) {
        if (existing.quantity >= maxStock) {
          toast.error("Max stock reached for this item");
          return prev;
        }
        toast.success("Updated quantity in cart");
        return prev.map((item) =>
          item.id === product.id &&
          item.storeId === storeId &&
          item.size === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      toast.success("Added to cart");
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price,
          image_url: product.image_url,
          quantity: 1,
          maxStock,
          size,
          storeId,
          storeName,
        },
      ];
    });
  };

  const removeFromCart = (id: string, storeId: string, size?: string) => {
    setCart((prev) =>
      prev.filter((item) => {
        // Match if all conditions are true: same id, same storeId, same size (or both undefined)
        const isMatch =
          item.id === id &&
          item.storeId === storeId &&
          (item.size === size ||
            (item.size === undefined && size === undefined));
        return !isMatch;
      })
    );
    toast.info("Item removed");
  };

  const updateQuantity = (
    id: string,
    storeId: string,
    delta: number,
    size?: string
  ) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id && item.storeId === storeId && item.size === size) {
          const newQty = item.quantity + delta;
          if (newQty > item.maxStock) {
            toast.error("Max stock reached");
            return item;
          }
          if (newQty < 1) return item;
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("fashion_cart");
  };

  const clearStoreCart = (storeId: string) => {
    setCart((prev) => prev.filter((item) => item.storeId !== storeId));
  };

  const cartByStore: CartByStore = cart.reduce((acc, item) => {
    if (!acc[item.storeId]) {
      acc[item.storeId] = [];
    }
    acc[item.storeId].push(item);
    return acc;
  }, {} as CartByStore);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const getStoreTotal = (storeId: string): number => {
    return (cartByStore[storeId] || []).reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
  };

  const getStoreCartCount = (storeId: string): number => {
    return (cartByStore[storeId] || []).reduce(
      (acc, item) => acc + item.quantity,
      0
    );
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartByStore,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        clearStoreCart,
        cartCount,
        cartTotal,
        getStoreTotal,
        getStoreCartCount,
      }}
    >
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
