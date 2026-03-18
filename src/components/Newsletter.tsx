"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

export default function Newsletter() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log("Subscribing:", email);
    setEmail("");
  };

  return (
    <section className="py-20 md:py-28 px-6 md:px-10 lg:px-16 border-t border-gray-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif">
          Subscribe to our newsletter
        </h2>

        <form onSubmit={handleSubmit} className="w-full md:w-auto">
          <div className="flex items-center border-b border-gray-300 pb-3 hover:border-gray-500 transition-colors focus-within:border-black">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="w-full md:w-96 bg-transparent text-base focus:outline-none placeholder:text-gray-400"
              required
            />
            <button
              type="submit"
              className="p-2 hover:opacity-50 transition-opacity ml-2"
              aria-label="Subscribe"
            >
              <ArrowRight size={22} strokeWidth={1.5} />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
