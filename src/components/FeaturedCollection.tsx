"use client";

import Image from "next/image";
import Link from "next/link";

export default function FeaturedCollection() {
  return (
    <section className="py-20 md:py-32 bg-gray-50">
      <div className="px-6 md:px-10 lg:px-16 mb-10 md:mb-16">
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif">Featured Collection</h2>
      </div>
      
      <div className="relative w-full aspect-[2/1] md:aspect-[3/1] bg-gray-200">
         <Image 
          src="https://ext.same-assets.com/4277820220/1244513772.jpeg" 
          alt="Featured Collection" 
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
          <h3 className="text-4xl md:text-6xl font-serif mb-4">The Art of Yarn-Dyed Cotton</h3>
          <p className="max-w-xl text-lg md:text-xl font-light mb-8">정교한 선염 기술로 완성된 스트라이프와 체크 패턴의 세련된 조화를 만나보세요.</p>
          <Link
            href="/collections/featured"
            className="px-8 py-3 border border-white text-sm tracking-widest uppercase hover:bg-white hover:text-black transition-colors"
          >
            Explore Collection
          </Link>
        </div>
      </div>
    </section>
  );
}
