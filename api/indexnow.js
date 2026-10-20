import { createClient } from "@supabase/supabase-js";

const siteUrl = (process.env.VITE_SITE_URL || process.env.PUBLIC_SITE_URL || "https://www.wearevents.fr").replace(/\/$/, "");
const siteHost = new URL(siteUrl).host;
const indexNowKey = "c40a1b9225b3130c285573a5e30086d2";
const indexNowEndpoint = "https://api.indexnow.org/indexnow";
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabasePublishable = process.env.VITE_SUPABASE_PUBLISHABLE || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const json = (response, status, body) => response.status(status).json(body);

const normalizeSubmittedUrl = (value) => {
  try {
    const url = new URL(String(value || ""), siteUrl);
    if (url.origin !== new URL(siteUrl).origin) return null;
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
};

const authenticateAdmin = async (request) => {
  if (!supabaseUrl || !supabasePublishable) return false;
  const token = String(request.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;

  const authClient = createClient(supabaseUrl, supabasePublishable, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await authClient.auth.getUser(token);
  return Boolean(data.user && !error);
};

export default async function handler(request, response) {
  if (request.method !== "POST") return json(response, 405, { error: "Method not allowed" });
  if (!(await authenticateAdmin(request))) return json(response, 401, { error: "Session Supabase invalide." });

  const submittedUrls = Array.isArray(request.body?.urls) ? request.body.urls : [];
  const urlList = Array.from(new Set(submittedUrls.map(normalizeSubmittedUrl).filter(Boolean))).slice(0, 100);
  if (!urlList.length) return json(response, 400, { error: "Aucune URL Wearevents valide à notifier." });

  const indexNowResponse = await fetch(indexNowEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: siteHost,
      key: indexNowKey,
      keyLocation: `${siteUrl}/${indexNowKey}.txt`,
      urlList,
    }),
    signal: AbortSignal.timeout(8_000),
  });

  if (!indexNowResponse.ok) {
    const details = await indexNowResponse.text().catch(() => "");
    return json(response, 502, {
      error: `IndexNow a répondu ${indexNowResponse.status}.`,
      details: details.slice(0, 500),
    });
  }

  response.setHeader("Cache-Control", "no-store");
  return json(response, 200, { notified: urlList, status: indexNowResponse.status });
}
