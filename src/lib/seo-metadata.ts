const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishable = import.meta.env.VITE_SUPABASE_PUBLISHABLE || import.meta.env.VITE_SUPABASE_ANON_KEY;

export type SeoMetadata = {
  pagePath: string;
  title: string;
  description: string;
};

export const isSeoMetadataConfigured = Boolean(supabaseUrl && supabasePublishable);

export const normalizeSeoPath = (value = "/") => {
  const path = String(value || "/").split(/[?#]/)[0] || "/";
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  return withSlash === "/" ? "/" : withSlash.replace(/\/+$/, "");
};

export const fetchSeoMetadataByPath = async (path: string): Promise<SeoMetadata | null> => {
  if (!isSeoMetadataConfigured) return null;

  const url = new URL(`${String(supabaseUrl).replace(/\/$/, "")}/rest/v1/seo_metadata`);
  url.searchParams.set("select", "page_path,title,description");
  url.searchParams.set("page_path", `eq.${normalizeSeoPath(path)}`);
  url.searchParams.set("active", "eq.true");
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), {
    headers: {
      apikey: supabasePublishable,
      authorization: `Bearer ${supabasePublishable}`,
      accept: "application/json",
    },
  });

  if (!response.ok) throw new Error(`Impossible de charger les métadonnées SEO (${response.status}).`);

  const [row] = (await response.json()) as Array<{ page_path: string; title: string; description: string }>;
  if (!row) return null;

  return {
    pagePath: row.page_path,
    title: row.title,
    description: row.description,
  };
};
