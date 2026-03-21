"use client";

import Image from "next/image";

import {
  stageCatalog,
  stageCategories,
  stageVariants,
  type StageCategoryId,
  type StageFabricItem,
  type StageVariant,
  type StageVariantId,
} from "@/components/fabric-stage/config";

function sectionShell(variantId: StageVariantId) {
  if (variantId === "B") {
    return "rounded-[2.5rem] border border-black/10 bg-white px-5 py-6 shadow-[0_18px_70px_-42px_rgba(15,23,42,0.16)] md:px-8 md:py-8";
  }

  if (variantId === "C") {
    return "rounded-[2.5rem] border border-black/10 bg-white px-5 py-6 shadow-[0_28px_90px_-48px_rgba(31,79,140,0.22)] md:px-8 md:py-8";
  }

  return "rounded-[2.5rem] border border-black/8 bg-white px-5 py-6 shadow-[0_22px_80px_-50px_rgba(15,23,42,0.16)] md:px-8 md:py-8";
}

function badgeShell(variantId: StageVariantId) {
  if (variantId === "B") {
    return "border-black/12 bg-[#faf7f2] text-black/70";
  }

  if (variantId === "C") {
    return "border-[#1f4f8c]/20 bg-[#f4f8fd] text-[#1f4f8c]";
  }

  return "border-black/10 bg-white text-black/68";
}

function cardShell(variantId: StageVariantId, index: number) {
  const base =
    "relative overflow-hidden rounded-[1.5rem] border bg-white shadow-[0_12px_44px_-28px_rgba(15,23,42,0.18)] transition-transform duration-300";

  if (variantId === "B") {
    return `${base} border-black/12 shadow-none`;
  }

  if (variantId === "C") {
    const kinetic = [
      "md:-translate-y-2 md:-rotate-[1.2deg]",
      "md:translate-y-3 md:rotate-[1.1deg]",
      "md:-translate-y-1 md:rotate-[0.6deg]",
      "md:translate-y-4 md:-rotate-[1.1deg]",
      "md:-translate-y-3 md:rotate-[1.4deg]",
    ][index % 5];

    return `${base} border-black/10 ${kinetic}`;
  }

  return `${base} border-black/8`;
}

function imageSizes(columns: 2 | 4 | 5) {
  if (columns === 5) {
    return "(min-width: 1536px) 18vw, (min-width: 1280px) 19vw, (min-width: 1024px) 23vw, (min-width: 640px) 46vw, 94vw";
  }

  if (columns === 4) {
    return "(min-width: 1280px) 22vw, (min-width: 1024px) 24vw, (min-width: 640px) 46vw, 94vw";
  }

  return "(min-width: 640px) 46vw, 94vw";
}

function FabricCard({
  item,
  categoryId,
  index,
  variantId,
}: {
  item: StageFabricItem;
  categoryId: StageCategoryId;
  index: number;
  variantId: StageVariantId;
}) {
  const category = stageCategories[categoryId];

  return (
    <article className={cardShell(variantId, index)}>
      <div className="relative aspect-[4/3] bg-white">
        <Image
          src={item.src}
          alt={item.name}
          fill
          sizes={imageSizes(5)}
          className="object-cover"
        />
        <div
          className={`absolute left-3 top-3 rounded-full border px-3 py-1 font-sans text-[10px] uppercase tracking-[0.24em] ${badgeShell(variantId)}`}
        >
          {category.title} · {String(index + 1).padStart(2, "0")}
        </div>
        <div
          className={`absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded-full border px-3 py-1 font-sans text-[10px] uppercase tracking-[0.18em] ${badgeShell(variantId)}`}
        >
          {item.name}
        </div>
      </div>
    </article>
  );
}

