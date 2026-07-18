import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { fetchSeoMetadataByPath, isSeoMetadataConfigured, normalizeSeoPath } from "@/lib/seo-metadata";

const siteUrl = (import.meta.env.VITE_SITE_URL || "https://www.wearevents.fr").replace(/\/$/, "");
const defaultTitle = "Wearevents | Location de salle pour votre événement";
const defaultDescription =
  "Découvrez des lieux événementiels vérifiés, comparez les options et envoyez une demande de disponibilité gratuite en quelques clics.";
const defaultImage = `${siteUrl}/og-image.svg`;

type SeoProps = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
  keywords?: string | string[];
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
};

const upsertMeta = (selector: string, attributes: Record<string, string>) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
};

const upsertLink = (rel: string, href: string) => {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.appendChild(element);
  }

  element.href = href;
};

const absoluteUrl = (value: string) => {
  if (value.startsWith("http")) return value;
  return `${siteUrl}${value.startsWith("/") ? value : `/${value}`}`;
};

const Seo = ({
  title = defaultTitle,
  description = defaultDescription,
  path,
  image = defaultImage,
  type = "website",
  noindex = false,
  jsonLd,
  keywords,
}: SeoProps) => {
  const location = useLocation();
  const canonical = absoluteUrl(path || `${location.pathname}${location.search}`);
  const metadataPath = normalizeSeoPath(path || location.pathname);
  const { data: seoMetadata } = useQuery({
    queryKey: ["seo-metadata", metadataPath],
    queryFn: () => fetchSeoMetadataByPath(metadataPath),
    enabled: !noindex && isSeoMetadataConfigured,
    staleTime: 5 * 60 * 1000,
  });
  const appliedTitle = seoMetadata?.title?.trim() || title;
  const appliedDescription = seoMetadata?.description?.trim() || description;
  const imageUrl = absoluteUrl(image);
  const keywordsContent = Array.isArray(keywords) ? keywords.filter(Boolean).join(", ") : keywords?.trim() ?? "";

  useEffect(() => {
    document.title = appliedTitle;

    upsertMeta('meta[name="description"]', { name: "description", content: appliedDescription });
    if (keywordsContent) {
      upsertMeta('meta[name="keywords"]', { name: "keywords", content: keywordsContent });
    } else {
      document.head.querySelector('meta[name="keywords"]')?.remove();
    }
    upsertMeta('meta[name="robots"]', { name: "robots", content: noindex ? "noindex, nofollow" : "index, follow" });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: type });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: appliedTitle });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: appliedDescription });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: imageUrl });
    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: "Wearevents" });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: appliedTitle });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: appliedDescription });
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: imageUrl });
    upsertLink("canonical", canonical);

    const scriptId = "wearevents-jsonld";
    document.getElementById(scriptId)?.remove();

    if (jsonLd) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [appliedDescription, appliedTitle, canonical, imageUrl, jsonLd, keywordsContent, noindex, type]);

  return null;
};

export { defaultDescription, defaultImage, defaultTitle, siteUrl };
export default Seo;
