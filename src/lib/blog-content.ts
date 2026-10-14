const allowedTags = new Set([
  "A",
  "B",
  "BLOCKQUOTE",
  "BR",
  "EM",
  "FIGCAPTION",
  "FIGURE",
  "H1",
  "H2",
  "H3",
  "I",
  "IMG",
  "LI",
  "OL",
  "P",
  "STRONG",
  "UL",
]);

const allowedImageAttributes = new Set(["src", "alt", "width", "height", "loading"]);

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
      const isAllowedLinkAttribute = element.tagName === "A" && attribute.name === "href";
      const isAllowedImageAttribute = element.tagName === "IMG" && allowedImageAttributes.has(attribute.name);

      if (!isAllowedLinkAttribute && !isAllowedImageAttribute) {
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

    if (element.tagName === "IMG") {
      const src = element.getAttribute("src")?.trim() ?? "";
      if (!/^(https?:\/\/|\/(?!\/))/i.test(src)) {
        element.remove();
        return;
      }

      element.setAttribute("src", src);
      ["width", "height"].forEach((attribute) => {
        const rawValue = element.getAttribute(attribute)?.trim() ?? "";
        if (!/^\d{1,5}$/.test(rawValue) || Number(rawValue) <= 0) element.removeAttribute(attribute);
      });

      const loading = element.getAttribute("loading")?.toLowerCase();
      if (loading !== "lazy" && loading !== "eager") element.removeAttribute("loading");
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

export type BlogFaqItem = {
  question: string;
  answer: string;
};

const normalizeFaqHeading = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .trim()
  .toLowerCase();

export const extractBlogFaq = (value: string): BlogFaqItem[] => {
  if (typeof DOMParser === "undefined") return [];

  const documentNode = new DOMParser().parseFromString(sanitizeBlogHtml(value), "text/html");
  const faqHeading = Array.from(documentNode.body.querySelectorAll("h2")).find((heading) => {
    const normalized = normalizeFaqHeading(heading.textContent ?? "");
    return normalized === "faq" || normalized.startsWith("questions frequentes");
  });
  if (!faqHeading) return [];

  const items: BlogFaqItem[] = [];
  let element = faqHeading.nextElementSibling;

  while (element && !["H1", "H2"].includes(element.tagName)) {
    if (element.tagName === "H3") {
      const question = (element.textContent ?? "").replace(/\s+/g, " ").trim();
      const answerElement = element.nextElementSibling;
      if (question && answerElement?.tagName === "P") {
        const answer = (answerElement.textContent ?? "").replace(/\s+/g, " ").trim();
        if (answer) items.push({ question, answer });
      }
    }
    element = element.nextElementSibling;
  }

  return items;
};

export const prepareBlogContentForEditor = (value: string) =>
  sanitizeBlogHtml(value);
