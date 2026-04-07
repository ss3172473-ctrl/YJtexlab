import { Fragment } from "react";
import { Mail, MessageCircle, MessagesSquare } from "lucide-react";
import { contactContent, type ContactChannelIcon } from "@/content/contact";

import ContactInquiryForm from "./ContactInquiryForm";

const contactChannelIcons: Record<ContactChannelIcon, typeof Mail> = {
  email: Mail,
  whatsapp: MessageCircle,
  line: MessagesSquare,
};

export default function ContactPage() {
  return (
    <main className="bg-white">
      <section className="relative overflow-hidden border-b border-gray-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.06),_transparent_34%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(15,23,42,0.15),transparent)]" />

        <div className="relative mx-auto flex min-h-[calc(100svh-72px)] max-w-6xl items-center px-6 py-5 md:min-h-[calc(100svh-84px)] md:px-10 md:py-6 lg:px-16">
          <aside className="relative w-full border border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-6 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] md:p-8 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:p-10">
            <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(15,23,42,0.18),transparent)]" />

            <div className="flex flex-col justify-between gap-8">
              <div className="space-y-5">
                <span className="font-sans text-[11px] uppercase tracking-[0.34em] text-black/42">
                  Contact
                </span>
                <h1 className="max-w-[11ch] font-serif text-[2.35rem] leading-[0.92] tracking-[-0.065em] text-black md:text-[2.85rem]">
                  Send inquiry
                </h1>
              </div>

              <div className="space-y-4 border-t border-black/10 pt-5">
                <p className="font-sans text-[11px] uppercase tracking-[0.28em] text-black/42">
                  Other contact options
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] uppercase tracking-[0.24em] text-black/68">
                  {contactContent.alternateChannels.map((channel, index) => {
                    const Icon = contactChannelIcons[channel.icon];
                    const itemClassName =
                      "inline-flex items-center gap-2 transition-colors hover:text-black";

                    return (
                      <Fragment key={channel.label}>
                        {index > 0 ? (
                          <span aria-hidden="true" className="text-black/18">
                            |
                          </span>
                        ) : null}
                        {"href" in channel ? (
                          <a href={channel.href} className={itemClassName}>
                            <Icon className="h-4 w-4" strokeWidth={1.7} />
                            <span>{channel.label}</span>
                          </a>
                        ) : (
                          <div className={itemClassName}>
                            <Icon className="h-4 w-4" strokeWidth={1.7} />
                            <span>{channel.label}</span>
                          </div>
                        )}
                      </Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 lg:mt-0">
              <ContactInquiryForm ctaLabel={contactContent.ctaLabel} />
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
