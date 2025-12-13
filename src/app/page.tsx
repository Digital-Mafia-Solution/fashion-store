import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { MobileCarousel } from "@/components/MobileCarousel";
import { CarouselItem } from "@/components/ui/carousel";
import { ProductFilters } from "@/components/ProductFilters";
import { RefreshButton } from "@/components/RefreshButton";
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
        price: number;
        locations: {
          id?: string | null;
          type: "store" | "warehouse" | "virtual_courier";
        } | null;
      }[]
    | null;
};

export default async function Index({ searchParams }: Props) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" ? params.category : "";
  const storeId = typeof params.store === "string" ? params.store : "";
  const sort = typeof params.sort === "string" ? params.sort : "recency";
  const min = typeof params.min === "string" ? Number(params.min) : 0;
  const max = typeof params.max === "string" ? Number(params.max) : 100000;

  // Check if we are in "Filtered Mode" (any filter active)
  const isFiltered = !!(
    q ||
    category ||
    storeId ||
    (sort && sort !== "recency") ||
    params.min ||
    params.max
  );

  // --- FETCH ALL CATEGORIES AND STORES ---
  const { data: allProductsCategories } = await supabase
    .from("products")
    .select("category, clothing_type")
    .eq("is_archived", false);

  const categorySet = new Set<string>();
  allProductsCategories?.forEach((p) => {
    if (p.category && Array.isArray(p.category)) {
      p.category.forEach((c) => categorySet.add(c));
    }
    if (p.clothing_type) {
      categorySet.add(p.clothing_type);
    }
  });
  const categories = Array.from(categorySet).sort();

  // Fetch stores
  const { data: storesData } = await supabase
    .from("locations")
    .select("id, name, type")
    .eq("is_active", true)
    .eq("type", "store");

  const stores = (storesData || []).map((loc) => ({
    id: loc.id,
    name: loc.name,
  }));

  // --- FETCH FILTERED PRODUCTS ---
  let query = supabase
    .from("products")
    .select(
      `
    *,
    inventory ( quantity, price, locations ( id, type ) )
  `
    )
    .eq("is_archived", false);

  if (q) {
    query = query.or(`name.ilike.%${q}%,category.cs.{${q}}`);
  }

  if (category) {
    query = query.or(`category.cs.{${category}},clothing_type.eq.${category}`);
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
    let products = data as ProductWithInventory[] | null;

    // Apply store filter client-side
    if (storeId && products) {
      products = products.filter((product) => {
        const hasStoreInventory = product.inventory?.some(
          (inv) => inv.locations?.id === storeId && (inv.quantity ?? 0) > 0
        );
        return hasStoreInventory;
      });
    }

    filteredProducts = products;
  }

  // --- STANDARD HOME SECTIONS (FETCHED IF NOT FILTERED) ---
  let latestProducts: ProductWithInventory[] | null = null;
  let popularProducts: ProductWithInventory[] | null = null;
  let homeCategories: { name: string; image: string }[] = [];

  if (!isFiltered) {
    // Fetch Latest
    const latestRes = await supabase
      .from("products")
      .select(`*, inventory ( quantity, price, locations ( type ) )`)
      .eq("is_archived", false)
      .order("created_at", { ascending: false })
      .limit(6);
    latestProducts = latestRes.data as ProductWithInventory[] | null;

    // Fetch Popular
    const popularRes = await supabase
      .from("products")
      .select(`*, inventory ( quantity, price, locations ( type ) )`)
      .eq("is_archived", false)
      .order("price", { ascending: false })
      .limit(6);
    popularProducts = popularRes.data as ProductWithInventory[] | null;

    // Fetch Category Images
    const allProdsRes = await supabase
      .from("products")
      .select("category, clothing_type, image_url")
      .eq("is_archived", false)
      .limit(12);
    const categoryMap = new Map<string, string>();
    allProdsRes.data?.forEach((p) => {
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
    mobileContent: React.ReactNode,
    isEmpty: boolean = false,
    emptyMessage: string = "No items available"
  ) => {
    if (isEmpty) {
      return (
        <section>
          <div className="flex justify-between items-end mb-4 md:mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                {title}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
            </div>
          </div>
          <div className="text-center py-12 bg-muted/20 rounded-lg">
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        </section>
      );
    }

    return (
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
  };

  return (
    <ProductFilters categories={categories} stores={stores} showSearch={false}>
      <div className="container mx-auto px-4 py-4 md:py-12 mb-20 space-y-12 md:space-y-16">
        {isFiltered ? (
          <div>
            <div className="mb-8 flex justify-between items-start gap-4">
              <div className="flex-1">
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
              <RefreshButton />
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
              "/products/latest",
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
              )),
              !latestProducts || latestProducts.length === 0,
              "No latest items available"
            )}

            {renderSection(
              "Popular",
              "Top rated styles this week.",
              "/products/popular",
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
              )),
              !popularProducts || popularProducts.length === 0,
              "No popular items available"
            )}

            {!isFiltered &&
              renderSection(
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
                )),
                homeCategories.length === 0,
                "No categories available"
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
      className="group relative aspect-4/5 overflow-hidden rounded-lg bg-gray-100 block h-full w-full"
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
