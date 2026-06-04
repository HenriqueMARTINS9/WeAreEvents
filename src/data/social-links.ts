export type SocialPlatform = "instagram" | "tiktok" | "linkedin";

export type SocialLink = {
  label: string;
  platform: SocialPlatform;
  href: string;
};

export const socialLinks: SocialLink[] = [
  {
    label: "Instagram",
    platform: "instagram",
    href: import.meta.env.VITE_INSTAGRAM_URL || "https://www.instagram.com/wearevents.fr/",
  },
  {
    label: "TikTok",
    platform: "tiktok",
    href: import.meta.env.VITE_TIKTOK_URL || "https://www.tiktok.com/@wearevents",
  },
  {
    label: "LinkedIn",
    platform: "linkedin",
    href: import.meta.env.VITE_LINKEDIN_URL || "https://www.linkedin.com/company/wearevents-fr/",
  },
].filter((link) => Boolean(link.href));
