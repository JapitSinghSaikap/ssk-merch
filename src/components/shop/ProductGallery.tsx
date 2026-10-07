"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import type { ProductImage } from "@/lib/products";

export default function ProductGallery({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const activeImage = images[activeIndex];

  function showPrev() {
    setActiveIndex((i) => (i - 1 + images.length) % images.length);
  }
  function showNext() {
    setActiveIndex((i) => (i + 1) % images.length);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setZoomOpen(true)}
        className="group relative block aspect-square w-full overflow-hidden border border-gold/20 bg-cream/5"
      >
        <Image
          src={activeImage.src}
          alt={`${productName} — ${activeImage.label} view`}
          fill
          priority
          className="object-contain p-10"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
        <span className="absolute bottom-4 right-4 flex items-center gap-2 border border-gold/30 bg-maroon-dark/80 px-3 py-1.5 text-[11px] tracking-[0.15em] text-cream opacity-0 transition-opacity group-hover:opacity-100">
          <ZoomIn size={14} />
          ZOOM
        </span>
      </button>

      {images.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {images.map((image, i) => (
            <button
              key={image.label}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-pressed={i === activeIndex}
              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden border transition-colors ${
                i === activeIndex
                  ? "border-gold"
                  : "border-gold/20 hover:border-gold/50"
              }`}
            >
              <Image
                src={image.src}
                alt={`${productName} — ${image.label} thumbnail`}
                fill
                className="object-contain p-2"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      {zoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6">
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            aria-label="Close zoom"
            className="absolute right-6 top-6 text-cream hover:text-gold"
          >
            <X size={28} />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={showPrev}
                aria-label="Previous image"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-cream hover:text-gold sm:left-8"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                type="button"
                onClick={showNext}
                aria-label="Next image"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-cream hover:text-gold sm:right-8"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}

          <div className="relative h-full w-full max-w-3xl">
            <Image
              src={activeImage.src}
              alt={`${productName} — ${activeImage.label} view, zoomed`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs tracking-[0.2em] text-warm-grey">
            {activeImage.label.toUpperCase()}
          </p>
        </div>
      )}
    </div>
  );
}
