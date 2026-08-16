import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BatchOrderForm from "@/components/batch-orders/BatchOrderForm";

export const metadata: Metadata = {
  title: "Batch Orders | Sainik School Kapurthala Merch",
  description:
    "Custom batch merchandise for SSK reunions, OBA events, and chapter meetups — personalised with your name, roll number, and batch.",
  alternates: { canonical: "/batch-orders" },
};

const OCCASIONS = [
  {
    title: "Batch Reunions & Get-Togethers",
    description:
      "Show up as one batch, not a scattered crowd. Matching tees or tracksuits with every name and roll number stitched on.",
  },
  {
    title: "OBA Events",
    description:
      "Official Old Boys' Association gatherings, conferences, and functions, outfitted in gear that carries the crest with pride.",
  },
  {
    title: "Chapter Meetups",
    description:
      "Chandigarh, Delhi, Mumbai, or wherever your chapter meets — merch tagged with your city and the year that brought you back together.",
  },
];

const PERSONALISATION = ["Name", "Roll Number", "Batch Year"];

const STEPS = [
  {
    title: "Tell us about your event",
    description: "Batch year, occasion, and expected headcount.",
  },
  {
    title: "Pick your products",
    description: "One item or a full kit, in your batch's colours.",
  },
  {
    title: "Share your roster",
    description: "Names, roll numbers, and sizes for each member.",
  },
  {
    title: "Approve the proof",
    description: "We send a design mockup before anything goes into production.",
  },
  {
    title: "We deliver",
    description:
      "To one address, or split across members, before your event date.",
  },
];

export default function BatchOrdersPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="flex-1 bg-maroon">
        {/* Hero */}
        <div className="mx-auto max-w-3xl px-6 pt-16 text-center lg:px-10">
          <p className="text-xs font-medium tracking-[0.3em] text-gold">
            OFFICIAL ALUMNI MERCHANDISE
          </p>
          <h1 className="mt-6 font-display text-5xl leading-tight text-cream sm:text-6xl">
            Merch, made for your Batch
          </h1>
          <p className="mt-4 font-display text-xl italic text-gold">
            One order. Every name on it.
          </p>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-warm-grey">
            Planning a batch get-together, an OBA event, or a chapter
            meetup — Chandigarh, Delhi, wherever your Saikapians are
            gathering? We&apos;ll put your whole group in matching gear, each
            piece personalised with the wearer&apos;s name, roll number, and
            batch year.
          </p>
          <div className="mt-10">
            <a
              href="#enquire"
              className="inline-block bg-gold px-8 py-4 text-xs font-semibold tracking-[0.2em] text-maroon-dark transition-opacity hover:opacity-90"
            >
              START A BATCH ORDER &rarr;
            </a>
          </div>
        </div>

        {/* Who this is for */}
        <div className="mx-auto mt-24 max-w-6xl px-6 lg:px-10">
          <p className="text-center text-xs font-medium tracking-[0.3em] text-gold">
            WHO THIS IS FOR
          </p>
          <h2 className="mt-4 text-center font-display text-3xl text-cream sm:text-4xl">
            Built for the Moments You Gather
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {OCCASIONS.map((occasion) => (
              <div key={occasion.title} className="border border-gold/20 p-6">
                <h3 className="font-display text-lg text-gold">
                  {occasion.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-warm-grey">
                  {occasion.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Personalisation */}
        <div className="mx-auto mt-24 max-w-3xl px-6 text-center lg:px-10">
          <p className="text-xs font-medium tracking-[0.3em] text-gold">
            WHAT YOU CAN PERSONALISE
          </p>
          <h2 className="mt-4 font-display text-3xl text-cream sm:text-4xl">
            Every Piece, Made Individual
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {PERSONALISATION.map((item) => (
              <span
                key={item}
                className="border border-gold/30 px-4 py-2 text-xs tracking-[0.15em] text-cream"
              >
                {item}
              </span>
            ))}
          </div>
          <p className="mt-6 text-sm leading-relaxed text-warm-grey">
            Everyone in the group wears the same design — but it&apos;s
            theirs.
          </p>
        </div>

        {/* How it works */}
        <div className="mx-auto mt-24 max-w-4xl px-6 lg:px-10">
          <p className="text-center text-xs font-medium tracking-[0.3em] text-gold">
            THE PROCESS
          </p>
          <h2 className="mt-4 text-center font-display text-3xl text-cream sm:text-4xl">
            From Enquiry to Delivery
          </h2>
          <ol className="mt-12 space-y-6">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-5">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center border border-gold/40 font-display text-sm text-gold">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-sm font-medium tracking-[0.05em] text-cream">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-warm-grey">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Enquiry form */}
        <div id="enquire" className="mx-auto mt-24 max-w-2xl px-6 pb-24 lg:px-10">
          <p className="text-center text-xs font-medium tracking-[0.3em] text-gold">
            READY TO OUTFIT YOUR BATCH?
          </p>
          <h2 className="mt-4 text-center font-display text-3xl text-cream sm:text-4xl">
            Let&apos;s Build Your Order
          </h2>
          <p className="mx-auto mt-4 max-w-md text-center text-sm leading-relaxed text-warm-grey">
            Send us a few details and our team will follow up directly with
            pricing and next steps.
          </p>
          <div className="mt-10">
            <BatchOrderForm />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
