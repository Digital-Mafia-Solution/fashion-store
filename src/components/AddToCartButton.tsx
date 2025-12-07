"use client";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";

interface AddToCartProps {
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    inventory: {
      quantity: number | null; // <--- FIX: Allow null
      locations: {
        type: string;
      } | null;
    }[];
  };
  disabled: boolean;
}

export default function AddToCartButton({ product, disabled }: AddToCartProps) {
  const { addToCart } = useCart();
  
  return (
    <Button 
      size="lg" 
      className="w-full text-lg h-14" 
      disabled={disabled}
      onClick={() => addToCart(product)}
    >
      Add to Order
    </Button>
  );
}