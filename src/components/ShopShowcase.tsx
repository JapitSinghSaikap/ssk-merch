// Server Component — looks up the featured products by slug so this stays
// in sync if one of them is ever hidden (falls back gracefully instead of
// showing a broken slide).
import Link from "next/link";
import ProductSlider from "@/components/ProductSlider";
import { getProductBySlug, type Product } from "@/lib/products";

const FEATURED_SLUGS = ["black-tshirt", "black-tracksuit", "big-beer-mug"];

export default function ShopShowcase() {
  const products = FEATURED_SLUGS.map((slug) => getProductBySlug(slug)).filter(
    (product): product is Product => !!product && !product.hidden,
  );

  if (products.length === 0) return null;

  return (
    <section className="bg-maroon px-6 py-24 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.3em] text-gold">
              FROM THE SHOP
            </p>
            <h2 className="mt-4 font-display text-4xl leading-tight text-cream sm:text-5xl">
              Wear It Well
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs font-semibold tracking-[0.2em] text-gold transition-colors hover:text-cream"
          >
            VIEW ALL &rarr;
          </Link>
        </div>

        <div className="mt-12">
          <ProductSlider products={products} />
        </div>
      </div>
    </section>
  );
}
