import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { MobileCarousel } from "@/components/MobileCarousel";
import { CarouselItem } from "@/components/ui/carousel";
import { ProductFilters } from "@/components/ProductFilters";
import { Tables } from "@/lib/database.types";

export const revalidate = 0;

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Define the precise type that matches the join query structure
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

export default async function Index({ searchParams }: Props) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" ? params.category : "";
  const sort = typeof params.sort === "string" ? params.sort : "recency";
  const min = typeof params.min === "string" ? Number(params.min) : 0;
  const max = typeof params.max === "string" ? Number(params.max) : 100000;

  // Check if we are in "Filtered Mode" (any filter active)
  const isFiltered = !!(
    q ||
    category ||
    (sort && sort !== "recency") ||
    params.min ||
    params.max
  );

  // --- FETCH ALL CATEGORIES ---
  // Needed for the filter dropdown
  const { data: allProductsCategories } = await supabase
    .from("products")
    .select("category");

  const categorySet = new Set<string>();
  allProductsCategories?.forEach((p) => {
    if (p.category && Array.isArray(p.category)) {
      p.category.forEach((c) => categorySet.add(c));
    }
  });
  const categories = Array.from(categorySet).sort();

  // --- FETCH FILTERED PRODUCTS ---
  let query = supabase.from("products").select(`
    *,
    inventory ( quantity, locations ( type ) )
  `);

  if (q) {
    query = query.or(`name.ilike.%${q}%,category.cs.{${q}}`);
  }

  if (category) {
    query = query.contains("category", [category]);
  }

  if (params.min || params.max) {
    query = query.gte("price", min).lte("price", max);
  }

  // Sorting
  switch (sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "recency":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  // Fix: Explicitly type the variables instead of using any[]
  let filteredProducts: ProductWithInventory[] | null = null;
  if (isFiltered) {
    const { data } = await query;
    filteredProducts = data as ProductWithInventory[] | null;
  }

  // --- STANDARD HOME SECTIONS (FETCHED IF NOT FILTERED) ---
  let latestProducts: ProductWithInventory[] | null = null;
  let popularProducts: ProductWithInventory[] | null = null;
  let homeCategories: { name: string; image: string }[] = [];

  if (!isFiltered) {
    // Fetch Latest
    const latestRes = await supabase
      .from("products")
      .select(`*, inventory ( quantity, locations ( type ) )`)
      .order("created_at", { ascending: false })
      .limit(6);
    latestProducts = latestRes.data as ProductWithInventory[] | null;

    // Fetch Popular
    const popularRes = await supabase
      .from("products")
      .select(`*, inventory ( quantity, locations ( type ) )`)
      .order("price", { ascending: false })
      .limit(6);
    popularProducts = popularRes.data as ProductWithInventory[] | null;

    // Fetch Category Images
    const allProdsRes = await supabase
      .from("products")
      .select("category, image_url");
    const categoryMap = new Map<string, string>();
    allProdsRes.data?.forEach((p) => {
      if (p.category && Array.isArray(p.category)) {
        p.category.forEach((c) => {
          if (!categoryMap.has(c)) {
            categoryMap.set(c, p.image_url || "");
          }
        });
      }
    });
    homeCategories = Array.from(categoryMap.entries()).map(([name, image]) => ({
      name,
      image,
    }));
  }

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
    <ProductFilters categories={categories}>
      <div className="container mx-auto px-4 py-4 md:py-12 mb-20 space-y-12 md:space-y-16">
        {isFiltered ? (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {q
                  ? `Results for "${q}"`
                  : category
                  ? `${category} Collection`
                  : "All Products"}
              </h1>
              <p className="text-muted-foreground mt-2 text-sm md:text-base">
                Found {filteredProducts?.length || 0} items.
              </p>
            </div>

            {filteredProducts && filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-8">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/20 rounded-lg">
                <p className="text-muted-foreground">
                  No products found matching your filters.
                </p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/">Clear Filters</Link>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            {renderSection(
              "Latest Drops",
              "Fresh local fashion, just landed.",
              "/?sort=recency",
              latestProducts?.map((p) => (
                <ProductCard key={p.id} product={p} />
              )),
              latestProducts?.map((p) => (
                <CarouselItem
                  key={p.id}
                  className="basis-1/2 md:basis-1/3 pl-4"
                >
                  <ProductCard product={p} />
                </CarouselItem>
              ))
            )}

            {renderSection(
              "Popular",
              "Top rated styles this week.",
              "/?sort=price_desc",
              popularProducts?.map((p) => (
                <ProductCard key={p.id} product={p} />
              )),
              popularProducts?.map((p) => (
                <CarouselItem
                  key={p.id}
                  className="basis-1/2 md:basis-1/3 pl-4"
                >
                  <ProductCard product={p} />
                </CarouselItem>
              ))
            )}

            {renderSection(
              "Categories",
              "Browse by collection.",
              "/categories",
              homeCategories.map((cat) => (
                <CategoryCard
                  key={cat.name}
                  name={cat.name}
                  image={cat.image}
                />
              )),
              homeCategories.map((cat) => (
                <CarouselItem
                  key={cat.name}
                  className="basis-1/2 md:basis-1/3 pl-4"
                >
                  <CategoryCard name={cat.name} image={cat.image} />
                </CarouselItem>
              ))
            )}
          </>
        )}
      </div>
    </ProductFilters>
  );
}

function CategoryCard({ name, image }: { name: string; image: string }) {
  return (
    <Link
      href={`/?category=${name}`}
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
        <span className="inline-block px-3 py-1 bg-background/90 backdrop-blur rounded-full text-xs font-bold shadow-sm capitalize">
          {name}
        </span>
      </div>
    </Link>
  );
}
