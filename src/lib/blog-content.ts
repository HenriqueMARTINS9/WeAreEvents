const allowedTags = new Set([
  "A",
  "BLOCKQUOTE",
  "BR",
  "EM",
  "H1",
  "H2",
  "H3",
  "I",
  "LI",
  "OL",
  "P",
  "STRONG",
  "UL",
]);

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const renderPlainTextBlock = (block: string) => {
  if (block.startsWith("### ")) return `<h3>${escapeHtml(block.replace(/^###\s+/, ""))}</h3>`;
  if (block.startsWith("## ")) return `<h2>${escapeHtml(block.replace(/^##\s+/, ""))}</h2>`;
  if (block.startsWith("# ")) return `<h1>${escapeHtml(block.replace(/^#\s+/, ""))}</h1>`;

  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length && lines.every((line) => line.startsWith("- "))) {
    return `<ul>${lines.map((line) => `<li>${escapeHtml(line.replace(/^-\s+/, ""))}</li>`).join("")}</ul>`;
  }

  return `<p>${lines.map(escapeHtml).join("<br>")}</p>`;
};

export const looksLikeHtml = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);

export const plainTextToBlogHtml = (value: string) =>
  value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(renderPlainTextBlock)
    .join("");

export const sanitizeBlogHtml = (value: string) => {
  const html = looksLikeHtml(value) ? value : plainTextToBlogHtml(value);
  if (typeof DOMParser === "undefined") return html;

  const documentNode = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const container = documentNode.body.firstElementChild;
  if (!container) return "";

  Array.from(container.querySelectorAll("*")).forEach((element) => {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    Array.from(element.attributes).forEach((attribute) => {
      if (element.tagName !== "A" || attribute.name !== "href") {
        element.removeAttribute(attribute.name);
      }
    });

    if (element.tagName === "A") {
      const href = element.getAttribute("href")?.trim() ?? "";
      const isAllowedHref = /^(https?:|mailto:|tel:|\/|#)/i.test(href);

      if (!isAllowedHref) {
        element.removeAttribute("href");
      } else {
        element.setAttribute("rel", "noopener noreferrer");
        if (/^https?:/i.test(href)) element.setAttribute("target", "_blank");
      }
    }
  });

  return container.innerHTML;
};

export const prepareBlogContentForEditor = (value: string) =>
  sanitizeBlogHtml(value);
