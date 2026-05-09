const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type EmailTemplate = {
  to: string;
  subject: string;
  preview?: string;
  text: string;
};

type BookingEmailPayload = {
  request?: {
    id?: string;
    email?: string;
  };
  emails?: {
    customerConfirmation?: EmailTemplate;
    adminNotification?: EmailTemplate;
    venueContactNotification?: EmailTemplate;
  };
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

const isValidEmailTemplate = (template: unknown): template is EmailTemplate => {
  if (!template || typeof template !== "object") return false;
  const candidate = template as Partial<EmailTemplate>;

  return Boolean(candidate.to && candidate.subject && candidate.text);
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const textToHtml = (text: string) =>
  `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.65;color:#171717;white-space:pre-wrap;">${escapeHtml(text)}</div>`;

const sendEmail = async (template: EmailTemplate, from: string, replyTo?: string) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [template.to],
      subject: template.subject,
      text: template.text,
      html: textToHtml(template.text),
      reply_to: replyTo,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Resend error ${response.status}`);
  }

  return response.json();
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("BOOKING_EMAIL_FROM");

  if (!resendApiKey || !from) {
    return jsonResponse(
      {
        error: "Email provider is not configured. Set RESEND_API_KEY and BOOKING_EMAIL_FROM in Supabase secrets.",
      },
      500,
    );
  }

  try {
    const payload = (await request.json()) as BookingEmailPayload;
    const templates = payload.emails;

    if (
      !templates ||
      !isValidEmailTemplate(templates.customerConfirmation) ||
      !isValidEmailTemplate(templates.adminNotification) ||
      !isValidEmailTemplate(templates.venueContactNotification)
    ) {
      return jsonResponse({ error: "Invalid booking email payload" }, 400);
    }

    const customerEmail = payload.request?.email;
    const [customerConfirmation, adminNotification, venueContactNotification] = await Promise.all([
      sendEmail(templates.customerConfirmation, from),
      sendEmail(templates.adminNotification, from, customerEmail),
      sendEmail(templates.venueContactNotification, from, customerEmail),
    ]);

    return jsonResponse({
      ok: true,
      requestId: payload.request?.id,
      emails: {
        customerConfirmation,
        adminNotification,
        venueContactNotification,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email error";
    return jsonResponse({ error: message }, 500);
  }
});
