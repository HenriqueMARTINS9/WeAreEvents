import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import EstablishmentReferralModalProvider from "@/components/EstablishmentReferralModalProvider";
import Index from "./pages/Index.tsx";
import VenueDetail from "./pages/VenueDetail.tsx";
import SearchResults from "./pages/SearchResults.tsx";
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </EstablishmentReferralModalProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
