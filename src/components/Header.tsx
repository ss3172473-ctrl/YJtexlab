"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Menu, X } from "lucide-react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 mt-[env(safe-area-inset-top)]">
      <div className="grid grid-cols-[auto_1fr_auto] items-center px-6 py-4 md:px-10 md:py-5 lg:grid-cols-[1fr_auto_1fr] lg:px-16">
        <div className="flex items-center justify-start">
          <button
            type="button"
            className="p-2 -ml-2 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
          </button>
        </div>

        <Link href="/" className="justify-self-center">
          <div className="flex flex-col items-stretch">
            <div className="flex items-center gap-1.5 font-sans">
              <span className="text-[20px] md:text-[24px] lg:text-[28px] font-black tracking-tight leading-none text-black">
                YJ
              </span>
              <div className="relative inline-block mt-0.5">
                <div className="absolute -top-[2px] md:-top-[3px] left-0 right-0 border-t-[2.5px] border-black" />
                <span className="text-[20px] md:text-[24px] lg:text-[28px] font-black tracking-tight leading-none text-black">
                  TEXLAB
                </span>
              </div>
            </div>
            <div className="flex justify-between w-full mt-0 text-[6.5px] md:text-[7.5px] lg:text-[8.5px] font-bold text-black font-sans leading-none">
              <span>S</span><span>I</span><span>N</span><span>C</span><span>E</span>
              <span className="w-2"></span>
              <span>1</span><span>9</span><span>6</span><span>2</span>
            </div>
          </div>
        </Link>

        <div className="flex items-center justify-end">
          <nav className="hidden items-center gap-8 lg:flex">
            <Link href="/products" className="text-sm tracking-wide text-gray-800 hover:text-black transition-colors font-sans">
              Products
            </Link>
            <Link href="/projects" className="text-sm tracking-wide text-gray-800 hover:text-black transition-colors font-sans">
              Projects
            </Link>
            <Link href="/stories" className="text-sm tracking-wide text-gray-800 hover:text-black transition-colors font-sans">
              Stories
            </Link>
          </nav>

          <button type="button" className="p-2 -mr-2 md:hidden" aria-label="Search">
            <Search size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 animate-fade-in absolute w-full max-h-[calc(100vh-100%)] overflow-y-auto">
          <nav className="flex flex-col py-4">
            <Link href="/products" className="px-6 py-3 text-sm tracking-wide hover:bg-gray-50 transition-colors font-sans" onClick={() => setMobileMenuOpen(false)}>
              Products
            </Link>
            <Link href="/projects" className="px-6 py-3 text-sm tracking-wide hover:bg-gray-50 transition-colors font-sans" onClick={() => setMobileMenuOpen(false)}>
              Projects
            </Link>
            <Link href="/stories" className="px-6 py-3 text-sm tracking-wide hover:bg-gray-50 transition-colors font-sans" onClick={() => setMobileMenuOpen(false)}>
              Stories
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
