import { Card, CardContent } from "@/components/ui/card";

export default function About() {
  return (
    // Added text-foreground
    <div className="container mx-auto px-6 py-12 max-w-4xl text-foreground">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold mb-4">Reinventing Local Fashion</h1>
        <p className="text-xl text-muted-foreground">
          We connect the best local creators directly to you, with ultra-fast local pickup points.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="bg-card text-card-foreground border-border">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-2">Our Mission</h3>
            <p className="text-muted-foreground">To empower local fashion designers by providing them with a world-class digital storefront and a distributed logistics network.</p>
          </CardContent>
        </Card>
        <Card className="bg-card text-card-foreground border-border">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-2">The Network</h3>
            <p className="text-muted-foreground">Our unique &quot;Home Warehouse&quot; model allows us to offer pickup points in your neighborhood, reducing delivery costs and time.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}