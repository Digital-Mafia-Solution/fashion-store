import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Tables } from "@/lib/database.types";

type ProductWithInventory = Tables<"products"> & {
  inventory:
    | {
        quantity: number | null;
        locations: {
          type: "store" | "warehouse" | "virtual_courier";
        } | null;
      }[]
    | null;
};

interface ProductCardProps {
  product: ProductWithInventory;
}

export function ProductCard({ product }: ProductCardProps) {
  const stockLevel =
    product.inventory?.reduce(
      (sum: number, item) => sum + (item.quantity || 0),
      0
    ) ?? 0;
  const isSoldOut = stockLevel === 0;

  // FIX: Handle category array - show first item or "Unisex"
  const primaryCategory =
    product.category && product.category.length > 0
      ? product.category[0]
      : "Unisex";

  return (
    <div className="group relative flex flex-col gap-2 h-full">
      <Link href={`/product/${product.id}`} className="absolute inset-0 z-10">
        <span className="sr-only">View {product.name}</span>
      </Link>

      <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100 shadow-sm transition-all duration-300 group-hover:shadow-md">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}

        {isSoldOut && (
          <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-1 rounded">
            SOLD OUT
          </div>
        )}
      </div>

      <div className="flex flex-col gap-0.5 mt-1">
        <h3 className="font-semibold text-sm md:text-base leading-tight truncate group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <p className="text-xs text-muted-foreground truncate">
          {primaryCategory}
        </p>
        <div className="font-bold text-sm md:text-base mt-1 whitespace-nowrap">
          R {product.price?.toFixed(2)}
        </div>
      </div>

      <div className="z-20 mt-auto pt-2">
        <Button
          asChild
          className="w-full"
          variant={isSoldOut ? "outline" : "default"}
          disabled={isSoldOut}
        >
          <Link href={`/product/${product.id}`}>
            {isSoldOut ? "Sold Out" : "View Details"}
          </Link>
        </Button>
      </div>
    </div>
  );
}
