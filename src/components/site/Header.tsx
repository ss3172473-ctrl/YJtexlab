"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu, X } from "lucide-react";
import { headerRoutes } from "@/lib/route-matrix";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActivePath = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

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
            <div className="flex items-center gap-1.5 font-brand-logo">
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
            <div className="flex justify-between w-full mt-0 text-[6.5px] md:text-[7.5px] lg:text-[8.5px] font-bold text-black font-brand-logo leading-none">
              <span>S</span><span>I</span><span>N</span><span>C</span><span>E</span>
              <span className="w-2"></span>
              <span>1</span><span>9</span><span>6</span><span>2</span>
            </div>
          </div>
        </Link>

        <div className="flex items-center justify-end">
          <nav aria-label="Primary" className="hidden items-center gap-6 xl:gap-8 lg:flex">
            {headerRoutes.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "text-sm tracking-wide transition-colors font-sans",
                  isActivePath(item.href)
                    ? "text-black"
                    : "text-gray-800 hover:text-black",
                ].join(" ")}
                aria-current={isActivePath(item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <button type="button" className="p-2 -mr-2 md:hidden" aria-label="Search">
            <Search size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 animate-fade-in absolute w-full max-h-[calc(100vh-100%)] overflow-y-auto">
          <nav aria-label="Mobile" className="flex flex-col py-4">
            {headerRoutes.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "px-6 py-3 text-sm tracking-wide transition-colors font-sans",
                  isActivePath(item.href)
                    ? "bg-gray-50 text-black"
                    : "hover:bg-gray-50 text-gray-800",
                ].join(" ")}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={isActivePath(item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
