import { supabase } from "@/lib/supabase";
import { ProductCard } from "@/components/ProductCard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const revalidate = 0;

export default async function PopularProductsPage() {
  const { data: products } = await supabase
    .from("products")
    .select(`*, inventory ( quantity, locations ( type ) )`)
    .order("price", { ascending: false })
    .limit(50);

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 mb-20">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Link>
      <h1 className="text-3xl font-bold mb-2">Popular</h1>
      <p className="text-muted-foreground mb-8">
        What everyone is wearing right now.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
        {products?.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
