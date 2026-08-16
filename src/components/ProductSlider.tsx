"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/products";

const AUTOPLAY_MS = 4500;
// How far each neighbour sits from centre, as a % of its own width —
// tuned so all three cards stay visible with a clear overlap.
const PEEK_OFFSET = 68;

// Shortest signed distance from `i` to `index` around the loop, so the
// slide immediately behind the last one is treated as "next", not "far".
function offsetFor(i: number, index: number, count: number) {
  let diff = i - index;
  const half = count / 2;
  if (diff > half) diff -= count;
  if (diff < -half) diff += count;
  return diff;
}

export default function ProductSlider({ products }: { products: Product[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = products.length;

  const goTo = useCallback(
    (i: number) => setIndex(((i % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [count, paused]);

  if (count === 0) return null;

  return (
    <div
      className="mx-auto max-w-4xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-56 sm:h-64 lg:h-72">
        {products.map((product, i) => {
          const diff = offsetFor(i, index, count);
          const isCenter = diff === 0;
          const isVisible = Math.abs(diff) <= 1;

          return (
            <Link
              key={product.slug}
              href={`/shop/${product.slug}`}
              onClick={(e) => {
                if (!isCenter) {
                  e.preventDefault();
                  goTo(i);
                }
              }}
              aria-hidden={!isVisible}
              tabIndex={isVisible ? 0 : -1}
              className={`absolute left-1/2 top-1/2 aspect-square w-52 overflow-hidden border bg-maroon-dark transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-64 lg:w-72 ${
                isCenter
                  ? "border-gold/40 shadow-[0_0_40px_-8px_rgba(201,168,76,0.35)]"
                  : "border-gold/10"
              } ${isVisible ? "" : "pointer-events-none"}`}
              style={{
                transform: `translate(-50%, -50%) translateX(${diff * PEEK_OFFSET}%) scale(${isCenter ? 1 : 0.8})`,
                zIndex: isCenter ? 20 : 10,
                opacity: isVisible ? (isCenter ? 1 : 0.45) : 0,
              }}
            >
              <Image
                src={product.images[0].src}
                alt={product.name}
                fill
                className="object-contain p-6 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                sizes="(min-width: 1024px) 288px, (min-width: 640px) 256px, 208px"
              />
              <div
                className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-maroon-dark via-maroon-dark/85 to-transparent px-3 pb-3 pt-8 text-center transition-opacity duration-500 ${
                  isCenter ? "opacity-100" : "opacity-0"
                }`}
              >
                <p className="text-[9px] tracking-[0.2em] text-warm-grey">
                  {product.categoryLabel.toUpperCase()}
                </p>
                <h3 className="mt-0.5 font-display text-base text-cream sm:text-lg">
                  {product.name}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Previous product"
              className="flex h-9 w-9 items-center justify-center border border-gold/30 text-warm-grey transition-colors hover:border-gold hover:text-gold"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-2 px-2">
              {products.map((product, i) => (
                <button
                  key={product.slug}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Go to ${product.name}`}
                  aria-pressed={i === index}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    i === index ? "bg-gold" : "bg-cream/20 hover:bg-cream/40"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Next product"
              className="flex h-9 w-9 items-center justify-center border border-gold/30 text-warm-grey transition-colors hover:border-gold hover:text-gold"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <p className="mt-4 text-center text-xs font-semibold tracking-[0.15em] text-gold">
            <Link href={`/shop/${products[index].slug}`} className="hover:text-cream">
              SHOP {products[index].name.toUpperCase()} &rarr;
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
