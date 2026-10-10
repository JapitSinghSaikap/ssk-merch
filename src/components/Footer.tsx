export default function Footer() {
  return (
    <footer className="border-t border-gold/20 bg-maroon-dark">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-[11px] tracking-[0.2em] text-warm-grey">
            &copy; {new Date().getFullYear()} Sainik School Kapurthala Merch.
            All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-[11px] tracking-[0.15em]">
            <a
              href="mailto:support@saikap.in"
              className="text-warm-grey transition-colors hover:text-gold"
            >
              support@saikap.in
            </a>
            <span className="text-gold/40">&middot;</span>
            <a
              href="/contact"
              className="text-warm-grey transition-colors hover:text-gold"
            >
              CONTACT
            </a>
          </div>
        </div>
        <p className="mt-3 text-center text-[10px] tracking-[0.25em] text-gold/40 sm:text-right">
          DISCIPLINE <span className="text-gold/20">&middot;</span> HONOUR{" "}
          <span className="text-gold/20">&middot;</span> SERVICE
        </p>
      </div>
    </footer>
  );
}
