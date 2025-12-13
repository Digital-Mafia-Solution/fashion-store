import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export const revalidate = 0;

export default async function CategoriesPage() {
  const { data: allProducts } = await supabase
    .from("products")
    .select("category, clothing_type, image_url")
    .eq("is_archived", false);

  // FIX: Update extraction logic for arrays
  const categoryMap = new Map<string, string>();
  allProducts?.forEach((p) => {
    if (p.category && Array.isArray(p.category)) {
      p.category.forEach((c) => {
        if (!categoryMap.has(c)) {
          categoryMap.set(c, p.image_url || "");
        }
      });
    }
    if (p.clothing_type) {
      if (!categoryMap.has(p.clothing_type)) {
        categoryMap.set(p.clothing_type, p.image_url || "");
      }
    }
  });
  const categories = Array.from(categoryMap.entries()).map(([name, image]) => ({
    name,
    image,
  }));

  return (
    <div className="container mx-auto px-4 py-8 mb-20">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Link>
      <h1 className="text-3xl font-bold mb-2">All Categories</h1>
      <p className="text-muted-foreground mb-8">
        Explore our full range of collections.
      </p>

      {categories.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={`/?q=${cat.name}`}
              className="group relative aspect-4/5 overflow-hidden rounded-lg bg-gray-100 block h-full w-full"
            >
              {cat.image ? (
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted" />
              )}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="inline-block px-3 py-1 bg-background/90 backdrop-blur rounded-full text-md font-bold shadow-sm">
                  {cat.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-lg">
          <p className="text-muted-foreground">No categories available.</p>
        </div>
      )}
    </div>
  );
}
