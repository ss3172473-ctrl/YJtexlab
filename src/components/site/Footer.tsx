"use client";

import Link from "next/link";
import {
  footerCompanyRoutes,
  footerLegalRoutes,
  footerProductRoutes,
} from "@/lib/route-matrix";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 pt-24 pb-12 px-6 md:px-10 lg:px-16">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div>
          <div className="flex flex-col items-start mb-6">
            <div className="flex flex-col items-stretch">
              <div className="flex items-center gap-1.5 font-brand-logo">
                <span className="text-2xl font-black tracking-tight leading-none text-black">
                  YJ
                </span>
                <div className="relative inline-block">
                  <div className="absolute -top-[2px] left-0 right-0 border-t-[2.5px] border-black" />
                  <span className="text-2xl font-black tracking-tight leading-none text-black">
                    TEXLAB
                  </span>
                </div>
              </div>
              <div className="flex justify-between w-full mt-0 text-[7.5px] font-bold text-black font-brand-logo leading-none">
                <span>S</span><span>I</span><span>N</span><span>C</span><span>E</span>
                <span className="w-2"></span>
                <span>1</span><span>9</span><span>6</span><span>2</span>
              </div>
            </div>
          </div>
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
      
      <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 gap-4">
        <p>© {new Date().getFullYear()} YJ TexLab. All rights reserved.</p>
        <div className="flex gap-6">
          {footerLegalRoutes.map((item) => (
            <Link key={item.id} href={item.href} className="hover:text-black transition-colors">
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
