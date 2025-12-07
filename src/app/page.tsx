import { supabase } from "@/lib/supabase";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const revalidate = 0;

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function Index({ searchParams }: Props) {
  const { q } = await searchParams;

  let query = supabase
    .from("products")
    .select(`
      *,
      inventory (
        quantity,
        locations ( type )
      )
    `);

  if (q) {
    query = query.ilike('name', `%${q}%`);
  }

  const { data: products, error } = await query;

  if (error) return <div className="p-10 text-center">Error loading products.</div>;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Latest Drops</h1>
          <p className="text-muted-foreground mt-2">
            {q ? `Showing results for "${q}"` : "Fresh local fashion, available now."}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products?.map((product) => {
          const totalStock = product.inventory?.reduce((sum, item) => {
            const isStore = item.locations?.type === 'store';
            return isStore ? sum + (item.quantity ?? 0) : sum;
          }, 0) || 0;
          
          return (
            <Card key={product.id} className="group hover:shadow-lg transition-all overflow-hidden border-border">
              <div className="aspect-4/5 w-full bg-muted relative overflow-hidden">
                {product.image_url ? (
                  <Image 
                    src={product.image_url} 
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">No Image</div>
                )}
                
                {totalStock === 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                    <Badge variant="destructive" className="text-lg px-6 py-2">Sold Out</Badge>
                  </div>
                )}
              </div>

              <CardHeader className="space-y-1 p-5">
                <div className="flex justify-between items-start w-full">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{product.category}</p>
                    <CardTitle className="text-xl mt-1">{product.name}</CardTitle>
                  </div>
                  <span className="font-bold text-lg">R {product.price}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {product.description}
                </p>
              </CardHeader>

              <CardFooter className="p-5 pt-0 flex gap-3">
                <div className="flex-1">
                  <AddToCartButton 
                    product={product} 
                    disabled={totalStock === 0} 
                    className="w-full"
                  />
                </div>
                
                <Button asChild variant="outline" size="icon" className="shrink-0">
                  <Link href={`/product/${product.id}`}>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}