// Server Component — no "use client" here.
// Animation is isolated in HeritageCard (a thin client wrapper)
// so framer-motion JS only loads for the three animated cards,
// not for the entire Heritage section.
import HeritageCard from "./HeritageCard";

const columns = [
  {
    numeral: "I",
    title: "School History",
    body: "Founded in 1961, Sainik School Kapurthala has shaped generations of students who went on to serve, build, lead, and create — each carrying a part of these grounds with them.",
  },
  {
    numeral: "II",
    title: "Our Mission",
    body: "To carry forward the discipline, friendships, and pride found within these walls into the everyday lives of every Saikapian, one piece of merchandise at a time.",
  },
  {
    numeral: "III",
    title: "Alumni Community",
    body: "A growing community spanning professions, countries, and decades — united not by one path, but by the same school, the same memories, and the same pride.",
  },
];

export default function Heritage() {
  return (
    <section id="legacy" className="scroll-mt-20 bg-maroon-dark px-6 py-24 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 border-b border-gold/20 pb-16 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.3em] text-gold">
              THE LEGACY
            </p>
            <h2 className="mt-6 max-w-xl font-display text-4xl leading-tight text-cream sm:text-5xl lg:text-6xl">
              Heritage, in three movements.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-warm-grey">
            Every collection we release is rooted in the same institution
            that shaped us — its history, its purpose, and the community it
            continues to build long after we walked out of its gates.
          </p>
        </div>

        <div className="grid grid-cols-1 divide-y divide-gold/20 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {columns.map((column, i) => (
            <HeritageCard key={column.numeral} index={i}>
              <span className="font-display text-3xl italic text-gold">
                {column.numeral}
              </span>
              <h3 className="mt-6 font-display text-2xl text-cream">
                {column.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-warm-grey">
                {column.body}
              </p>
            </HeritageCard>
          ))}
        </div>
      </div>
    </section>
  );
}
