import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart/CartContext";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";

// Pin all serverless functions to Singapore — same region as Neon (ap-southeast-1)
// so DB calls don't cross continents. Change to your nearest Vercel region if you
// ever move the database.
export const preferredRegion = "sin1";

export const metadata: Metadata = {
  metadataBase: new URL("https://saikap.in"),
  title: {
    default: "Saikap — Sainik School Kapurthala Alumni Store & Community",
    template: "%s | Saikap",
  },
  description:
    "Official merch store and alumni community for Sainik School Kapurthala (SSK). Shop hoodies, caps, tees and more — made for Saikapians.",
  keywords: [
    "Sainik School Kapurthala",
    "SSK alumni",
    "Saikapian",
    "Sainik School Kapurthala merch",
    "SSK merchandise",
    "Saikapian store",
    "saikap",
  ],
  openGraph: {
    type: "website",
    siteName: "Saikap",
    locale: "en_IN",
    url: "https://saikap.in",
    images: [
      {
        url: "/og/default.jpg",
        width: 1200,
        height: 630,
        alt: "Saikap — Sainik School Kapurthala Alumni Store & Community",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og/default.jpg"],
  },
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// ─── JSON-LD schemas (injected once in root layout) ────────────────────────
const orgLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Saikap",
  url: "https://saikap.in",
  logo: "https://saikap.in/images/branding/crest.jpg",
  description:
    "Official alumni store and community for Sainik School Kapurthala.",
  // TODO: add your Instagram and Facebook URLs in the sameAs array
  sameAs: [] as string[],
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Saikap",
  url: "https://saikap.in",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://saikap.in/shop?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-body bg-maroon text-cream">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
        <CartProvider>{children}</CartProvider>
        <Analytics />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1a0606",
              border: "1px solid rgba(201,168,76,0.3)",
              color: "#f5f0e8",
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  );
}
