import Image from "next/image";

const photos = [
  "IMG_8058.JPG",
  "IMG_8059.JPG",
  "IMG_8060.JPG",
  "IMG_8061.JPG",
  "IMG_8062.JPG",
  "IMG_8063.JPG",
  "IMG_8064.JPG",
  "IMG_8065.JPG",
  "IMG_8066.JPG",
  "IMG_8067.JPG",
  "IMG_8068.JPG",
  "IMG_8070.JPG",
  "IMG_8071.JPG",
  "IMG_8072.jpg",
  "IMG_8074.jpg",
];

export default function CommunityGallery() {
  return (
    <section className="bg-maroon-dark px-6 py-24 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-xs font-medium tracking-[0.3em] text-gold">
            COMMUNITY MOMENTS
          </p>
          <h2 className="mt-6 font-display text-4xl leading-tight text-cream sm:text-5xl">
            Community Moments
          </h2>
          <p className="mt-6 text-sm leading-relaxed text-warm-grey">
            A glimpse into the moments that keep the Saikapian bond alive —
            reunions, chapter gatherings, school visits, family meetups, and
            memories shared across generations.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {photos.map((file) => (
            <div
              key={file}
              className="relative aspect-[4/3] w-full overflow-hidden border border-gold/20 bg-maroon-dark"
            >
              <Image
                src={`/images/community/${file}`}
                alt="Saikapian alumni gathering"
                fill
                className="object-contain"
                sizes="(min-width: 640px) 33vw, 50vw"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
