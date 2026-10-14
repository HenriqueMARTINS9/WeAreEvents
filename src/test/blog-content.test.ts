import { describe, expect, it } from "vitest";
import { extractBlogFaq, prepareBlogContentForEditor, sanitizeBlogHtml } from "@/lib/blog-content";

describe("blog content", () => {
  it("converts legacy plain text headings and lists to HTML", () => {
    const html = prepareBlogContentForEditor("## Mon titre\n\n- Premier\n- Deuxième");

    expect(html).toContain("<h2>Mon titre</h2>");
    expect(html).toContain("<ul><li>Premier</li><li>Deuxième</li></ul>");
  });

  it("removes scripts, inline styles and unsafe links", () => {
    const html = sanitizeBlogHtml(
      '<h2 style="color:red">Titre</h2><script>alert(1)</script><a href="javascript:alert(1)">Lien</a>',
    );

    expect(html).toContain("<h2>Titre</h2>");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("style=");
    expect(html).not.toContain("javascript:");
  });

  it("keeps supported formatting", () => {
    const html = sanitizeBlogHtml("<p><strong>Gras</strong> et <em>italique</em></p>");

    expect(html).toBe("<p><strong>Gras</strong> et <em>italique</em></p>");
  });

  it("preserves common formatting from pasted Markdown text", () => {
    const html = prepareBlogContentForEditor(
      "### À retenir\n\n• Premier point\n• **Deuxième point**\n\n> Une citation utile\n\n[Découvrir Wearevents](https://www.wearevents.fr)",
    );

    expect(html).toContain("<h3>À retenir</h3>");
    expect(html).toContain("<ul><li>Premier point</li><li><strong>Deuxième point</strong></li></ul>");
    expect(html).toContain("<blockquote>Une citation utile</blockquote>");
    expect(html).toContain('href="https://www.wearevents.fr"');
  });

  it("preserves safe article images and captions", () => {
    const html = sanitizeBlogHtml(
      '<figure class="layout"><img src="https://cdn.example.com/lieu.webp" alt="Un lieu" width="1200" height="800" loading="lazy" onclick="alert(1)"><figcaption style="color:red">La salle principale</figcaption></figure>',
    );

    expect(html).toBe('<figure><img src="https://cdn.example.com/lieu.webp" alt="Un lieu" width="1200" height="800" loading="lazy"><figcaption>La salle principale</figcaption></figure>');
  });

  it("removes unsafe article image sources", () => {
    const html = sanitizeBlogHtml('<p>Avant</p><img src="javascript:alert(1)" alt="Test"><p>Après</p>');

    expect(html).toBe("<p>Avant</p><p>Après</p>");
  });

  it("extracts FAQ structured data from an article section", () => {
    const faq = extractBlogFaq(
      "<h2>Questions fréquentes</h2><h3>Peut-on réserver ?</h3><p>Oui, selon les disponibilités.</p><h3>Quel budget prévoir ?</h3><p>Le tarif dépend du lieu.</p><h2>Conclusion</h2><h3>Ignorée</h3><p>Hors FAQ.</p>",
    );

    expect(faq).toEqual([
      { question: "Peut-on réserver ?", answer: "Oui, selon les disponibilités." },
      { question: "Quel budget prévoir ?", answer: "Le tarif dépend du lieu." },
    ]);
  });
});
