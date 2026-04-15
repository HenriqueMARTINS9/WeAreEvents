import { useIsMobile } from "@/hooks/use-mobile";
import MobileSwipeHome from "@/components/MobileSwipeHome";
import DesktopHome from "@/components/DesktopHome";

const Index = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileSwipeHome />;
  }

  return <DesktopHome />;
};

export default Index;
