import { useIsMobile } from "@/hooks/use-mobile";
import MobileSwipeHome from "@/components/MobileSwipeHome";
import DesktopHome from "@/components/DesktopHome";
import Seo, { defaultDescription, siteUrl } from "@/components/Seo";

const Index = () => {
  const isMobile = useIsMobile();
  const seo = (
    <Seo
      title="wearevents - Le lieu idéal pour votre événement"
      description={defaultDescription}
      path="/"
      jsonLd={[
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "wearevents",
          url: siteUrl,
          logo: `${siteUrl}/favicon.png`,
          email: "contact@wearevents.fr",
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "wearevents",
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
        <MobileSwipeHome />
      </>
    );
  }

  return (
    <>
      {seo}
      <DesktopHome />
    </>
  );
};

export default Index;
