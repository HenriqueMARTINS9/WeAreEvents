import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { seoLandingPages } from "../src/data/seo-landings-data.js";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const distDir = join(rootDir, "dist");
const failures = [];

const readPage = async (path) => {
  const filePath = path === "/" ? join(distDir, "index.html") : join(distDir, path.slice(1), "index.html");
  try {
    return await readFile(filePath, "utf8");
  } catch {
    failures.push(`${path}: fichier HTML manquant`);
    return "";
  }
};

const assertPageBasics = (path, html, { noindexAllowed = false } = {}) => {
  if (!/<h1[\s>]/i.test(html)) failures.push(`${path}: H1 absent du code source`);
  if (!/<link\s+rel="canonical"/i.test(html)) failures.push(`${path}: canonical absente`);
  if (!/application\/ld\+json/i.test(html)) failures.push(`${path}: données structurées absentes`);
  if (!noindexAllowed && /name="robots"\s+content="noindex/i.test(html)) failures.push(`${path}: noindex inattendu`);
};

const homeHtml = await readPage("/");
assertPageBasics("/", homeHtml);
if (!/"@type":"Organization"/.test(homeHtml)) failures.push("/: schema Organization absent");

const inspirationsHtml = await readPage("/inspirations");
assertPageBasics("/inspirations", inspirationsHtml);

let indexableSeoPages = 0;
let thinSeoPages = 0;
for (const page of seoLandingPages) {
  const path = `/${page.slug}`;
  const html = await readPage(path);
  assertPageBasics(path, html, { noindexAllowed: true });
  const isNoindex = /name="robots"\s+content="noindex/i.test(html);
  if (isNoindex) {
    thinSeoPages += 1;
  } else {
    indexableSeoPages += 1;
    if (!/href="\/salle\//i.test(html)) failures.push(`${path}: aucun lien HTML vers une fiche lieu`);
    if (!/"@type":"ItemList"/.test(html)) failures.push(`${path}: schema ItemList absent`);
    if (!/"@type":"FAQPage"/.test(html)) failures.push(`${path}: schema FAQPage absent`);
  }
}

const countGeneratedPages = async (directory) => {
  try {
    const entries = await readdir(directory);
    let count = 0;
    for (const entry of entries) {
      const filePath = join(directory, entry, "index.html");
      try {
        if ((await stat(filePath)).isFile()) count += 1;
      } catch {
        // Ignore non-page files.
      }
    }
    return count;
  } catch {
    return 0;
  }
};

const venuePages = await countGeneratedPages(join(distDir, "salle"));
const blogPages = await countGeneratedPages(join(distDir, "blog"));
if (venuePages === 0) failures.push("Aucune fiche lieu pré-rendue");

if (failures.length) {
  console.error(`Audit SEO échoué (${failures.length} problème${failures.length > 1 ? "s" : ""}) :`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Audit SEO validé : ${indexableSeoPages} pages SEO indexables, ${thinSeoPages} en noindex, ${venuePages} fiches lieu et ${blogPages} articles pré-rendus.`);
