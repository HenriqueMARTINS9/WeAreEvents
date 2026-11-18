import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Internal React navigation does not pass through Vercel. Reload aliases through
// HTTP so the server sends the same 301 as for an incoming Google result.
export function useContentRedirect(kind: "salle" | "blog", slug: string | undefined) {
  const { search, hash } = useLocation();
  const source = `/${kind}/${slug}`;
  const { data: target, isLoading } = useQuery({
    queryKey: ["content-redirect", source],
    enabled: Boolean(supabase && slug),
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase!.from("redirects").select("target_path").eq("source_path", source).maybeSingle();
      if (error) throw error;
      return data?.target_path && /^\/(salle|blog)\/[^/?#\s]+$/.test(data.target_path) && data.target_path !== source ? data.target_path : null;
    },
  });
  useEffect(() => {
    if (target) window.location.replace(`${source}${search}${hash}`);
  }, [target, source, search, hash]);
  return Boolean(supabase && slug && (isLoading || target));
}
