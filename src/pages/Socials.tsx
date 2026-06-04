import { useState } from "react";
import { ArrowUpRight, Instagram, Linkedin, Music2 } from "lucide-react";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import Seo, { siteUrl } from "@/components/Seo";
import SiteFooter from "@/components/SiteFooter";
import VenueCodeSearch from "@/components/VenueCodeSearch";
import { socialLinks, type SocialPlatform } from "@/data/social-links";
import { useIsMobile } from "@/hooks/use-mobile";

const getSocialIcon = (platform: SocialPlatform) => {
  if (platform === "instagram") return <Instagram className="h-5 w-5" />;
  if (platform === "linkedin") return <Linkedin className="h-5 w-5" />;
  return <Music2 className="h-5 w-5" />;
};

const Socials = () => {
  const isMobile = useIsMobile();
  const [showCodeSearch, setShowCodeSearch] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title="Réseaux sociaux Wearevents"
        description="Retrouvez Wearevents sur Instagram, TikTok et LinkedIn pour découvrir nos lieux, vidéos et inspirations événementielles."
        path="/reseaux-sociaux"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Réseaux sociaux Wearevents",
          url: `${siteUrl}/reseaux-sociaux`,
          sameAs: socialLinks.map((link) => link.href),
        }}
      />
      {isMobile ? (
        <MobileHeader onCodeSearch={() => setShowCodeSearch(true)} withBackground />
      ) : (
        <DesktopNav />
      )}

      <main className="px-6 pb-24 pt-32">
        <section className="mx-auto max-w-5xl">
          <p className="font-body text-sm font-semibold text-primary">Réseaux sociaux</p>
          <h1 className="mt-3 font-heading text-5xl font-semibold leading-none md:text-6xl">
            Suivez Wearevents.
          </h1>
          <p className="mt-5 max-w-3xl font-body text-base leading-relaxed text-muted-foreground md:text-lg">
            Retrouvez nos vidéos de lieux, inspirations événementielles et nouveautés sur nos réseaux.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="group rounded-lg border border-border bg-card p-5 transition-transform hover:-translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-primary">
                  {getSocialIcon(link.platform)}
                </div>
                <div className="mt-6 flex items-center justify-between gap-4">
                  <h2 className="font-heading text-2xl font-semibold">{link.label}</h2>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
                <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground">
                  Ouvrir la page {link.label} de Wearevents.
                </p>
              </a>
            ))}
          </div>
        </section>
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

export default Socials;
