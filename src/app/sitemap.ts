import type { MetadataRoute } from "next";
import { getVisibleProducts } from "@/lib/products";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://saikap.in";

export default function sitemap(): MetadataRoute.Sitemap {
  const products = getVisibleProducts();

  const productUrls: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${BASE_URL}/shop/${product.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/shop`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/batch-orders`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/community`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...productUrls,
  ];
}
