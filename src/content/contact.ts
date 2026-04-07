export type ContactChannelIcon = "email" | "whatsapp" | "line";

export const contactContent = {
  ctaLabel: "Send Inquiry",
  alternateChannels: [
    {
      label: "Email",
      icon: "email" as const,
      href: "mailto:yjtexlab@yjtexlab.com",
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
