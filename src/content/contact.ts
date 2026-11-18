import { businessContact } from "@/lib/business-contact";

export type ContactChannelIcon = "email" | "whatsapp" | "line";

export const contactContent = {
  ctaLabel: "Send Inquiry",
  alternateChannels: [
    {
      label: "Email",
      icon: "email" as const,
      href: `mailto:${businessContact.email}`,
    },
    {
      label: "WhatsApp",
      icon: "whatsapp" as const,
    },
    {
      label: "LINE",
      icon: "line" as const,
    },
  ],
} as const;
