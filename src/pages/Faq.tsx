import { useState } from "react";
import DesktopNav from "@/components/DesktopNav";
import FaqSection from "@/components/FaqSection";
import MobileHeader from "@/components/MobileHeader";
import Seo, { siteUrl } from "@/components/Seo";
import SiteFooter from "@/components/SiteFooter";
import VenueCodeSearch from "@/components/VenueCodeSearch";
import { faqItems } from "@/data/faq";
import { useIsMobile } from "@/hooks/use-mobile";

const Faq = () => {
  const isMobile = useIsMobile();
  const [showCodeSearch, setShowCodeSearch] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title="FAQ - Questions fréquentes sur la réservation de lieux"
        description="Fonctionnement de Wearevents, gratuité du service, types de lieux, délais de réservation et formats de privatisation."
        path="/faq"
        jsonLd={[{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer.join(" "),
            },
          })),
          url: `${siteUrl}/faq`,
        }, {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Accueil", item: siteUrl },
            { "@type": "ListItem", position: 2, name: "FAQ", item: `${siteUrl}/faq` },
          ],
        }]}
      />
      {isMobile ? (
        <MobileHeader onCodeSearch={() => setShowCodeSearch(true)} withBackground />
      ) : (
        <DesktopNav />
      )}

      <main className="pt-20 md:pt-24">
        <FaqSection compact={isMobile} pageTitle />
      </main>

      <SiteFooter variant="dark" />
      {showCodeSearch && (
        <VenueCodeSearch
          onClose={() => setShowCodeSearch(false)}
          onVenueFound={() => setShowCodeSearch(false)}
        />
      )}
    </div>
  );
};

export default Faq;
