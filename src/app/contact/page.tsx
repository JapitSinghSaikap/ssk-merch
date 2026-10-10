import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Contact Us | Sainik School Kapurthala Merch",
};

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-maroon px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-medium tracking-[0.3em] text-gold">
            SAIKAP MERCH
          </p>
          <h1 className="mt-4 font-display text-4xl text-cream">Contact Us</h1>
          <p className="mt-2 text-sm text-warm-grey">
            Have a question about your order, a bulk enquiry, or just want to
            get in touch? We&apos;re here to help.
          </p>

          {/* Email card */}
          <div className="mt-12 border border-gold/20 p-8">
            <p className="text-[10px] font-medium tracking-[0.3em] text-gold uppercase">
              Email Support
            </p>
            <a
              href="mailto:support@saikap.in"
              className="mt-3 block font-display text-2xl text-cream transition-colors hover:text-gold"
            >
              support@saikap.in
            </a>
            <p className="mt-3 text-sm text-warm-grey leading-relaxed">
              We typically respond within 24–48 hours. For order-related queries
              please include your Order ID or the email used at checkout.
            </p>
            <a
              href="mailto:support@saikap.in"
              className="mt-6 inline-block border border-gold/40 px-6 py-2.5 text-xs tracking-[0.2em] text-gold transition-colors hover:border-gold hover:text-cream"
            >
              SEND AN EMAIL
            </a>
          </div>

          {/* Track order nudge */}
          <div className="mt-4 border border-gold/10 bg-gold/5 p-6">
            <p className="text-xs text-warm-grey leading-relaxed">
              Looking for your order status?{" "}
              <a
                href="/track-order"
                className="text-gold underline underline-offset-2 hover:text-cream transition-colors"
              >
                Track your order here
              </a>{" "}
              — you can look it up using your email or Order ID from your
              confirmation email.
            </p>
          </div>

          {/* Batch orders nudge */}
          <div className="mt-4 border border-gold/10 p-6">
            <p className="text-[10px] font-medium tracking-[0.25em] text-gold uppercase mb-2">
              Batch / Bulk Orders
            </p>
            <p className="text-xs text-warm-grey leading-relaxed">
              Ordering for your batch, house, or school event? We have a
              dedicated batch ordering process.{" "}
              <a
                href="/batch-orders"
                className="text-gold underline underline-offset-2 hover:text-cream transition-colors"
              >
                Learn more →
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
