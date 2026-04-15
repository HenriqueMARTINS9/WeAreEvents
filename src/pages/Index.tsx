import { useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "react-router-dom";
import MobileSwipeHome from "@/components/MobileSwipeHome";
import DesktopHome from "@/components/DesktopHome";

const Index = () => {
  const isMobile = useIsMobile();
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;

    const targetId = location.hash.slice(1);
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, isMobile]);

  if (isMobile) {
    return <MobileSwipeHome />;
  }

  return <DesktopHome />;
};

export default Index;
