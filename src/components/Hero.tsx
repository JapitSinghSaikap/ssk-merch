import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col justify-between overflow-hidden">
      <div className="absolute inset-0 bg-maroon-dark" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-maroon" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center gap-12 px-6 pt-28 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:px-10">
        <div>
          <p className="text-xs font-medium tracking-[0.3em] text-gold">
            OFFICIAL ALUMNI MERCHANDISE
          </p>

          <h1 className="mt-6 font-display text-6xl leading-[1.05] text-cream sm:text-7xl lg:text-8xl">
            Wear the <br />
            <span className="italic text-gold">Legacy</span>
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-warm-grey">
            Curated apparel and keepsakes for the alumni of Sainik School
            Kapurthala. Each piece carries the discipline, honour, and service
            that defined our years within these walls.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/shop"
              className="bg-gold px-8 py-4 text-xs font-semibold tracking-[0.2em] text-maroon-dark transition-opacity hover:opacity-90"
            >
              SHOP NOW &rarr;
            </Link>
            <a
              href="#legacy"
              className="border border-cream/40 px-8 py-4 text-xs font-semibold tracking-[0.2em] text-cream transition-colors hover:border-gold hover:text-gold"
            >
              OUR STORY
            </a>
          </div>
        </div>

        <div className="flex justify-center lg:shrink-0 lg:justify-end">
          <Image
            src="/images/branding/crest.jpg"
            alt="Sainik School Kapurthala crest"
            width={420}
            height={420}
            priority
            sizes="(max-width: 640px) 224px, (max-width: 1024px) 288px, 420px"
            className="h-auto w-56 sm:w-72 lg:w-[420px]"
          />
        </div>
      </div>

      <div className="relative z-10 border-t border-gold/20">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 px-6 py-5 text-[11px] tracking-[0.25em] text-warm-grey sm:justify-between lg:px-10">
          <span>ESTD. 1961</span>
          <span className="text-gold/40">&middot;</span>
          <span>PUNJAB</span>
          <span className="text-gold/40">&middot;</span>
          <span>INDIA</span>
          <span className="text-gold/40">&middot;</span>
          <span>ALUMNI OWNED</span>
        </div>
      </div>
    </section>
  );
}
