import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileSwipeHome from "@/components/MobileSwipeHome";
import DesktopHome from "@/components/DesktopHome";
import VenueCodeSearch from "@/components/VenueCodeSearch";

const Index = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileSwipeHome />;
  }

  return <DesktopHome />;
};

export default Index;
