import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductActions } from "./components/ProductActions";
import { Tables } from "@/lib/database.types";

export const revalidate = 0;

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

type ProductWithInventory = Tables<"products"> & {
  inventory:
    | (Tables<"inventory"> & {
        locations: Tables<"locations"> | null;
      })[]
    | null;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  const { data: product, error } = await supabase
    .from("products")
    .select(
      `
      *,
      inventory (
        id,
        price,
        quantity,
        size_name,
        locations (
          id,
          name,
          type
        )
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !product) {
    return notFound();
  }

  const typedProduct = product as ProductWithInventory;

  const totalStock =
    typedProduct.inventory?.reduce((sum, item) => {
      const isStore = item.locations?.type === "store";
      return isStore ? sum + (item.quantity ?? 0) : sum;
    }, 0) || 0;

  // FIX: Use array directly and include clothing_type
  const categories = [
    ...(typedProduct.category && typedProduct.category.length > 0
      ? typedProduct.category
      : []),
    ...(typedProduct.clothing_type ? [typedProduct.clothing_type] : []),
  ];

  const displayCategories = categories.length > 0 ? categories : ["Unisex"];

  return (
    <div className="container mx-auto px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to drops
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="aspect-4/5 bg-muted rounded-xl relative overflow-hidden shadow-sm">
          {typedProduct.image_url ? (
            <Image
              src={typedProduct.image_url}
              alt={typedProduct.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No Image
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                {displayCategories.map((cat, i) => (
                  <span
                    key={i}
                    className="text-xs font-semibold text-primary uppercase tracking-wide bg-primary/10 px-2 py-1 rounded"
                  >
                    {cat}
                  </span>
                ))}
              </div>
              <h1 className="text-4xl font-extrabold mt-1 tracking-tight">
                {typedProduct.name}
              </h1>
            </div>
            <div className="text-3xl font-bold whitespace-nowrap">
              R{" "}
              {typedProduct.inventory && typedProduct.inventory.length > 0
                ? Math.min(
                    ...typedProduct.inventory.map((inv) => inv.price)
                  ).toFixed(2)
                : "0.00"}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Badge
              variant={totalStock > 0 ? "secondary" : "destructive"}
              className="text-sm px-3 py-1"
            >
              {totalStock > 0 ? "In Stock" : "Sold Out"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              SKU: {typedProduct.sku}
            </span>
          </div>

          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            {typedProduct.description}
          </p>

          <div className="mt-8 border-t pt-8">
            <ProductActions product={typedProduct} totalStock={totalStock} />
          </div>
        </div>
      </div>
    </div>
  );
}
