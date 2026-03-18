"use client";

import Image from "next/image";
import Link from "next/link";

export default function News() {
  return (
    <section className="py-20 md:py-32 px-6 md:px-10 lg:px-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-10 md:mb-14">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif">News</h2>
        <Link
          href="/news"
          className="text-sm tracking-widest link-underline hidden md:inline-block uppercase"
        >
          Discover all the news
        </Link>
      </div>

      {/* News Card */}
      <Link
        href="/news/louis-vuitton-art-deco"
        className="group block"
      >
        <div className="relative w-full max-w-4xl aspect-[16/10] overflow-hidden">
          <Image
            src="https://ext.same-assets.com/4277820220/2554419207.jpeg"
            alt="Louis Vuitton Art Deco Exhibition"
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </div>
        <div className="mt-8 max-w-4xl">
          <p className="text-xl md:text-2xl font-serif italic leading-relaxed">
            Dedar fabrics chosen for the Louis Vuitton Art Deco exhibition in Paris
          </p>
          <span className="inline-block mt-5 text-sm tracking-widest link-underline-reverse uppercase">
            Discover more
          </span>
        </div>
      </Link>

      {/* Mobile Link */}
      <div className="mt-10 md:hidden">
        <Link
          href="/news"
          className="text-sm tracking-widest link-underline uppercase"
        >
          Discover all the news
        </Link>
      </div>
    </section>
  );
}
