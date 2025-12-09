import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";

export const revalidate = 0;

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Index({ searchParams }: Props) {
  const { q } = await searchParams;

  // FIX: Select inventory and nested location data to satisfy TypeScript and logic requirements
  let query = supabase.from("products").select(`
    *,
    inventory (
      quantity,
      locations (
        type
      )
    )
  `);

  if (q && typeof q === "string") {
    // Search in both name and category
    query = query.or(`name.ilike.%${q}%,category.ilike.%${q}%`);
  }

  const { data: products } = await query;

  return (
    <div className="container mx-auto px-4 py-4 md:py-12 mb-20">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            {q ? `Results for "${q}"` : "Latest Drops"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {q
              ? "Found the following items matching your search."
              : "Fresh local fashion, available now."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {products?.map((product) => {
          // FIX: Calculate stock level from the fetched inventory array
          const stockLevel =
            product.inventory?.reduce(
              (sum, item) => sum + (item.quantity || 0),
              0
            ) ?? 0;
          const isSoldOut = stockLevel === 0;

          return (
            <div
              key={product.id}
              className="group relative flex flex-col gap-2"
            >
              <Link
                href={`/product/${product.id}`}
                className="absolute inset-0 z-10"
              >
                <span className="sr-only">View {product.name}</span>
              </Link>

              <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100 shadow-sm transition-all duration-300 group-hover:shadow-md">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No Image
                  </div>
                )}

                {/* FIX: Use calculated stock status */}
                {isSoldOut && (
                  <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded">
                    SOLD OUT
                  </div>
                )}
              </div>

              <div className="flex justify-between items-start mt-1">
                <div>
                  <h3 className="font-semibold text-lg leading-none tracking-tight group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {product.category || "Unisex"}
                  </p>
                </div>
                <div className="font-bold text-lg">
                  R {product.price?.toFixed(2)}
                </div>
              </div>

              <div className="z-20 mt-1">
                {/* FIX: Passed product (which now includes inventory) and disabled state based on calculation */}
                <AddToCartButton product={product} disabled={isSoldOut} />
              </div>
            </div>
          );
        })}

        {products?.length === 0 && (
          <div className="col-span-full text-center py-20 text-muted-foreground">
            No products found. Try a different search term.
          </div>
        )}
      </div>
    </div>
  );
}
