"use client";

import { Carousel, CarouselContent } from "@/components/ui/carousel";

export function MobileCarousel({ children }: { children: React.ReactNode }) {
  return (
    <Carousel
      opts={{
        align: "start",
        loop: false,
      }}
      className="w-full"
    >
      <CarouselContent className="-ml-4">{children}</CarouselContent>
    </Carousel>
  );
}
