import { MessageCircle } from "lucide-react";
import { useLocation } from "react-router-dom";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { useIsMobile } from "@/hooks/use-mobile";

const FloatingWhatsAppButton = () => {
  const location = useLocation();
  const isMobile = useIsMobile();

  if (location.pathname.startsWith("/admin") || (isMobile && location.pathname === "/")) {
    return null;
  }

  return (
    <a
      href={buildWhatsAppUrl("Bonjour, je souhaite échanger avec WeAreEvents au sujet d'un événement.")}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-[900] inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#25D366] text-white shadow-2xl transition-transform hover:scale-105 active:scale-[0.98] sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-3"
      aria-label="Contacter WeAreEvents sur WhatsApp"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden text-sm font-body font-semibold sm:inline">WhatsApp</span>
    </a>
  );
};

export default FloatingWhatsAppButton;
