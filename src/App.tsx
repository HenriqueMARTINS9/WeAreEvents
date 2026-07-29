import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import EstablishmentReferralModalProvider from "@/components/EstablishmentReferralModalProvider";
import FloatingWhatsAppButton from "@/components/FloatingWhatsAppButton";
import GoogleTagTracker from "@/components/GoogleTagTracker";
import Index from "./pages/Index.tsx";

const VenueDetail = lazy(() => import("./pages/VenueDetail.tsx"));
const SearchResults = lazy(() => import("./pages/SearchResults.tsx"));
const Blog = lazy(() => import("./pages/Blog.tsx"));
const BlogDetail = lazy(() => import("./pages/BlogDetail.tsx"));
const Faq = lazy(() => import("./pages/Faq.tsx"));
const Socials = lazy(() => import("./pages/Socials.tsx"));
const SeoIndex = lazy(() => import("./pages/SeoIndex.tsx"));
const SeoLanding = lazy(() => import("./pages/SeoLanding.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const Legal = lazy(() => import("./pages/Legal.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <EstablishmentReferralModalProvider>
          <Suspense fallback={<main className="min-h-screen bg-background" />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/salle/:slug" element={<VenueDetail />} />
              <Route path="/recherche" element={<SearchResults />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogDetail />} />
              <Route path="/faq" element={<Faq />} />
              <Route path="/reseaux-sociaux" element={<Socials />} />
              <Route path="/inspirations" element={<SeoIndex />} />
              <Route path="/mentions-legales" element={<Legal kind="mentions" />} />
              <Route path="/cgu" element={<Legal kind="cgu" />} />
              <Route path="/politique-confidentialite" element={<Legal kind="privacy" />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/:seoSlug" element={<SeoLanding />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <FloatingWhatsAppButton />
          <GoogleTagTracker />
        </EstablishmentReferralModalProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
