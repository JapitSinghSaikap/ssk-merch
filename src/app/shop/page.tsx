import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ShopBrowser from "@/components/shop/ShopBrowser";
import {
  getVisibleProducts,
  getAllSizes,
  getCategories,
  getPriceBounds,
} from "@/lib/products";

// Static product catalogue — fully cacheable, no per-request data
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Saikapian Store — Official SSK Alumni Merchandise",
  description:
    "Shop official Sainik School Kapurthala merchandise: hoodies, caps, tees and mugs for SSK alumni and families. Ships across India.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  const products = getVisibleProducts();
  const categories = getCategories();
  const sizes = getAllSizes();
  const priceBounds = getPriceBounds();

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="flex-1 bg-maroon">
        <div className="mx-auto max-w-7xl px-6 pt-16 lg:px-10">
          <p className="text-xs font-medium tracking-[0.3em] text-gold">
            OFFICIAL ALUMNI MERCHANDISE
          </p>
          <h1 className="mt-6 font-display text-5xl leading-tight text-cream sm:text-6xl">
            Shop
          </h1>
        </div>
        <ShopBrowser
          products={products}
          categories={categories}
          sizes={sizes}
          priceBounds={priceBounds}
        />
      </main>
      <Footer />
    </div>
  );
}
