import { lazy, Suspense } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import Seo, { defaultDescription, siteUrl } from "@/components/Seo";

const MobileSwipeHome = lazy(() => import("@/components/MobileSwipeHome"));
const DesktopHome = lazy(() => import("@/components/DesktopHome"));

const Index = () => {
  const isMobile = useIsMobile();
  const seo = (
    <Seo
      title="Wearevents | Location de salle pour votre événement"
      description={defaultDescription}
      path="/"
      jsonLd={[
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Wearevents",
          alternateName: "Wearevents",
          url: siteUrl,
          logo: `${siteUrl}/favicon.png`,
          email: "contact@wearevents.fr",
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Wearevents",
          alternateName: "Wearevents",
          url: siteUrl,
          potentialAction: {
            "@type": "SearchAction",
            target: `${siteUrl}/recherche?location={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        },
      ]}
    />
  );

  if (isMobile) {
    return (
      <>
        {seo}
        <Suspense fallback={<main className="min-h-screen bg-foreground" />}>
          <MobileSwipeHome />
        </Suspense>
      </>
    );
  }

  return (
    <>
      {seo}
      <Suspense fallback={<main className="min-h-screen bg-background" />}>
        <DesktopHome />
      </Suspense>
    </>
  );
};

export default Index;
