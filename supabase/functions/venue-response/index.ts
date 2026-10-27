import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const responseLabels = {
  available: "Disponible",
  unavailable: "Pas disponible",
  conditions: "Conditions envoyées",
} as const;

type ResponseChoice = keyof typeof responseLabels;

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
});

const escapeHtml = (value: string) => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

const getSecretKey = () => {
  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretKeys) {
    const parsed = JSON.parse(secretKeys) as Record<string, string>;
    if (parsed.default) return parsed.default;
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
};

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const sendNotification = async (
  booking: Record<string, unknown>,
  choice: ResponseChoice,
  reason: string,
  conditions: string,
) => {
  const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
  const from = Deno.env.get("BOOKING_EMAIL_FROM") || "";
  if (!resendApiKey || !from) throw new Error("Resend is not configured");

  const venueTitle = String(booking.venue_title || "Lieu partenaire");
  const requestId = String(booking.id || "");
  const details = [
    ["Référence", requestId],
    ["Lieu", venueTitle],
    ["Réponse", responseLabels[choice]],
    ["Motif", reason],
    ["Conditions", conditions],
    ["Date", String(booking.desired_date || "")],
    ["Horaires", [booking.start_time, booking.end_time].filter(Boolean).join(" – ")],
    ["Format", String(booking.event_type || "")],
    ["Invités", booking.guest_count ? `${booking.guest_count} pers.` : ""],
    ["Budget", String(booking.budget_range || "")],
    ["Espace", Array.isArray(booking.requested_spaces) ? booking.requested_spaces.join(", ") : ""],
  ].filter(([, value]) => value);
  const text = details.map(([label, value]) => `${label} : ${value}`).join("\n");
  const rows = details.map(([label, value]) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;font-weight:700;vertical-align:top;">${escapeHtml(String(label))}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;">${escapeHtml(String(value))}</td>
    </tr>`).join("");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `wearevents-venue-response-${requestId}-${choice}`,
    },
    body: JSON.stringify({
      from,
      to: ["reservation@wearevents.fr"],
      subject: `Réponse lieu – ${venueTitle} – ${responseLabels[choice]} – ${requestId}`,
      text,
      html: `<!doctype html><html lang="fr"><body style="margin:0;background:#f7f3f0;padding:28px;font-family:Arial,sans-serif;color:#171717;"><main style="max-width:640px;margin:auto;background:#fff;border-radius:18px;overflow:hidden;"><header style="background:#171717;color:#fff;padding:28px;"><p style="margin:0 0 8px;color:#e66b84;font-weight:700;">Réponse partenaire</p><h1 style="margin:0;font-family:Georgia,serif;">${escapeHtml(venueTitle)}</h1></header><section style="padding:28px;"><table role="presentation" style="width:100%;border-collapse:collapse;">${rows}</table><p style="margin:24px 0 0;"><a href="https://www.wearevents.fr/admin" style="display:inline-block;background:#d94f6d;color:#fff;padding:13px 18px;border-radius:10px;text-decoration:none;font-weight:700;">Ouvrir le back-office</a></p></section></main></body></html>`,
    }),
  });

  if (!response.ok) throw new Error((await response.text()) || `Resend error ${response.status}`);
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const secretKey = getSecretKey();
  if (!supabaseUrl || !secretKey) return jsonResponse({ error: "Server configuration is incomplete" }, 500);

  try {
    const payload = await request.json() as { token?: string; response?: string; reason?: string; conditions?: string };
    const token = String(payload.token || "").trim();
    const choice = String(payload.response || "") as ResponseChoice;
    const reason = String(payload.reason || "").trim().slice(0, 250);
    const conditions = String(payload.conditions || "").trim().slice(0, 3000);

    if (!isUuid(token) || !(choice in responseLabels)) return jsonResponse({ error: "Invalid response link" }, 400);
    if (choice === "conditions" && !conditions) return jsonResponse({ error: "Conditions are required" }, 400);

    const supabase = createClient(supabaseUrl, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: booking, error: findError } = await supabase
      .from("booking_requests")
      .select("id,venue_title,desired_date,start_time,end_time,event_type,guest_count,budget_range,requested_spaces")
      .eq("venue_response_token", token)
      .maybeSingle();

    if (findError) throw findError;
    if (!booking) return jsonResponse({ error: "Response link not found" }, 404);

    const venueResponseStatus = choice === "conditions" ? "conditions_sent" : choice;
    const respondedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("booking_requests")
      .update({
        venue_response_status: venueResponseStatus,
        venue_response_at: respondedAt,
        venue_response_reason: choice === "unavailable" ? reason || null : null,
        venue_response_conditions: conditions || null,
        venue_response_reminder_due_at: null,
        venue_response_reminder_last_error: null,
      })
      .eq("id", booking.id)
      .eq("venue_response_token", token);

    if (updateError) throw updateError;

    let notificationSent = true;
    try {
      await sendNotification(booking, choice, reason, conditions);
    } catch (notificationError) {
      notificationSent = false;
      console.error("Venue response notification failed", notificationError);
    }

    return jsonResponse({ ok: true, status: venueResponseStatus, respondedAt, notificationSent });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown venue response error";
    return jsonResponse({ error: message }, 500);
  }
});
