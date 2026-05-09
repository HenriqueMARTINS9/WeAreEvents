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
    venueTitle?: string;
    venueCity?: string;
    firstName?: string;
    lastName?: string;
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

type EmailKind = "customer" | "admin" | "venue";

const getPublicSiteUrl = () => (Deno.env.get("PUBLIC_SITE_URL") || "https://www.wearevents.fr").replace(/\/$/, "");

const getEmailTheme = (kind: EmailKind) => {
  if (kind === "admin") {
    return {
      eyebrow: "Nouvelle demande",
      title: "Une demande vient d'arriver",
      description: "Toutes les informations importantes sont regroupées ci-dessous pour qualifier rapidement le besoin.",
      accent: "#171717",
      buttonLabel: "Ouvrir le back office",
      buttonUrl: `${getPublicSiteUrl()}/admin`,
    };
  }

  if (kind === "venue") {
    return {
      eyebrow: "Demande qualifiée",
      title: "Un client souhaite privatiser votre espace",
      description: "Merci de confirmer la disponibilité et les conditions applicables afin que nous puissions accompagner le client.",
      accent: "#D94F6D",
      buttonLabel: "Voir wearevents",
      buttonUrl: getPublicSiteUrl(),
    };
  }

  return {
    eyebrow: "Demande confirmée",
    title: "Votre demande est entre de bonnes mains",
    description: "Notre équipe vérifie la disponibilité, les options et la cohérence du lieu avec votre événement.",
    accent: "#D94F6D",
    buttonLabel: "Découvrir d'autres lieux",
    buttonUrl: `${getPublicSiteUrl()}/recherche`,
  };
};

const splitEmailText = (text: string) => {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const rows: Array<{ label: string; value: string }> = [];
  const paragraphs: string[] = [];

  lines.forEach((line) => {
    const match = line.match(/^([^:]{2,48})\s:\s(.+)$/);

    if (match) {
      rows.push({ label: match[1], value: match[2] });
      return;
    }

    if (!["Récapitulatif", "Nouvelle demande de disponibilité"].includes(line)) {
      paragraphs.push(line);
    }
  });

  return { rows, paragraphs };
};

const renderParagraphs = (paragraphs: string[]) =>
  paragraphs
    .slice(0, 5)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#4B4B4B;">${escapeHtml(paragraph)}</p>`,
    )
    .join("");

const renderRows = (rows: Array<{ label: string; value: string }>) =>
  rows
    .map(
      (row) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #EFE8E4;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#8B817B;vertical-align:top;width:42%;">
            ${escapeHtml(row.label)}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #EFE8E4;font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#171717;vertical-align:top;">
            ${escapeHtml(row.value)}
          </td>
        </tr>`,
    )
    .join("");

const buildBrandedEmailHtml = (
  template: EmailTemplate,
  kind: EmailKind,
  requestId?: string,
) => {
  const siteUrl = getPublicSiteUrl();
  const logoUrl = `${siteUrl}/favicon.svg`;
  const theme = getEmailTheme(kind);
  const { rows, paragraphs } = splitEmailText(template.text);
  const preview = template.preview || theme.description;

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(template.subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#F7F3F0;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preview)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#F7F3F0;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:100%;max-width:640px;">
            <tr>
              <td style="padding:0 0 18px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <img src="${logoUrl}" width="44" height="44" alt="wearevents" style="display:inline-block;border:0;border-radius:14px;vertical-align:middle;">
                      <span style="display:inline-block;margin-left:12px;font-family:Arial,sans-serif;font-size:21px;font-weight:700;color:#171717;vertical-align:middle;">wearevents</span>
                    </td>
                    <td align="right" style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#8B817B;vertical-align:middle;">
                      ${requestId ? `Réf. ${escapeHtml(requestId)}` : ""}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="overflow:hidden;border-radius:24px;background:#171717;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding:34px 34px 30px;">
                      <div style="display:inline-block;margin-bottom:18px;border-radius:999px;background:${theme.accent};padding:8px 12px;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#FFFFFF;">
                        ${escapeHtml(theme.eyebrow)}
                      </div>
                      <h1 style="margin:0 0 14px;font-family:Georgia,serif;font-size:36px;line-height:1.05;font-weight:600;color:#FFFFFF;">
                        ${escapeHtml(theme.title)}
                      </h1>
                      <p style="margin:0;font-family:Arial,sans-serif;font-size:16px;line-height:1.65;color:#D7D0CB;">
                        ${escapeHtml(preview)}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 0 0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-radius:22px;background:#FFFFFF;border:1px solid #EFE8E4;">
                  <tr>
                    <td style="padding:30px;">
                      ${renderParagraphs(paragraphs)}

                      ${
                        rows.length
                          ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px;border-collapse:collapse;">
                              ${renderRows(rows)}
                            </table>`
                          : ""
                      }

                      <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:28px;">
                        <tr>
                          <td style="border-radius:12px;background:${theme.accent};">
                            <a href="${theme.buttonUrl}" style="display:inline-block;padding:14px 18px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#FFFFFF;text-decoration:none;">
                              ${escapeHtml(theme.buttonLabel)}
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:22px 8px 0;text-align:center;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#8B817B;">
                wearevents accompagne les organisateurs et les lieux événementiels avec des demandes qualifiées, simples et sans engagement.
                <br>
                <a href="${siteUrl}" style="color:#D94F6D;text-decoration:none;">${siteUrl.replace(/^https?:\/\//, "")}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

const sendEmail = async (template: EmailTemplate, from: string, kind: EmailKind, requestId?: string, replyTo?: string) => {
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
      html: buildBrandedEmailHtml(template, kind, requestId),
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
    const requestId = payload.request?.id;
    const [customerConfirmation, adminNotification, venueContactNotification] = await Promise.all([
      sendEmail(templates.customerConfirmation, from, "customer", requestId),
      sendEmail(templates.adminNotification, from, "admin", requestId, customerEmail),
      sendEmail(templates.venueContactNotification, from, "venue", requestId, customerEmail),
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
