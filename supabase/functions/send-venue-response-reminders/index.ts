import { createClient } from "npm:@supabase/supabase-js@2";

type ReminderBooking = {
  id: string;
  venue_title: string;
  desired_date: string | null;
  guest_count: number | null;
  event_type: string;
  venue_response_token: string;
  venues: { contact_email?: string } | Array<{ contact_email?: string }> | null;
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });

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

const getVenueEmail = (booking: ReminderBooking) => {
  const venue = Array.isArray(booking.venues) ? booking.venues[0] : booking.venues;
  return String(venue?.contact_email || "").trim();
};

const responseUrl = (token: string, response: string) => {
  const siteUrl = (Deno.env.get("PUBLIC_SITE_URL") || "https://www.wearevents.fr").replace(/\/$/, "");
  return `${siteUrl}/reponse-lieu?${new URLSearchParams({ token, response }).toString()}`;
};

const sendReminder = async (booking: ReminderBooking, to: string) => {
  const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
  const from = Deno.env.get("BOOKING_EMAIL_FROM") || "";
  if (!resendApiKey || !from) throw new Error("Resend is not configured");

  const availableUrl = responseUrl(booking.venue_response_token, "available");
  const unavailableUrl = responseUrl(booking.venue_response_token, "unavailable");
  const conditionsUrl = responseUrl(booking.venue_response_token, "conditions");
  const summary = `${booking.event_type || "Événement"} · ${booking.guest_count || "-"} pers. · ${booking.desired_date || "Date à confirmer"}`;
  const button = (label: string, url: string, color: string) =>
    `<a href="${escapeHtml(url)}" style="display:inline-block;margin:0 8px 10px 0;background:${color};color:#fff;padding:13px 16px;border-radius:10px;text-decoration:none;font-weight:700;">${label}</a>`;
  const text = `Bonjour,\n\nNous attendons encore votre réponse concernant la demande ${booking.id} pour ${booking.venue_title}.\n${summary}\n\nDisponible : ${availableUrl}\nPas disponible : ${unavailableUrl}\nRépondre avec mes conditions : ${conditionsUrl}\n\nMerci de nous répondre rapidement.\n\nAnselme – Wearevents – reservations@wearevents.fr`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `wearevents-venue-reminder-${booking.id}`,
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: "reservations@wearevents.fr",
      subject: `Rappel – réponse attendue pour ${booking.venue_title} – ${booking.id}`,
      text,
      html: `<!doctype html><html lang="fr"><body style="margin:0;background:#f7f3f0;padding:28px;font-family:Arial,sans-serif;color:#171717;"><main style="max-width:640px;margin:auto;background:#fff;border-radius:18px;padding:30px;"><p style="color:#d94f6d;font-weight:700;">Rappel partenaire</p><h1 style="font-family:Georgia,serif;">Votre réponse est attendue</h1><p>Bonjour,</p><p>Nous attendons encore votre réponse concernant la demande <strong>${escapeHtml(booking.id)}</strong> pour <strong>${escapeHtml(booking.venue_title)}</strong>.</p><p>${escapeHtml(summary)}</p><p>Merci de nous répondre rapidement, le client attend notre proposition.</p><div style="margin-top:24px;">${button("Disponible", availableUrl, "#237a57")}${button("Pas disponible", unavailableUrl, "#4b4b4b")}${button("Mes conditions", conditionsUrl, "#d94f6d")}</div><p style="margin-top:22px;">Anselme – Wearevents – reservations@wearevents.fr</p></main></body></html>`,
    }),
  });

  if (!response.ok) throw new Error((await response.text()) || `Resend error ${response.status}`);
};

Deno.serve(async (request) => {
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
  const cronSecret = Deno.env.get("REVIEW_CRON_SECRET") || Deno.env.get("REVIEWCRON_SECRET") || "";
  if (!cronSecret) return jsonResponse({ error: "REVIEW_CRON_SECRET is not configured" }, 500);
  if (request.headers.get("x-review-cron-secret") !== cronSecret) return jsonResponse({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const secretKey = getSecretKey();
  if (!supabaseUrl || !secretKey) return jsonResponse({ error: "Supabase secrets are missing" }, 500);

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("booking_requests")
    .select("id,venue_title,desired_date,guest_count,event_type,venue_response_token,venues(contact_email)")
    .eq("venue_response_status", "waiting")
    .is("venue_response_reminder_sent_at", null)
    .not("venue_response_token", "is", null)
    .lte("venue_response_reminder_due_at", now)
    .limit(50);

  if (error) return jsonResponse({ error: error.message }, 500);

  let sent = 0;
  let failed = 0;
  for (const booking of (data || []) as ReminderBooking[]) {
    const venueEmail = getVenueEmail(booking);
    if (!venueEmail) {
      failed += 1;
      await supabase.from("booking_requests").update({
        venue_response_reminder_due_at: null,
        venue_response_reminder_last_error: "Venue contact email is missing",
      }).eq("id", booking.id);
      continue;
    }

    try {
      await sendReminder(booking, venueEmail);
      sent += 1;
      await supabase.from("booking_requests").update({
        venue_response_reminder_sent_at: new Date().toISOString(),
        venue_response_reminder_last_error: null,
      }).eq("id", booking.id);
    } catch (sendError) {
      failed += 1;
      const message = sendError instanceof Error ? sendError.message : "Unknown reminder error";
      await supabase.from("booking_requests").update({
        venue_response_reminder_due_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        venue_response_reminder_last_error: message.slice(0, 1000),
      }).eq("id", booking.id);
    }
  }

  return jsonResponse({ ok: true, processed: data?.length || 0, sent, failed });
});
