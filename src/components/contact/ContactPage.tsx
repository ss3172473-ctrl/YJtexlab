import { contactContent } from "@/content/contact";

import ContactInquiryForm from "./ContactInquiryForm";

export default function ContactPage() {
  return (
    <main className="bg-white">
      <section className="relative overflow-hidden border-b border-gray-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.06),_transparent_34%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(15,23,42,0.15),transparent)]" />

        <div className="relative mx-auto max-w-4xl px-6 py-16 md:px-10 md:py-20 lg:px-16 lg:py-24">
          <aside className="relative border border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-6 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] md:p-8">
            <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(15,23,42,0.18),transparent)]" />
            <div className="space-y-4">
              <span className="font-sans text-[11px] uppercase tracking-[0.34em] text-black/42">
                Contact
              </span>
              <h2 className="font-serif text-[2.15rem] leading-[0.92] tracking-[-0.06em] text-black md:text-[2.6rem]">
                Send inquiry
              </h2>
            </div>

            <div className="mt-8">
              <ContactInquiryForm ctaLabel={contactContent.ctaLabel} />
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
