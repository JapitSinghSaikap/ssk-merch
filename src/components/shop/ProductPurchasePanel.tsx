"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/components/cart/CartContext";
import type { Product } from "@/lib/products";

export default function ProductPurchasePanel({
  product,
}: {
  product: Product;
}) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [added, setAdded] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const { addItem } = useCart();

  function handleAdd() {
    if (!selectedSize) return;
    addItem({
      slug: product.slug,
      name: product.name,
      color: product.color,
      image: product.images[0].src,
      size: selectedSize,
      price: product.price,
    });
    toast.success(`${product.name} (${selectedSize}) added to cart.`);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div>
      {/* Size selector */}
      <div className="mt-8 border-t border-gold/20 pt-6">
        {product.sizes.length === 1 ? (
          <div>
            <p className="text-xs tracking-[0.2em] text-warm-grey">SIZE</p>
            <p className="mt-3 text-sm text-cream">{product.sizes[0]}</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs tracking-[0.2em] text-warm-grey">
                SIZE — {selectedSize}
              </p>
              {product.sizeChart && (
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen((open) => !open)}
                  aria-expanded={sizeGuideOpen}
                  aria-controls="size-guide"
                  className="text-xs tracking-[0.2em] text-gold underline-offset-4 hover:underline"
                >
                  SIZE GUIDE {sizeGuideOpen ? "−" : "+"}
                </button>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  aria-pressed={size === selectedSize}
                  className={`border px-4 py-2 text-xs tracking-[0.1em] transition-colors ${
                    size === selectedSize
                      ? "border-gold bg-gold text-maroon-dark"
                      : "border-gold/30 text-warm-grey hover:border-gold hover:text-cream"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            {product.sizeChart && sizeGuideOpen && (
              <div id="size-guide" className="mt-4 overflow-x-auto border border-gold/20">
                <table className="w-full text-center text-sm">
                  <caption className="px-4 pt-3 text-left text-xs text-warm-grey">
                    Measurements in inches
                  </caption>
                  <thead>
                    <tr className="border-b border-gold/20">
                      <th scope="col" className="px-4 py-3 text-left text-xs font-normal tracking-[0.2em] text-warm-grey">
                        SIZE
                      </th>
                      {product.sizes.map((size) => (
                        <th
                          key={size}
                          scope="col"
                          className={`px-3 py-3 text-xs font-medium tracking-[0.1em] ${
                            size === selectedSize ? "bg-gold/15 text-gold" : "text-cream"
                          }`}
                        >
                          {size}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {product.sizeChart.map((row) => (
                      <tr key={row.measurement} className="border-b border-gold/10 last:border-0">
                        <th scope="row" className="px-4 py-3 text-left text-xs font-normal tracking-[0.1em] text-warm-grey">
                          {row.measurement}
                        </th>
                        {product.sizes.map((size) => (
                          <td
                            key={size}
                            className={`px-3 py-3 ${
                              size === selectedSize ? "bg-gold/15 text-gold" : "text-cream"
                            }`}
                          >
                            {row.inches[size] ?? "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add to cart */}
      <div className="mt-10">
        <button
          type="button"
          onClick={handleAdd}
          aria-label={`Add ${product.name} to cart`}
          className="w-full bg-gold px-8 py-4 text-xs font-semibold tracking-[0.2em] text-maroon-dark transition-opacity hover:opacity-90"
        >
          {added ? "ADDED TO CART ✓" : "ADD TO CART"}
        </button>
      </div>
    </div>
  );
}
