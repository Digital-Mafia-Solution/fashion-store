"use client";

import {
  Carousel,
  CarouselContent,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function MobileCarousel({ children }: { children: React.ReactNode }) {
  return (
    <Carousel
      opts={{
        align: "start",
        loop: false,
      }}
      className="w-full relative"
    >
      <CarouselContent className="-ml-4">{children}</CarouselContent>

      {/* High transparency chevrons positioned inside the carousel */}
      <CarouselPrevious className="absolute left-2 bg-white/30 dark:bg-black/30 border-0 hover:bg-white/50 dark:hover:bg-black/50 text-foreground/80 backdrop-blur-[2px]" />
      <CarouselNext className="absolute right-2 bg-white/30 dark:bg-black/30 border-0 hover:bg-white/50 dark:hover:bg-black/50 text-foreground/80 backdrop-blur-[2px]" />
    </Carousel>
  );
}
