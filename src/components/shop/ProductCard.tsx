"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/products";

export default function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = product.images[activeIndex];

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group block border border-gold/20 bg-maroon-dark transition-colors hover:border-gold/50"
    >
      <div className="relative aspect-square overflow-hidden bg-cream/5">
        <Image
          src={activeImage.src}
          alt={`${product.name} — ${activeImage.label} view`}
          fill
          priority={priority}
          className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
        />
      </div>

      {product.images.length > 1 && (
        <div className="flex items-center justify-center gap-2 border-t border-gold/10 py-3">
          {product.images.map((image, i) => (
            <button
              key={image.label}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveIndex(i);
              }}
              aria-label={`View ${image.label}`}
              aria-pressed={i === activeIndex}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === activeIndex ? "bg-gold" : "bg-cream/20 hover:bg-cream/40"
              }`}
            />
          ))}
        </div>
      )}

      <div className="px-4 pb-4 pt-1">
        <p className="text-[10px] tracking-[0.2em] text-warm-grey">
          {product.categoryLabel.toUpperCase()}
        </p>
        <h3 className="mt-1 font-display text-lg text-cream">{product.name}</h3>
        <p className="mt-1 text-sm text-gold">₹{product.price.toLocaleString("en-IN")}</p>
      </div>
    </Link>
  );
}
