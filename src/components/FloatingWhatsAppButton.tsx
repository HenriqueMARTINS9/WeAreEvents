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
      href={buildWhatsAppUrl("Bonjour, je souhaite échanger avec wearevents au sujet d'un événement.")}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-[900] inline-flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-transform hover:scale-105 active:scale-[0.98]"
      aria-label="Contacter wearevents sur WhatsApp"
    >
      <img src="/3670051.png" alt="" className="h-full w-full rounded-full object-contain" />
    </a>
  );
};

export default FloatingWhatsAppButton;
