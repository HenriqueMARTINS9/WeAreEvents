const allowedTags = new Set([
  "A",
  "B",
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

const renderInlineFormatting = (value: string) =>
  escapeHtml(value)
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:|tel:)[^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=$|[\s).,!?])/g, "$1<em>$2</em>")
    .replace(/(^|[\s(])_([^_\n]+)_(?=$|[\s).,!?])/g, "$1<em>$2</em>");

const renderPlainTextBlock = (block: string) => {
  if (block.startsWith("### ")) return `<h3>${renderInlineFormatting(block.replace(/^###\s+/, ""))}</h3>`;
  if (block.startsWith("## ")) return `<h2>${renderInlineFormatting(block.replace(/^##\s+/, ""))}</h2>`;
  if (block.startsWith("# ")) return `<h1>${renderInlineFormatting(block.replace(/^#\s+/, ""))}</h1>`;

  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length && lines.every((line) => /^[-*•]\s+/.test(line))) {
    return `<ul>${lines.map((line) => `<li>${renderInlineFormatting(line.replace(/^[-*•]\s+/, ""))}</li>`).join("")}</ul>`;
  }

  if (lines.length && lines.every((line) => /^\d+[.)]\s+/.test(line))) {
    return `<ol>${lines.map((line) => `<li>${renderInlineFormatting(line.replace(/^\d+[.)]\s+/, ""))}</li>`).join("")}</ol>`;
  }

  if (lines.length && lines.every((line) => line.startsWith("> "))) {
    return `<blockquote>${lines.map((line) => renderInlineFormatting(line.replace(/^>\s+/, ""))).join("<br>")}</blockquote>`;
  }

  return `<p>${lines.map(renderInlineFormatting).join("<br>")}</p>`;
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

    if (element.tagName === "B") {
      const strong = documentNode.createElement("strong");
      strong.append(...Array.from(element.childNodes));
      element.replaceWith(strong);
    }

    if (element.tagName === "I") {
      const emphasis = documentNode.createElement("em");
      emphasis.append(...Array.from(element.childNodes));
      element.replaceWith(emphasis);
    }
  });

  return container.innerHTML;
};

export const prepareBlogContentForEditor = (value: string) =>
  sanitizeBlogHtml(value);
