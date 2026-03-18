"use client";

const domesticPartners = [
  { name: "삼성물산", logo: "SAMSUNG C&T" },
  { name: "LF", logo: "LF" },
  { name: "파크랜드", logo: "PARKLAND" },
];

const exportCountries = [
  "Japan", "USA", "Vietnam", "Thailand"
];

export default function Partners() {
  return (
    <section className="py-24 md:py-32 px-6 md:px-10 bg-white">
      <div className="max-w-7xl mx-auto space-y-24">
        {/* Domestic Partners */}
        <div>
          <h2 className="text-sm tracking-[0.2em] uppercase text-gray-400 mb-16 text-center">
            Trusted by Industry Leaders
          </h2>
          <div className="flex flex-col md:flex-row justify-center items-center gap-12 md:gap-24 opacity-80 mix-blend-multiply">
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

        {/* Global Exports */}
        <div className="border-t border-gray-100 pt-20">
          <h2 className="text-sm tracking-[0.2em] uppercase text-center text-gray-400 mb-12">
            Global Presence
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-20">
            {exportCountries.map((country) => (
              <div key={country} className="flex items-center gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                <span className="text-xl md:text-2xl font-light text-gray-600 tracking-wide">
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
