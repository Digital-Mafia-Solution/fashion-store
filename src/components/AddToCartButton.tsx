"use client";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { ShoppingCart } from "lucide-react";

interface AddToCartProps {
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    inventory: {
      quantity: number | null;
      locations: {
        type: string;
      } | null;
    }[];
  };
  disabled: boolean;
  className?: string;
  variant?: "default" | "outline" | "secondary";
}

export default function AddToCartButton({ product, disabled, className, variant = "default" }: AddToCartProps) {
  const { addToCart } = useCart();
  
  return (
    <Button 
      variant={variant}
      className={className}
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(product);
      }}
    >
      <ShoppingCart className="mr-2 h-4 w-4" /> Add
    </Button>
  );
}