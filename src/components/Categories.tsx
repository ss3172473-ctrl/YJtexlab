"use client";

import Image from "next/image";
import Link from "next/link";

const categories = [
  {
    title: "Stripes (스트라이프)",
    image: "https://ext.same-assets.com/4277820220/275990234.jpeg",
    link: "/categories/stripes",
  },
  {
    title: "Checks (체크)",
    image: "https://ext.same-assets.com/4277820220/54652495.jpeg",
    link: "/categories/checks",
  },
];

export default function Categories() {
  return (
    <section className="py-24 md:py-36 px-6 md:px-10 lg:px-16">
      {/* Header */}
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif mb-12 md:mb-16">
        What are you looking for?
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-4xl mx-auto">
        {categories.map((category) => (
          <Link
            key={category.title}
            href={category.link}
            className="group"
          >
            <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
              <Image
                src={category.image}
                alt={category.title}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </div>
            <h3 className="mt-5 text-base md:text-lg font-sans tracking-[0.01em]">
              {category.title}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
