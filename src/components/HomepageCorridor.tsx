import Image from "next/image";

import manifest from "../../public/stage-fabrics/manifest.json";

type StageCategoryId = "checks" | "stripes" | "others";

type FabricItem = {
  src: string;
  name: string;
  category: StageCategoryId;
};

type VariantDefinition = {
  id: "A" | "B" | "C";
  title: string;
  mood: string;
  summary: string;
  sectionClassName: string;
  badgeClassName: string;
  eyebrowClassName: string;
  headingClassName: string;
  copyClassName: string;
  frameClassName: string;
  sceneClassName: string;
  tagClassName: string;
  accentClassName: string;
};

const categoryOrder: StageCategoryId[] = ["checks", "stripes", "others"];

const categoryMeta: Record<
  StageCategoryId,
  {
    title: string;
    kicker: string;
    description: string;
  }
> = {
  checks: {
    title: "Checks",
    kicker: "Scene 02",
    description:
      "All check fabrics appear once in a disciplined salon-style wall with clean spacing and direct product legibility.",
  },
  stripes: {
    title: "Stripes",
    kicker: "Scene 03",
    description:
      "All stripe fabrics follow as a brighter linear sequence so the corridor reads like a product comparison rather than an effect layer.",
  },
  others: {
    title: "Others",
    kicker: "Scene 04",
    description:
      "Oxford, dobby, and the remaining structures close each run with the same white-ground precision and full-card visibility.",
  },
};

const variants: VariantDefinition[] = [
  {
    id: "A",
    title: "Minimal Luxury",
    mood: "Calm spacing, editorial restraint, quiet luxury rhythm.",
    summary:
      "A pared-back corridor with generous whitespace, restrained typography, and museum-clean product spacing.",
    sectionClassName: "border-black/10 bg-white",
    badgeClassName: "border-black/10 bg-[#f5f1eb] text-black",
    eyebrowClassName: "text-black/45",
    headingClassName: "text-black",
    copyClassName: "text-black/62",
    frameClassName: "border-black/8 bg-[#fcfaf7] shadow-[0_28px_90px_-60px_rgba(15,23,42,0.22)]",
    sceneClassName: "border-black/8 bg-white shadow-[0_22px_70px_-56px_rgba(15,23,42,0.16)]",
    tagClassName: "border-black/8 bg-white text-black/56",
    accentClassName: "bg-[#dac7ae]",
  },
  {
    id: "B",
    title: "Gallery Archive",
    mood: "Curatorial labels, catalog metadata, archival framing.",
    summary:
      "An archive-led presentation that treats every scene like a documented collection wall with visible indexing.",
    sectionClassName: "border-[#d8d2c8] bg-[#fffdf8]",
    badgeClassName: "border-[#cfc7ba] bg-[#f2ede3] text-black",
    eyebrowClassName: "text-black/50",
    headingClassName: "text-black",
    copyClassName: "text-black/64",
    frameClassName: "border-[#d8d2c8] bg-white shadow-[0_28px_90px_-60px_rgba(84,63,43,0.18)]",
    sceneClassName: "border-[#d8d2c8] bg-[#fffdfa] shadow-[0_22px_70px_-56px_rgba(84,63,43,0.16)]",
    tagClassName: "border-[#d8d2c8] bg-white text-black/60",
    accentClassName: "bg-[#b79d75]",
  },
  {
    id: "C",
    title: "Runway Kinetic",
    mood: "Sharper pacing, bolder separators, faster editorial energy.",
    summary:
      "A more directional corridor with stronger labels and brisk sequencing while keeping every fabric image untouched on white.",
    sectionClassName: "border-black bg-white",
    badgeClassName: "border-black bg-black text-white",
    eyebrowClassName: "text-black/58",
    headingClassName: "text-black",
    copyClassName: "text-black/68",
    frameClassName: "border-black bg-white shadow-[0_28px_90px_-56px_rgba(15,15,15,0.16)]",
    sceneClassName: "border-black bg-white shadow-[0_22px_70px_-52px_rgba(15,15,15,0.12)]",
    tagClassName: "border-black bg-white text-black/72",
    accentClassName: "bg-black",
  },
];

const categoryEntries = manifest as Record<StageCategoryId, FabricItem[]>;

function formatFabricName(name: string) {
  return name
    .replace(/^IMG_/, "")
    .split("_")
    .filter(Boolean)
    .join(" · ");
}

