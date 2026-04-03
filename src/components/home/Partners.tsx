"use client";

const domesticPartners = [
  { name: "삼성물산", logo: "SAMSUNG C&T" },
  { name: "LF", logo: "LF" },
  { name: "파크랜드", logo: "PARKLAND" },
];

const exportCountries = [
  "Japan", "USA", "Vietnam", "Thailand",
];

export default function Partners({
  variant = "section",
}: {
  variant?: "section" | "panel";
}) {
  const isPanel = variant === "panel";

  return (
    <section
      className={isPanel ? "bg-transparent px-4 py-8 md:px-6 md:py-10" : "bg-white px-6 py-24 md:px-10 md:py-32"}
      data-home-panel-variant={variant}
      data-home-section="partners"
    >
      <div className={isPanel ? "mx-auto max-w-6xl space-y-16 md:space-y-20" : "mx-auto max-w-7xl space-y-24"}>
        <div>
          <h2 className={isPanel ? "mb-10 text-center text-xs uppercase tracking-[0.22em] text-gray-400" : "mb-16 text-center text-sm uppercase tracking-[0.2em] text-gray-400"}>
            Trusted by Industry Leaders
          </h2>
          <div className={isPanel ? "flex flex-col items-center justify-center gap-10 opacity-80 mix-blend-multiply md:flex-row md:gap-[4.5rem]" : "flex flex-col items-center justify-center gap-12 opacity-80 mix-blend-multiply md:flex-row md:gap-24"}>
            {domesticPartners.map((partner) => (
              <div key={partner.name} className="flex flex-col items-center group">
                <span className="text-3xl md:text-4xl font-serif font-medium tracking-widest text-gray-800 transition-colors group-hover:text-black">
                  {partner.logo}
                </span>
                <span className="text-xs text-gray-400 mt-3 tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  {partner.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={isPanel ? "border-t border-gray-100 pt-12 md:pt-14" : "border-t border-gray-100 pt-20"}>
          <h2 className={isPanel ? "mb-10 text-center text-xs uppercase tracking-[0.22em] text-gray-400" : "mb-12 text-center text-sm uppercase tracking-[0.2em] text-gray-400"}>
            Global Presence
          </h2>
          <div className={isPanel ? "flex flex-wrap items-center justify-center gap-6 md:gap-12" : "flex flex-wrap items-center justify-center gap-8 md:gap-20"}>
            {exportCountries.map((country) => (
              <div key={country} className="flex items-center gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                <span className={isPanel ? "text-lg font-light tracking-wide text-gray-600 md:text-xl" : "text-xl md:text-2xl font-light text-gray-600 tracking-wide"}>
                  {country}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
