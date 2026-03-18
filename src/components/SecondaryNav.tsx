"use client";

import Link from "next/link";
import { Search } from "lucide-react";

const links = [
  { label: "Moodboards", href: "/moodboards" },
  { label: "Contacts", href: "/contacts" },
  { label: "Download", href: "/download" },
];

const rightLinks = [
  { label: "Select language", href: "#" },
  { label: "Support", href: "/support" },
  { label: "Find us", href: "/find-us" },
];

export default function SecondaryNav() {
  return (
    <nav className="bg-[#f5f5f5] border-b border-gray-200">
      <div className="flex items-center justify-between px-6 md:px-10 py-3">
        {/* Left Links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm tracking-wide text-gray-700 hover:text-black transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 md:flex-none flex justify-center md:justify-start">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search"
              className="w-32 md:w-40 bg-transparent border-b border-gray-400 py-1.5 pr-8 text-sm focus:outline-none focus:border-black transition-colors placeholder:text-gray-500"
            />
            <Search
              size={16}
              className="absolute right-0 text-gray-500"
            />
          </div>
        </div>

        {/* Right Links */}
        <div className="hidden md:flex items-center gap-8">
          {rightLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm tracking-wide text-gray-700 hover:text-black transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
