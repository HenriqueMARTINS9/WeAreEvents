import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export function useVenuePageView(slug: string | undefined) {
  const { key } = useLocation();
  const recordedDisplay = useRef<string>();

  useEffect(() => {
    if (!supabase || !slug) return;
    const display = `${key}:${slug}`;
    if (recordedDisplay.current === display) return;
    recordedDisplay.current = display;
    void supabase.rpc("record_venue_page_view", { p_slug: slug, p_view_id: crypto.randomUUID() })
      .then(({ error }) => {
        if (error) console.warn("Impossible d'enregistrer la vue de la fiche.");
      }, () => console.warn("Impossible d'enregistrer la vue de la fiche."));
  }, [key, slug]);
}
