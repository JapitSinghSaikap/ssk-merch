import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductGallery from "@/components/shop/ProductGallery";
import ProductPurchasePanel from "@/components/shop/ProductPurchasePanel";
import { getVisibleProducts, getProductBySlug } from "@/lib/products";

export function generateStaticParams() {
  return getVisibleProducts().map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product || product.hidden) return { title: "Product Not Found" };

  const title = `${product.name} — Sainik School Kapurthala Merch`;
  const description = product.description.slice(0, 155);
  const url = `/shop/${product.slug}`;
  const image = `https://saikap.in${product.images[0].src}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      images: [{ url: image, width: 1200, height: 1200, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product || product.hidden) {
    notFound();
  }

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((img) => `https://saikap.in${img.src}`),
    sku: product.slug,
    brand: { "@type": "Brand", name: "Saikap" },
    offers: {
      "@type": "Offer",
      url: `https://saikap.in/shop/${product.slug}`,
      priceCurrency: "INR",
      price: product.price.toFixed(2),
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://saikap.in" },
      { "@type": "ListItem", position: 2, name: "Store", item: "https://saikap.in/shop" },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `https://saikap.in/shop/${product.slug}`,
      },
    ],
  };

  return (
    <div className="flex flex-1 flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <Navbar />
      <main className="flex-1 bg-maroon">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
          <Link
            href="/shop"
            className="text-xs tracking-[0.2em] text-warm-grey hover:text-gold"
          >
            ← BACK TO SHOP
          </Link>

          <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-2">
            <ProductGallery images={product.images} productName={product.name} />

            <div>
              <p className="text-xs font-medium tracking-[0.3em] text-gold">
                {product.categoryLabel.toUpperCase()}
              </p>
              <h1 className="mt-4 font-display text-4xl leading-tight text-cream sm:text-5xl">
                {product.name}
              </h1>
              <p className="mt-4 font-display text-2xl text-gold">
                ₹{product.price}
              </p>

              <p className="mt-6 text-sm leading-relaxed text-warm-grey">
                {product.description}
              </p>

              <div className="mt-8 border-t border-gold/20 pt-6">
                <p className="text-xs tracking-[0.2em] text-warm-grey">
                  FABRIC & CARE
                </p>
                <p className="mt-3 text-sm leading-relaxed text-warm-grey">
                  {product.fabric}
                </p>
              </div>

              <ProductPurchasePanel product={product} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
