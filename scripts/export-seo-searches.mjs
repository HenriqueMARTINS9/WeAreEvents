import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { seoLandingPages } from "../src/data/seo-landings-data.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const outputPath = resolve(projectRoot, "exports/recherches-seo.csv");
const siteUrl = (process.env.VITE_SITE_URL || process.env.PUBLIC_SITE_URL || "https://www.wearevents.fr").replace(/\/$/, "");

const escapeCsv = (value) => {
  const text = String(value ?? "");
  return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const rows = seoLandingPages.map((page) => ({
  nom: page.h1,
  slug: page.slug,
  url: `${siteUrl}/${page.slug}`,
}));

const csv = [
  ["nom", "slug", "url"].join(";"),
  ...rows.map((row) => [row.nom, row.slug, row.url].map(escapeCsv).join(";")),
].join("\n");

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${csv}\n`, "utf8");

console.log(`Export SEO créé : ${outputPath}`);
console.log(`${rows.length} recherches SEO exportées.`);
