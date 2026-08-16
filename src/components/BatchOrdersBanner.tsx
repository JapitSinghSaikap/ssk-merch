import Link from "next/link";

export default function BatchOrdersBanner() {
  return (
    <section className="bg-maroon-dark px-6 py-24 lg:px-10">
      <div className="mx-auto max-w-4xl border border-gold/20 px-8 py-16 text-center sm:px-16">
        <p className="text-xs font-medium tracking-[0.3em] text-gold">
          PLANNING A GET-TOGETHER?
        </p>
        <h2 className="mt-6 font-display text-4xl leading-tight text-cream sm:text-5xl">
          Merch, Made for Your Batch
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-warm-grey">
          Batch reunions, OBA events, chapter meetups — we&apos;ll put your
          whole group in matching gear, personalised with each name, roll
          number, and batch year.
        </p>
        <div className="mt-10">
          <Link
            href="/batch-orders"
            className="inline-block bg-gold px-8 py-4 text-xs font-semibold tracking-[0.2em] text-maroon-dark transition-opacity hover:opacity-90"
          >
            START A BATCH ORDER &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
