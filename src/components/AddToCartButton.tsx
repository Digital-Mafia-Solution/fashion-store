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
  selectedSize?: string; // ADDED
}

export default function AddToCartButton({
  product,
  disabled,
  className,
  variant = "default",
  selectedSize,
}: AddToCartProps) {
  const { addToCart } = useCart();

  return (
    <Button
      variant={variant}
      className={className}
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();

        // Validation for size
        // If sizes exist but none selected, this logic needs to be handled by the parent page usually disabling the button,
        // but as a safeguard we check if 'selectedSize' is undefined when it might be needed.
        // For this component, we just pass what we have.

        addToCart(product, selectedSize);
      }}
    >
      <ShoppingCart className="mr-2 h-4 w-4" /> Add
    </Button>
  );
}
