"use client";

import Image from "next/image";
import Link from "next/link";

export default function Projects() {
  return (
    <section className="py-20 md:py-32">
      {/* Header */}
      <div className="flex items-center justify-between px-6 md:px-10 lg:px-16 mb-10 md:mb-12">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif">Projects</h2>
        <Link
          href="/projects"
          className="text-sm tracking-widest link-underline hidden md:inline-block uppercase"
        >
          Discover all the project
        </Link>
      </div>

      {/* Featured Project Image */}
      <div className="relative w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden">
        <Image
          src="https://ext.same-assets.com/4277820220/889208968.jpeg"
          alt="Private Pied-à-Terre, Paris"
          fill
          className="object-cover"
        />
      </div>

      {/* Project Info */}
      <div className="text-center py-12 md:py-16 px-6">
        <p className="text-lg md:text-xl lg:text-2xl font-serif">
          Private Pied-à-Terre, Paris by Olga Ashby
        </p>
        <Link
          href="/projects/private-pied-a-terre-paris"
          className="inline-block mt-5 text-sm tracking-widest link-underline uppercase"
        >
          Explore the project
        </Link>
      </div>

      {/* Mobile Link */}
      <div className="px-6 md:hidden">
        <Link
          href="/projects"
          className="text-sm tracking-widest link-underline uppercase"
        >
          Discover all the project
        </Link>
      </div>
    </section>
  );
}
