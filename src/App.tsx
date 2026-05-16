import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import EstablishmentReferralModalProvider from "@/components/EstablishmentReferralModalProvider";
import FloatingWhatsAppButton from "@/components/FloatingWhatsAppButton";
import Index from "./pages/Index.tsx";
import VenueDetail from "./pages/VenueDetail.tsx";
import SearchResults from "./pages/SearchResults.tsx";
import Blog from "./pages/Blog.tsx";
import BlogDetail from "./pages/BlogDetail.tsx";
import Admin from "./pages/Admin.tsx";
import Legal from "./pages/Legal.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <EstablishmentReferralModalProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/salle/:slug" element={<VenueDetail />} />
            <Route path="/recherche" element={<SearchResults />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/mentions-legales" element={<Legal kind="mentions" />} />
            <Route path="/cgu" element={<Legal kind="cgu" />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <FloatingWhatsAppButton />
        </EstablishmentReferralModalProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
