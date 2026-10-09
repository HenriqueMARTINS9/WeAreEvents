const getSupabaseUrl = () => (
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ""
).replace(/\/$/, "");

const getSupabaseKey = () =>
  process.env.SUPABASE_ANON_KEY
  || process.env.VITE_SUPABASE_PUBLISHABLE
  || process.env.VITE_SUPABASE_ANON_KEY
  || "";

export default async function handler(request, response) {
  if (request.method !== "GET" && request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const cronSecret = process.env.CRON_SECRET || "";
  const reviewCronSecret = process.env.REVIEW_CRON_SECRET || "";
  const authorization = request.headers.authorization || "";

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    console.error("Review follow-up cron rejected: missing or invalid CRON_SECRET");
    return response.status(401).json({ error: "Unauthorized" });
  }

  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseKey();
  if (!supabaseUrl || !supabaseKey || !reviewCronSecret) {
    console.error("Review follow-up cron is missing Supabase or review secret configuration");
    return response.status(500).json({ error: "Review follow-up configuration is incomplete" });
  }

  try {
    const functionResponse = await fetch(`${supabaseUrl}/functions/v1/send-review-followups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "x-review-cron-secret": reviewCronSecret,
      },
      body: JSON.stringify({ source: "vercel-cron", triggered_at: new Date().toISOString() }),
    });
    const rawBody = await functionResponse.text();
    let result;

    try {
      result = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      result = { message: rawBody };
    }

    if (!functionResponse.ok) {
      console.error("Review follow-up function failed", functionResponse.status, result);
      return response.status(502).json({ error: "Review follow-up function failed", status: functionResponse.status, details: result });
    }

    console.info("Review follow-up cron completed", result);
    return response.status(200).json(result);
  } catch (error) {
    console.error("Review follow-up cron request failed", error);
    return response.status(502).json({ error: error instanceof Error ? error.message : "Review follow-up request failed" });
  }
}
