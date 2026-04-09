"use client";

type SectionId = "trusted" | "global" | "facilities";

const partners = [
  { english: "SAMSUNG C&T", korean: "삼성물산" },
  { english: "LF", korean: "LF" },
  { english: "PARKLAND", korean: "파크랜드" },
];

const markets = [
  { label: "Japan", note: "Long-running shirting and uniform programs" },
  { label: "USA", note: "Premium cotton checks and seasonal capsule supply" },
  { label: "Vietnam", note: "Regional manufacturing and export routing" },
  { label: "Thailand", note: "Steady B2B woven-fabric distribution" },
];

const bases = [
  {
    city: "Seoul",
    role: "Warehouse",
    description: "Fast-response warehousing and shipment coordination for domestic and export flow.",
  },
  {
    city: "Daegu",
    role: "Factory & Main Warehouse",
    description: "Primary manufacturing base with large-format storage and finishing infrastructure.",
  },
];

export default function FooterRevealPanelAdapters({
  sectionId,
}: {
  sectionId: SectionId;
}) {
  if (sectionId === "trusted") {
    return (
      <section className="bg-transparent px-4 py-6 md:px-6 md:py-8" data-home-section="preview-partners">
        <div className="mx-auto max-w-5xl space-y-8">
          <header className="space-y-2 text-center">
            <p className="text-[11px] uppercase tracking-[0.22em] text-gray-400">Partners</p>
            <h2 className="text-3xl font-serif text-gray-900 md:text-4xl">Trusted Domestic Partners</h2>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-gray-600 md:text-base">
              Long-term collaboration with Korean apparel and textile groups that require stable premium woven cotton supply.
            </p>
          </header>
          <div className="grid gap-4 md:grid-cols-3">
            {partners.map((partner) => (
              <div key={partner.english} className="border border-gray-200 bg-white px-5 py-6 text-center shadow-sm">
                <p className="text-xl font-medium tracking-[0.18em] text-gray-900 md:text-2xl">{partner.english}</p>
                <p className="mt-3 text-xs tracking-[0.22em] text-gray-400">{partner.korean}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (sectionId === "global") {
    return (
      <section className="bg-transparent px-4 py-6 md:px-6 md:py-8" data-home-section="preview-global-network">
        <div className="mx-auto max-w-5xl space-y-8">
          <header className="space-y-2 text-center">
            <p className="text-[11px] uppercase tracking-[0.22em] text-gray-400">Global Network</p>
            <h2 className="text-3xl font-serif text-gray-900 md:text-4xl">Export Routes And Core Markets</h2>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-gray-600 md:text-base">
              YJ TexLab’s woven fabrics move through repeat B2B programs across East Asia, Southeast Asia, and North America.
            </p>
          </header>
          <div className="grid gap-4 md:grid-cols-2">
            {markets.map((market) => (
              <div key={market.label} className="border border-gray-200 bg-white px-5 py-6 shadow-sm">
                <p className="text-lg font-medium tracking-[0.14em] text-gray-900 md:text-xl">{market.label}</p>
                <p className="mt-3 text-sm leading-7 text-gray-600">{market.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-transparent px-4 py-6 md:px-6 md:py-8" data-home-section="preview-production-bases">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-2 text-center">
          <p className="text-[11px] uppercase tracking-[0.22em] text-gray-400">Production Bases</p>
          <h2 className="text-3xl font-serif text-gray-900 md:text-4xl">Factory And Logistics Infrastructure</h2>
          <p className="mx-auto max-w-2xl text-sm leading-7 text-gray-600 md:text-base">
            Manufacturing, storage, and dispatch are split between Seoul and Daegu to support both immediate local response and large-volume operations.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          {bases.map((base) => (
            <div key={base.city} className="border border-gray-200 bg-white px-5 py-6 shadow-sm">
              <p className="text-xl font-serif text-gray-900 md:text-2xl">{base.city}</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-gray-400">{base.role}</p>
              <p className="mt-4 text-sm leading-7 text-gray-600">{base.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
