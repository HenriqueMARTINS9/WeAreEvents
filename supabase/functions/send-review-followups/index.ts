import { createClient } from "npm:@supabase/supabase-js@2";

type BookingFollowUp = {
  id: string;
  venue_id: string | null;
  venue_title: string;
  first_name: string;
  email: string;
  desired_date: string | null;
  review_token: string;
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

const escapeHtml = (value: string) =>
  value
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

const buildEmailHtml = (booking: BookingFollowUp, reviewUrl: string, googleReviewUrl: string) => {
  const siteUrl = (Deno.env.get("PUBLIC_SITE_URL") || "https://www.wearevents.fr").replace(/\/$/, "");

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Votre avis après ${escapeHtml(booking.venue_title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#F7F3F0;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Votre retour aidera les prochains organisateurs à choisir leur lieu.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#F7F3F0;padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:100%;max-width:640px;">
          <tr><td style="padding:0 0 18px;">
            <img src="${siteUrl}/favicon.png" width="44" height="44" alt="Wearevents" style="display:inline-block;border:0;border-radius:14px;vertical-align:middle;">
            <span style="display:inline-block;margin-left:12px;font-family:Arial,sans-serif;font-size:21px;font-weight:700;color:#171717;vertical-align:middle;">Wearevents</span>
          </td></tr>
          <tr><td style="border-radius:22px 22px 0 0;background:#171717;padding:34px;">
            <div style="display:inline-block;margin-bottom:18px;border-radius:999px;background:#D94F6D;padding:8px 12px;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#FFFFFF;">Votre expérience</div>
            <h1 style="margin:0 0 14px;font-family:Georgia,serif;font-size:36px;line-height:1.08;font-weight:600;color:#FFFFFF;">Comment s'est passé votre événement ?</h1>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:16px;line-height:1.65;color:#D7D0CB;">Quelques lignes sur ${escapeHtml(booking.venue_title)} aideront les prochains organisateurs.</p>
          </td></tr>
          <tr><td style="border-radius:0 0 22px 22px;background:#FFFFFF;border:1px solid #EFE8E4;border-top:0;padding:32px;">
            <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#4B4B4B;">Bonjour ${escapeHtml(booking.first_name)},</p>
            <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#4B4B4B;">Nous espérons que votre événement chez <strong style="color:#171717;">${escapeHtml(booking.venue_title)}</strong> s'est parfaitement déroulé. Votre avis sera affiché sur la fiche du lieu avec votre prénom et l'initiale de votre nom.</p>
            <table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="border-radius:12px;background:#D94F6D;">
              <a href="${escapeHtml(reviewUrl)}" style="display:inline-block;padding:15px 20px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#FFFFFF;text-decoration:none;">Donner mon avis sur le lieu</a>
            </td></tr></table>
            <p style="margin:26px 0 8px;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#4B4B4B;">Votre retour sur l'accompagnement Wearevents nous est également précieux.</p>
            <a href="${escapeHtml(googleReviewUrl)}" style="font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#171717;text-decoration:underline;">Laisser un avis Google à Wearevents</a>
          </td></tr>
          <tr><td style="padding:22px 8px 0;text-align:center;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#8B817B;">Merci pour votre confiance.<br>L'équipe Wearevents</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
};

const sendReviewEmail = async (booking: BookingFollowUp) => {
  const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
  const from = Deno.env.get("BOOKING_EMAIL_FROM") || "";
  const siteUrl = (Deno.env.get("PUBLIC_SITE_URL") || "https://www.wearevents.fr").replace(/\/$/, "");
  const reviewUrl = `${siteUrl}/avis?token=${encodeURIComponent(booking.review_token)}`;
  const googleReviewUrl = "https://g.page/r/Cb3yTIoVykRuEBM/review";
  const subject = `Votre avis après ${booking.venue_title}`;
  const text = `Bonjour ${booking.first_name},\n\nNous espérons que votre événement chez ${booking.venue_title} s'est parfaitement déroulé.\n\nDonner votre avis sur le lieu : ${reviewUrl}\n\nLaisser un avis Google à Wearevents : ${googleReviewUrl}\n\nMerci pour votre confiance,\nL'équipe Wearevents`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `wearevents-review-${booking.id}`,
    },
    body: JSON.stringify({
      from,
      to: [booking.email],
      subject,
      text,
      html: buildEmailHtml(booking, reviewUrl, googleReviewUrl),
    }),
  });

  if (!response.ok) {
    throw new Error((await response.text()) || `Resend error ${response.status}`);
  }
};

Deno.serve(async (request) => {
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const cronSecret = Deno.env.get("REVIEW_CRON_SECRET") || "";
  if (!cronSecret) return jsonResponse({ error: "REVIEW_CRON_SECRET is not configured" }, 500);
  if (request.headers.get("x-review-cron-secret") !== cronSecret) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const secretKey = getSecretKey();
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("BOOKING_EMAIL_FROM");

  if (!supabaseUrl || !secretKey || !resendApiKey || !from) {
    return jsonResponse({ error: "Supabase or Resend secrets are missing" }, 500);
  }

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.rpc("claim_due_review_followups", { batch_size: 50 });

  if (error) return jsonResponse({ error: error.message }, 500);

  const bookings = (data || []) as BookingFollowUp[];
  let sent = 0;
  let failed = 0;

  for (const booking of bookings) {
    if (!booking.venue_id || !booking.email || !booking.review_token) {
      failed += 1;
      await supabase.from("booking_requests").update({
        review_email_scheduled_at: null,
        review_email_last_error: "Missing venue, email or review token",
      }).eq("id", booking.id);
      continue;
    }

    try {
      await sendReviewEmail(booking);
      sent += 1;
      await supabase.from("booking_requests").update({
        review_email_sent_at: new Date().toISOString(),
        review_email_last_error: null,
      }).eq("id", booking.id);
    } catch (sendError) {
      failed += 1;
      const message = sendError instanceof Error ? sendError.message : "Unknown Resend error";
      await supabase.from("booking_requests").update({
        review_email_scheduled_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        review_email_last_error: message.slice(0, 1000),
      }).eq("id", booking.id);
    }
  }

  return jsonResponse({ ok: true, claimed: bookings.length, sent, failed });
});
