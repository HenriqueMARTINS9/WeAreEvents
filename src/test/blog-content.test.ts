import { describe, expect, it } from "vitest";
import { prepareBlogContentForEditor, sanitizeBlogHtml } from "@/lib/blog-content";

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
});
