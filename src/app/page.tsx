import { supabase } from "@/lib/supabase";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";

export const revalidate = 0;

export default async function Index() {
  const { data: products, error } = await supabase
    .from("products")
    .select(`
      *,
      inventory (
        quantity,
        locations (
          type
        )
      )
    `);

  if (error) {
    console.error(error);
    return <div className="p-10 text-center text-destructive">Error loading products.</div>;
  }

  return (
    // FIX: Using 'container mx-auto px-4' to match Navigation exactly
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Latest Drops</h1>
          <p className="text-muted-foreground mt-2">Fresh local fashion, available now.</p>
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

              <CardFooter className="p-5 pt-0 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${totalStock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {totalStock > 0 ? `${totalStock} Available` : "Out of Stock"}
                  </span>
                </div>
                
                <Link 
                  href={`/product/${product.id}`}
                  className={`inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ${totalStock === 0 ? "pointer-events-none opacity-50" : ""}`}
                >
                  View Details
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}