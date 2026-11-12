"use client";

import Link from "next/link";
import { useState } from "react";
import {
  footerCompanyRoutes,
  footerLegalRoutes,
  footerProductRoutes,
} from "@/lib/route-matrix";

export default function Footer() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <footer className="bg-white border-t border-gray-100 px-6 pt-5 pb-8 md:px-10 lg:px-16">
      <div aria-hidden="true" className="sr-only">
        {footerCompanyRoutes.map((item) => (
          <Link href={item.href} key={`hidden-company-${item.id}`}>
            {item.label}
          </Link>
        ))}
        {footerLegalRoutes.map((item) => (
          <Link href={item.href} key={`hidden-legal-${item.id}`}>
            {item.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-gray-400 md:text-[11px] md:tracking-[0.22em]">
          <a
            href="mailto:yjtexlab@gmail.com"
            className="transition-colors hover:text-black"
          >
            Email
          </a>
          <span aria-hidden="true">|</span>
          <a
            href="https://wa.me/821053172473"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-black"
          >
            WhatsApp
          </a>
          <span aria-hidden="true">|</span>
          <a
            href="https://line.me/ti/p/MnRGKgjLnt"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-black"
          >
            LINE
          </a>
        </div>
        <button
          aria-expanded={isExpanded}
          className="shrink-0 text-[11px] font-medium uppercase tracking-[0.26em] text-gray-500 transition-colors hover:text-black"
          onClick={() => setIsExpanded((current) => !current)}
          type="button"
        >
          [{isExpanded ? "Close Footer" : "Open Footer"}]
        </button>
      </div>

      {isExpanded ? (
        <>
      <div className="mt-10 mb-16 grid grid-cols-1 gap-12 md:grid-cols-4">
        <div>
          <img
            src="/brand/yjtexlab-logo.png"
            alt="YJ TexLab"
            width={405}
            height={200}
            className="mb-6 block h-16 w-auto"
            loading="lazy"
          />
          <p className="text-gray-500 text-sm max-w-xs mt-4">60년 전통의 최고급 선염 면원단 전문 기업.</p>
        </div>

        <div>
          <h4 className="font-serif text-lg mb-6 text-gray-900">Products</h4>
          <ul className="space-y-3 text-sm text-gray-500">
            {footerProductRoutes.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="hover:text-black transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
           <h4 className="font-serif text-lg mb-6 text-gray-900">Company</h4>
          <ul className="space-y-3 text-sm text-gray-500">
            {footerCompanyRoutes.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="hover:text-black transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
           <h4 className="font-serif text-lg mb-6 text-gray-900">Follow Us</h4>
          <ul className="space-y-3 text-sm text-gray-500">
            <li><a href="#" className="hover:text-black transition-colors">Instagram</a></li>
            <li><a href="#" className="hover:text-black transition-colors">LinkedIn</a></li>
          </ul>
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-8 pb-20 flex flex-col justify-between gap-4 text-xs text-gray-500 md:flex-row md:items-center">
        <p>© {new Date().getFullYear()} YJ TexLab. All rights reserved.</p>
        <div className="flex gap-6">
          {footerLegalRoutes.map((item) => (
            <Link key={item.id} href={item.href} className="hover:text-black transition-colors">
              {item.label}
            </Link>
          ))}
        </div>
      </div>
        </>
      ) : null}
    </footer>
  );
}