function HandoffScene({ variant }: { variant: VariantDefinition }) {
  return (
    <article className={`rounded-[2rem] border p-5 md:p-8 ${variant.sceneClassName}`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={`font-sans text-[10px] uppercase tracking-[0.34em] ${variant.eyebrowClassName}`}>
            Scene 01
          </p>
          <h3 className="mt-2 font-serif text-[2rem] tracking-[-0.04em] text-black md:text-[2.6rem]">
            Cinematic video handoff
          </h3>
        </div>
        <span className={`rounded-full border px-3 py-1.5 font-sans text-[10px] uppercase tracking-[0.28em] ${variant.tagClassName}`}>
          Temporary label · Variant {variant.id}
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-center">
        <div className={`relative overflow-hidden rounded-[1.6rem] border ${variant.frameClassName}`}>
          <div className="relative aspect-[4/3] bg-white">
            <Image
              src="/hero/homepage-loop-original-poster.jpg?v=20260319-2106"
              alt="Top video handoff still"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="space-y-5">
          <p className={`font-sans text-sm leading-7 ${variant.copyClassName}`}>
            The corridor begins by carrying the tone of the top video downward, then hands the
            page into direct fabric comparison without dimming, blurring, or fading the product
            photography.
          </p>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {categoryOrder.map((category) => (
              <div
                key={`${variant.id}-${category}-handoff`}
                className="rounded-[1.25rem] border border-black/8 bg-white p-4"
              >
                <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-black/40">
                  {categoryMeta[category].kicker}
                </p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <div>
                    <p className="font-serif text-[1.4rem] tracking-[-0.04em] text-black">
                      {categoryMeta[category].title}
                    </p>
                    <p className="mt-1 font-sans text-xs text-black/50">
                      {categoryEntries[category].length} fabrics
                    </p>
                  </div>
                  <span className={`h-2.5 w-2.5 rounded-full ${variant.accentClassName}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function CategoryScene({
  variant,
  category,
}: {
  variant: VariantDefinition;
  category: StageCategoryId;
}) {
  const items = categoryEntries[category];
  const meta = categoryMeta[category];

  return (
    <article className={`rounded-[2rem] border p-5 md:p-8 ${variant.sceneClassName}`}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className={`font-sans text-[10px] uppercase tracking-[0.34em] ${variant.eyebrowClassName}`}>
            {meta.kicker}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h3 className="font-serif text-[2rem] tracking-[-0.04em] text-black md:text-[2.8rem]">
              {meta.title}
            </h3>
            <span className={`rounded-full border px-3 py-1.5 font-sans text-[10px] uppercase tracking-[0.28em] ${variant.tagClassName}`}>
              {items.length} cards · 4:3 only
            </span>
          </div>
          <p className={`mt-3 max-w-2xl font-sans text-sm leading-7 ${variant.copyClassName}`}>
            {meta.description}
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1.5 font-sans text-[10px] uppercase tracking-[0.28em] ${variant.tagClassName}`}>
          Variant {variant.id} · {variant.title}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item) => (
          <figure
            key={`${variant.id}-${category}-${item.src}`}
            className={`overflow-hidden rounded-[1.35rem] border ${variant.frameClassName}`}
          >
            <div className="relative aspect-[4/3] bg-white">
              <Image
                src={item.src}
                alt={formatFabricName(item.name)}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                className="object-cover"
              />
            </div>
            <figcaption className="border-t border-black/6 bg-white px-3 py-3">
              <p className="truncate font-sans text-[11px] uppercase tracking-[0.22em] text-black/36">
                {meta.title}
              </p>
              <p className="mt-1 line-clamp-2 font-sans text-sm leading-5 text-black/72">
                {formatFabricName(item.name)}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </article>
  );
}

function VariantSection({ variant }: { variant: VariantDefinition }) {
  return (
    <section className={`rounded-[2.5rem] border p-5 md:p-8 lg:p-10 ${variant.sectionClassName}`}>
      <div className="mb-8 flex flex-col gap-5 border-b border-black/8 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full border px-3 py-1.5 font-sans text-[10px] uppercase tracking-[0.3em] ${variant.badgeClassName}`}>
              Variant {variant.id}
            </span>
            <span className={`font-sans text-[10px] uppercase tracking-[0.3em] ${variant.eyebrowClassName}`}>
              {variant.mood}
            </span>
          </div>
          <h2 className={`mt-4 font-serif text-[2.7rem] leading-none tracking-[-0.05em] md:text-[4rem] ${variant.headingClassName}`}>
            {variant.title}
          </h2>
          <p className={`mt-4 max-w-2xl font-sans text-sm leading-7 md:text-[15px] ${variant.copyClassName}`}>
            {variant.summary}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[22rem] lg:max-w-[24rem]">
          <div className="rounded-[1.2rem] border border-black/8 bg-white px-4 py-4">
            <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-black/40">
              Scene order
            </p>
            <p className="mt-2 font-sans text-sm leading-6 text-black/70">
              Video handoff → Checks → Stripes → Others
            </p>
          </div>
          <div className="rounded-[1.2rem] border border-black/8 bg-white px-4 py-4">
            <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-black/40">
              Image treatment
            </p>
            <p className="mt-2 font-sans text-sm leading-6 text-black/70">
              White background, full opacity, no blur, no dimming, no blend effects.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 md:space-y-8">
        <HandoffScene variant={variant} />
        {categoryOrder.map((category) => (
          <CategoryScene key={`${variant.id}-${category}`} variant={variant} category={category} />
        ))}
      </div>
    </section>
  );
}

export default function HomepageCorridor() {
  return (
    <section id="categories" className="bg-white py-14 md:py-20">
      <div className="mx-auto max-w-[1560px] px-4 md:px-8 lg:px-12">
        <div className="rounded-[2.5rem] border border-black/8 bg-[#f8f6f2] px-5 py-8 md:px-8 md:py-10 lg:px-10">
          <div className="max-w-4xl">
            <p className="font-sans text-[10px] uppercase tracking-[0.34em] text-black/42">
              Homepage corridor rebuild
            </p>
            <h2 className="mt-4 font-serif text-[2.8rem] leading-none tracking-[-0.05em] text-black md:text-[4.8rem]">
              Three comparison variants below the top video
            </h2>
            <p className="mt-4 max-w-3xl font-sans text-sm leading-7 text-black/62 md:text-[15px]">
              The previous floating category stage is replaced with three sequential corridor
              studies. Each study keeps the same scene order on desktop and mobile, uses the
              public manifest as the source of truth, and renders every category item exactly once
              per scene in untouched 4:3 cards.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-8 md:mt-10 md:space-y-10">
          {variants.map((variant) => (
            <VariantSection key={variant.id} variant={variant} />
          ))}
        </div>
      </div>
    </section>
  );
}
