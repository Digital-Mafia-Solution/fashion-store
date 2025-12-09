import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { MobileCarousel } from "@/components/MobileCarousel";
import { CarouselItem } from "@/components/ui/carousel";

export const revalidate = 0;

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Index({ searchParams }: Props) {
  const { q } = await searchParams;

  if (q && typeof q === "string") {
    let query = supabase.from("products").select(`
      *,
      inventory ( quantity, locations ( type ) )
    `);

    // FIX: Updated search logic for Arrays.
    // Checks if name contains 'q' OR if category array contains the tag 'q'
    query = query.or(`name.ilike.%${q}%,category.cs.{${q}}`);

    const { data: products } = await query;

    return (
      <div className="container mx-auto px-4 py-4 md:py-12 mb-20">
        <div className="mb-8">
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            Results for &quot;{q}&quot;
          </h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            Found {products?.length || 0} items matching your search.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-8">
          {products?.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    );
  }

  // --- HOME VIEW ---

  const { data: latestProducts } = await supabase
    .from("products")
    .select(`*, inventory ( quantity, locations ( type ) )`)
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: popularProducts } = await supabase
    .from("products")
    .select(`*, inventory ( quantity, locations ( type ) )`)
    .order("price", { ascending: false })
    .limit(6);

  const { data: allProducts } = await supabase
    .from("products")
    .select("category, image_url");

  // FIX: Updated Category Logic for Arrays
  const categoryMap = new Map<string, string>();
  allProducts?.forEach((p) => {
    if (p.category && Array.isArray(p.category)) {
      p.category.forEach((c) => {
        if (!categoryMap.has(c)) {
          categoryMap.set(c, p.image_url || "");
        }
      });
    }
  });
  const categories = Array.from(categoryMap.entries()).map(([name, image]) => ({
    name,
    image,
  }));

  const renderSection = (
    title: string,
    subtitle: string,
    link: string,
    content: React.ReactNode,
    mobileContent: React.ReactNode
  ) => (
    <section>
      <div className="flex justify-between items-end mb-4 md:mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {title}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
        </div>
        <Button variant="ghost" className="hidden lg:flex" asChild>
          <Link href={link}>
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="lg:hidden">
        <MobileCarousel>{mobileContent}</MobileCarousel>
        <div className="mt-4">
          <Button variant="outline" className="w-full" asChild>
            <Link href={link}>View All {title}</Link>
          </Button>
        </div>
      </div>

      <div className="hidden lg:grid lg:grid-cols-6 gap-8">{content}</div>
    </section>
  );

  return (
    <div className="container mx-auto px-4 py-4 md:py-12 mb-20 space-y-12 md:space-y-16">
      {renderSection(
        "Latest Drops",
        "Fresh local fashion, just landed.",
        "/products/latest",
        latestProducts?.map((p) => <ProductCard key={p.id} product={p} />),
        latestProducts?.map((p) => (
          <CarouselItem key={p.id} className="basis-1/2 md:basis-1/3 pl-4">
            <ProductCard product={p} />
          </CarouselItem>
        ))
      )}

      {renderSection(
        "Popular",
        "Top rated styles this week.",
        "/products/popular",
        popularProducts?.map((p) => <ProductCard key={p.id} product={p} />),
        popularProducts?.map((p) => (
          <CarouselItem key={p.id} className="basis-1/2 md:basis-1/3 pl-4">
            <ProductCard product={p} />
          </CarouselItem>
        ))
      )}

      {renderSection(
        "Categories",
        "Browse by collection.",
        "/categories",
        categories.map((cat) => (
          <CategoryCard key={cat.name} name={cat.name} image={cat.image} />
        )),
        categories.map((cat) => (
          <CarouselItem key={cat.name} className="basis-1/2 md:basis-1/3 pl-4">
            <CategoryCard name={cat.name} image={cat.image} />
          </CarouselItem>
        ))
      )}
    </div>
  );
}

function CategoryCard({ name, image }: { name: string; image: string }) {
  return (
    <Link
      href={`/?q=${name}`}
      className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 block h-full w-full"
    >
      {image ? (
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
          sizes="(max-width: 768px) 50vw, 16vw"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted" />
      )}
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
      <div className="absolute bottom-4 left-4 right-4">
        <span className="inline-block px-3 py-1 bg-background/90 backdrop-blur rounded-full text-xs font-bold shadow-sm">
          {name}
        </span>
      </div>
    </Link>
  );
}
