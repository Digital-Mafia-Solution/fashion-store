import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, MapPin, Truck } from "lucide-react";

export const revalidate = 0;

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  const { data: product, error } = await supabase
    .from("products")
    .select(`
      *,
      inventory (
        quantity,
        locations (
          id,
          name,
          type
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error || !product) {
    return notFound();
  }

  // FIX 1: Filter stock calculation to only include STORES
  const totalStock = product.inventory?.reduce((sum, item) => {
    const isStore = item.locations?.type === 'store';
    return isStore ? sum + (item.quantity ?? 0) : sum;
  }, 0) || 0;

  // FIX 2: Filter the list of locations to display
  const availableLocations = product.inventory?.filter(
    inv => inv.locations?.type === 'store' && (inv.quantity ?? 0) > 0
  );

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
        <div className="aspect-square bg-muted rounded-xl relative overflow-hidden shadow-sm">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
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
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-wide">
                {product.category}
              </p>
              <h1 className="text-4xl font-extrabold mt-2 tracking-tight">
                {product.name}
              </h1>
            </div>
            <div className="text-3xl font-bold">R {product.price}</div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Badge 
              variant={totalStock > 0 ? "secondary" : "destructive"} 
              className="text-sm px-3 py-1"
            >
              {totalStock > 0 ? "In Stock" : "Sold Out"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              SKU: {product.sku}
            </span>
          </div>

          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            {product.description}
          </p>

          <div className="mt-8 border-t pt-8">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Availability by Store
            </h3>
            
            <div className="space-y-3">
              {availableLocations?.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No stock available in stores.</p>
              ) : (
                availableLocations?.map((inv) => (
                  <div 
                    key={inv.locations?.id} 
                    className="flex justify-between items-center p-3 rounded-lg border bg-card/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="font-medium">
                        {inv.locations?.name || "Unknown Location"}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground font-mono">
                      {inv.quantity} units
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-10 flex gap-4">
            <Button size="lg" className="w-full text-lg h-14" disabled={totalStock === 0}>
              Add to Order
            </Button>
            <Button size="lg" variant="outline" className="h-14 w-14 p-0 shrink-0">
              <Truck className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}