"use client";

import Image from "next/image";
import Link from "next/link";

const fabrics = [
  {
    id: 1,
    name: "Amoir Libre",
    color: "Aqua",
    image: "https://ext.same-assets.com/4277820220/3632090382.jpeg",
  },
  {
    id: 2,
    name: "Amoir Libre",
    color: "Navy",
    bgColor: "#1a3a5c",
  },
  {
    id: 3,
    name: "Amoir Libre",
    color: "Emerald",
    bgColor: "#1a5a4a",
  },
  {
    id: 4,
    name: "Amoir Libre",
    color: "Sky",
    bgColor: "#8fb5c4",
  },
  {
    id: 5,
    name: "Amoir Libre",
    color: "Coral",
    bgColor: "#c08b7a",
  },
];

export default function FabricGallery() {
  return (
    <section className="py-20 md:py-32 px-6 md:px-10">
      {/* Header */}
      <div className="px-6 md:px-10 lg:px-16 mb-12 md:mb-20">
        <h2 className="text-4xl md:text-5xl lg:text-7xl font-serif leading-tight max-w-4xl">
          Heritage & Quality:<br /> 60년의 노하우
        </h2>
      </div>

      <div className="mt-16 md:mt-20 flex flex-col md:flex-row gap-8 md:gap-12">
        {/* Main Featured Image - Left side */}
        <div className="w-full md:w-1/2">
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={fabrics[0].image!}
              alt="Quality & Heritage featured"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Fabric Swatches - Right side, staggered */}
        <div className="w-full md:w-1/2 flex flex-col gap-8">
          {/* Row with 2 items */}
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {fabrics.slice(1, 3).map((fabric) => (
              <Link
                key={fabric.id}
                href={`/products/${fabric.id}`}
                className="group"
              >
                <div
                  className="relative aspect-square overflow-hidden transition-all duration-500 group-hover:shadow-lg"
                  style={{ backgroundColor: fabric.bgColor }}
                >
                  {/* Moiré texture overlay effect */}
                  <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-white/30 via-transparent to-black/20" />
                </div>
                <p className="mt-3 text-sm text-center text-gray-700">
                  {fabric.name}
                </p>
              </Link>
            ))}
          </div>

          {/* Row with 2 items */}
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {fabrics.slice(3, 5).map((fabric) => (
              <Link
                key={fabric.id}
                href={`/products/${fabric.id}`}
                className="group"
              >
                <div
                  className="relative aspect-square overflow-hidden transition-all duration-500 group-hover:shadow-lg"
                  style={{ backgroundColor: fabric.bgColor }}
                >
                  {/* Moiré texture overlay effect */}
                  <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-white/30 via-transparent to-black/20" />
                </div>
                <p className="mt-3 text-sm text-center text-gray-700">
                  {fabric.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-20 md:mt-28 text-center max-w-4xl mx-auto">
          <p className="text-xl md:text-2xl font-serif max-w-3xl mx-auto mb-8 text-gray-800 leading-relaxed italic">
            60년의 장인 정신과 끊임없는 혁신. 글로벌 톱 브랜드들이 선택한 압도적인 퀄리티의 선염 면원단.
          </p>
        <Link
          href="/stories/savoir-faire"
          className="inline-block mt-10 text-sm tracking-widest link-underline uppercase"
        >
          Discover more
        </Link>
      </div>
    </section>
  );
}