function HandoffScene({ variant }: { variant: StageVariant }) {
  return (
    <section className={sectionShell(variant.id)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="font-sans text-[11px] uppercase tracking-[0.34em] text-black/45">
            Scene 01 · Cinematic video handoff
          </p>
          <h3 className="mt-3 font-serif text-[2rem] leading-none tracking-[-0.04em] text-black md:text-[2.6rem]">
            {variant.title}
          </h3>
          <p className="mt-4 max-w-2xl font-sans text-sm leading-6 text-black/62 md:text-[15px]">
            {variant.bridge}
          </p>
        </div>
        <div
          className={`inline-flex w-fit items-center rounded-full border px-4 py-2 font-sans text-[11px] uppercase tracking-[0.3em] ${badgeShell(variant.id)}`}
        >
          {variant.label} · {variant.mood}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {variant.handoffCards.map((card, index) => (
          <article key={`${variant.id}-${card.caption}`} className={cardShell(variant.id, index)}>
            <div className="relative aspect-[4/3] bg-white">
              <Image
                src={card.src}
                alt={card.alt}
                fill
                priority={variant.id === "A" && index === 0}
                sizes={imageSizes(4)}
                className="object-cover"
              />
              <div
                className={`absolute left-3 top-3 rounded-full border px-3 py-1 font-sans text-[10px] uppercase tracking-[0.24em] ${badgeShell(variant.id)}`}
              >
                {card.caption}
              </div>
              <div
                className={`absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded-full border px-3 py-1 font-sans text-[10px] uppercase tracking-[0.16em] ${badgeShell(variant.id)}`}
              >
                {card.note}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function FabricScene({
  variant,
  categoryId,
}: {
  variant: StageVariant;
  categoryId: StageCategoryId;
}) {
  const category = stageCategories[categoryId];
  const items = stageCatalog[categoryId];

  return (
    <section className={sectionShell(variant.id)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="font-sans text-[11px] uppercase tracking-[0.34em] text-black/45">
            {category.label} · {category.title}
          </p>
          <h3 className="mt-3 font-serif text-[2rem] leading-none tracking-[-0.04em] text-black md:text-[2.4rem]">
            {category.sceneTitle}
          </h3>
          <p className="mt-4 max-w-2xl font-sans text-sm leading-6 text-black/62 md:text-[15px]">
            {category.summary}
          </p>
        </div>
        <div
          className={`inline-flex w-fit items-center rounded-full border px-4 py-2 font-sans text-[11px] uppercase tracking-[0.3em] ${badgeShell(variant.id)}`}
        >
          {items.length} items · one pass only
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        {items.map((item, index) => (
          <FabricCard
            key={`${variant.id}-${categoryId}-${item.src}`}
            item={item}
            categoryId={categoryId}
            index={index}
            variantId={variant.id}
          />
        ))}
      </div>
    </section>
  );
}

export default function ScrollFabricStage() {
  return (
    <section id="categories" className="relative overflow-hidden bg-white py-16 md:py-24">
      <div className="mx-auto max-w-[1600px] px-5 md:px-8 lg:px-12">
        <div className="max-w-4xl">
          <p className="font-sans text-[11px] uppercase tracking-[0.38em] text-black/45">
            Homepage corridor rebuild
          </p>
          <h2 className="mt-5 max-w-[13ch] font-serif text-[3rem] leading-[0.92] tracking-[-0.05em] text-black md:text-[4.5rem]">
            Three comparison corridors between the hero and partners.
          </h2>
          <p className="mt-5 max-w-3xl font-sans text-base leading-7 text-black/62 md:text-lg">
            The section below the top video is rebuilt as three sequential options with visible
            labels, matching mobile order, white backgrounds, and category scenes that render
            every manifest item exactly once per scene.
          </p>
        </div>

        <div className="mt-12 space-y-16 md:mt-16 md:space-y-20">
          {stageVariants.map((variant) => (
            <article
              key={variant.id}
              className="rounded-[2.75rem] border border-black/8 bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_72%,#fafafa_100%)] p-5 md:p-8 lg:p-10"
            >
              <div className="flex flex-col gap-5 border-b border-black/8 pb-8 md:flex-row md:items-start md:justify-between">
                <div className="max-w-3xl">
                  <div
                    className={`inline-flex items-center rounded-full border px-4 py-2 font-sans text-[11px] uppercase tracking-[0.3em] ${badgeShell(variant.id)}`}
                  >
                    {variant.label} · {variant.mood}
                  </div>
                  <h3 className="mt-5 font-serif text-[2.4rem] leading-none tracking-[-0.04em] text-black md:text-[3.4rem]">
                    {variant.title}
                  </h3>
                  <p className="mt-4 max-w-2xl font-sans text-sm leading-6 text-black/62 md:text-[15px]">
                    {variant.intro}
                  </p>
                </div>
                <div className="grid gap-3 self-start sm:grid-cols-3 md:w-[28rem]">
                  {(["checks", "stripes", "others"] as StageCategoryId[]).map((categoryId) => {
                    const category = stageCategories[categoryId];
                    return (
                      <div
                        key={`${variant.id}-${categoryId}-summary`}
                        className="rounded-[1.25rem] border border-black/8 bg-white px-4 py-3"
                      >
                        <p className="font-sans text-[10px] uppercase tracking-[0.26em] text-black/40">
                          {category.label}
                        </p>
                        <p className="mt-2 font-serif text-xl tracking-[-0.03em] text-black">
                          {category.title}
                        </p>
                        <p className="mt-1 font-sans text-xs text-black/54">
                          {stageCatalog[categoryId].length} cards
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 space-y-8 md:mt-10 md:space-y-10">
                <HandoffScene variant={variant} />
                <FabricScene variant={variant} categoryId="checks" />
                <FabricScene variant={variant} categoryId="stripes" />
                <FabricScene variant={variant} categoryId="others" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
