"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Filter, Loader2, Search } from "lucide-react";

interface Store {
  id: string;
  name: string;
}

interface ProductFiltersProps {
  categories: string[];
  stores?: Store[];
  maxPrice?: number;
  children: React.ReactNode;
  showSearch?: boolean;
}

export function ProductFilters({
  categories,
  stores = [],
  maxPrice = 10000,
  children,
  showSearch = true,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = React.useTransition();

  // Local state for filters
  const [search, setSearch] = React.useState(searchParams.get("q") || "");
  const [priceRange, setPriceRange] = React.useState<[number, number]>([
    Number(searchParams.get("min") || 0),
    Number(searchParams.get("max") || maxPrice),
  ]);
  const [isOpen, setIsOpen] = React.useState(false);

  // Sync state with URL params
  React.useEffect(() => {
    setSearch(searchParams.get("q") || "");
    setPriceRange([
      Number(searchParams.get("min") || 0),
      Number(searchParams.get("max") || maxPrice),
    ]);
  }, [searchParams, maxPrice]);

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // If searching/filtering, we might want to reset page if pagination existed
    // params.delete("page");

    const queryString = params.toString();
    startTransition(() => {
      router.push(`/?${queryString}`, { scroll: false });
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: search || null });
  };

  const clearFilters = () => {
    setSearch("");
    setPriceRange([0, maxPrice]);
    startTransition(() => {
      router.push("/", { scroll: false });
    });
    setIsOpen(false);
  };

  const activeFiltersCount = [
    searchParams.get("category"),
    searchParams.get("store"),
    searchParams.get("min"),
    searchParams.get("max"),
    searchParams.get("sort") !== "recency" && searchParams.get("sort"), // Count sort only if not default
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 ml-0 md:ml-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="hidden md:block space-y-6 max-h-screen sticky top-20 overflow-y-auto pr-4">
          {/* Search Bar */}
          {showSearch && (
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-9 w-full bg-muted/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
          )}

          {/* Sort */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Sort</h3>
            <Select
              value={searchParams.get("sort") || "recency"}
              onValueChange={(val) => updateFilters({ sort: val })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recency">Newest Arrivals</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Category</h3>
            <Select
              value={searchParams.get("category") || "all"}
              onValueChange={(val) =>
                updateFilters({ category: val === "all" ? null : val })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Store Filter */}
          {stores.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Store</h3>
              <Select
                value={searchParams.get("store") || "all"}
                onValueChange={(val) =>
                  updateFilters({ store: val === "all" ? null : val })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Store" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Price Range */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Price Range</h3>
              <span className="text-xs text-muted-foreground">
                R{priceRange[0]} - R{priceRange[1]}
              </span>
            </div>
            <Slider
              min={0}
              max={maxPrice}
              step={50}
              value={priceRange}
              onValueChange={(val) => {
                setPriceRange(val as [number, number]);
              }}
              onValueCommit={(val) => {
                updateFilters({
                  min: val[0].toString(),
                  max: val[1].toString(),
                });
              }}
              className="py-4"
            />
          </div>

          {activeFiltersCount > 0 && (
            <Button variant="outline" className="w-full" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          {/* Mobile Filters */}
          <div className="flex items-center gap-2 md:hidden mb-4">
            {/* Mobile Search */}
            {showSearch && (
              <form onSubmit={handleSearchSubmit} className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-9 w-full bg-muted/50"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </form>
            )}

            {/* Mobile Filters Button */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {activeFiltersCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
                    >
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-full sm:w-[360px] overflow-y-auto"
              >
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>
                    Refine your search to find exactly what you need.
                  </SheetDescription>
                </SheetHeader>

                <div className="grid gap-6 py-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Category</h3>
                    <Select
                      value={searchParams.get("category") || "all"}
                      onValueChange={(val) =>
                        updateFilters({ category: val === "all" ? null : val })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {stores.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Store</h3>
                      <Select
                        value={searchParams.get("store") || "all"}
                        onValueChange={(val) =>
                          updateFilters({ store: val === "all" ? null : val })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Store" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Stores</SelectItem>
                          {stores.map((store) => (
                            <SelectItem key={store.id} value={store.id}>
                              {store.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Price Range</h3>
                      <span className="text-xs text-muted-foreground">
                        R{priceRange[0]} - R{priceRange[1]}
                      </span>
                    </div>
                    <Slider
                      min={0}
                      max={maxPrice}
                      step={50}
                      value={priceRange}
                      onValueChange={(val) => {
                        setPriceRange(val as [number, number]);
                      }}
                      onValueCommit={(val) => {
                        updateFilters({
                          min: val[0].toString(),
                          max: val[1].toString(),
                        });
                      }}
                      className="py-4"
                    />
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={clearFilters}
                    >
                      Reset
                    </Button>
                    <Button className="flex-1" onClick={() => setIsOpen(false)}>
                      View Results
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Main Content */}
          <div className="relative min-h-[50vh]">
            {children}

            {isPending && (
              <div className="absolute inset-0 z-50 flex items-start justify-center bg-background/50 backdrop-blur-[2px] pt-20 transition-all duration-300">
                <div className="bg-background shadow-lg rounded-full px-6 py-3 flex items-center gap-3 border">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm font-medium">Updating...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
