import { useEffect } from "react";
import { trackWhatsAppClick } from "@/lib/analytics";

const isWhatsAppUrl = (href: string) => /(?:wa\.me|api\.whatsapp\.com|whatsapp:\/\/)/i.test(href);

const GlobalWhatsAppTracking = () => {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || !isWhatsAppUrl(link.href)) return;
      trackWhatsAppClick(link.dataset.analyticsContext || "whatsapp_global");
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);
  return null;
};

export default GlobalWhatsAppTracking;
