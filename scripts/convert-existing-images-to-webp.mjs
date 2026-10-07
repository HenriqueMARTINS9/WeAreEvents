import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const bucket = "wearevents-images";
const maxBytes = 1024 * 1024;
const applyChanges = process.argv.includes("--apply");
const limitArg = process.argv.find((argument) => argument.startsWith("--limit="));
const limit = limitArg ? Math.max(1, Number(limitArg.split("=")[1]) || 1) : Number.POSITIVE_INFINITY;

const loadLocalEnv = async () => {
  try {
    const content = await readFile(join(rootDir, ".env.local"), "utf8");
    content.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && process.env[match[1]] === undefined) {
        process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
      }
    });
  } catch {
    // CI and production scripts can provide variables directly.
  }
};

await loadLocalEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || (!serviceKey && !publishableKey)) {
  throw new Error(
    "VITE_SUPABASE_URL et une clé Supabase sont requis.",
  );
}

if (applyChanges && !serviceKey) {
  throw new Error(
    "Le mode --apply exige SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY). Cette clé serveur ne doit jamais commencer par VITE_.",
  );
}

const supabase = createClient(supabaseUrl, serviceKey || publishableKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const storageMarker = `/storage/v1/object/public/${bucket}/`;
const getStoragePath = (url) => {
  if (typeof url !== "string" || !url.includes(storageMarker)) return null;
  const encodedPath = url.split(storageMarker)[1]?.split(/[?#]/)[0];
  if (!encodedPath) return null;

  try {
    return decodeURIComponent(encodedPath);
  } catch {
    return encodedPath;
  }
};

const canConvert = (url) => {
  const path = getStoragePath(url);
  return Boolean(path && [".jpg", ".jpeg", ".png"].includes(extname(path).toLowerCase()));
};

const getOutputPath = (path) => {
  const extension = extname(path);
  return posix.join(posix.dirname(path), `${posix.basename(path, extension)}.webp`);
};

const optimizeImage = async (input) => {
  const widths = [1200, 1000, 800];
  const qualities = [82, 76, 70, 64, 58, 52];
  let smallest = null;

  for (const width of widths) {
    for (const quality of qualities) {
      const output = await sharp(input, { failOn: "none" })
        .rotate()
        .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
        .webp({ quality, effort: 5, smartSubsample: true })
        .toBuffer();

      if (!smallest || output.length < smallest.length) smallest = output;
      if (output.length <= maxBytes) return output;
    }
  }

  if (!smallest || smallest.length > maxBytes) {
    throw new Error("Impossible de passer sous 1 Mo sans descendre sous les dimensions prévues.");
  }

  return smallest;
};

const replaceUrl = (value, replacements) => replacements.get(value) || value;
const replaceVenueImages = (venue, replacements) => ({
  cover_image: replaceUrl(venue.cover_image, replacements),
  gallery: (venue.gallery || []).map((url) => replaceUrl(url, replacements)),
  spaces: (venue.spaces || []).map((space) => ({
    ...space,
    imageUrl: replaceUrl(space.imageUrl, replacements),
  })),
});

console.log(`Lecture du catalogue Supabase (${applyChanges ? "conversion" : "simulation"})…`);
const [{ data: venues, error: venuesError }, { data: posts, error: postsError }] = await Promise.all([
  supabase
    .from("venues")
    .select("id,title,cover_image,gallery,spaces")
    .abortSignal(AbortSignal.timeout(20_000)),
  supabase
    .from("blog_posts")
    .select("id,title,image")
    .abortSignal(AbortSignal.timeout(20_000)),
]);

if (venuesError) throw venuesError;
if (postsError) throw postsError;

const referencedUrls = new Set();
for (const venue of venues || []) {
  [venue.cover_image, ...(venue.gallery || []), ...(venue.spaces || []).map((space) => space?.imageUrl)]
    .filter(canConvert)
    .forEach((url) => referencedUrls.add(url));
}
for (const post of posts || []) {
  if (canConvert(post.image)) referencedUrls.add(post.image);
}

const candidates = [...referencedUrls].slice(0, limit);
console.log(`${candidates.length} image(s) JPEG/PNG Supabase à convertir${Number.isFinite(limit) ? ` (limite ${limit})` : ""}.`);

if (!applyChanges) {
  candidates.slice(0, 20).forEach((url) => console.log(`- ${getStoragePath(url)}`));
  if (candidates.length > 20) console.log(`- … et ${candidates.length - 20} autre(s)`);
  console.log("Simulation uniquement. Relancez avec --apply pour convertir et mettre à jour les URL.");
  process.exit(0);
}

const replacements = new Map();
const report = [];

for (const [index, sourceUrl] of candidates.entries()) {
  const sourcePath = getStoragePath(sourceUrl);
  const outputPath = getOutputPath(sourcePath);

  try {
    const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`Téléchargement HTTP ${response.status}`);

    const input = Buffer.from(await response.arrayBuffer());
    const output = await optimizeImage(input);
    const { error: uploadError } = await supabase.storage.from(bucket).upload(outputPath, output, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: true,
    });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(outputPath);
    replacements.set(sourceUrl, publicUrlData.publicUrl);
    report.push({ sourceUrl, outputUrl: publicUrlData.publicUrl, sourceBytes: input.length, outputBytes: output.length });
    console.log(`[${index + 1}/${candidates.length}] ${sourcePath}: ${(input.length / 1024).toFixed(0)} Ko -> ${(output.length / 1024).toFixed(0)} Ko`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    report.push({ sourceUrl, error: message });
    console.error(`[${index + 1}/${candidates.length}] Échec ${sourcePath}: ${message}`);
  }
}

let updatedVenues = 0;
for (const venue of venues || []) {
  const next = replaceVenueImages(venue, replacements);
  const changed = next.cover_image !== venue.cover_image
    || JSON.stringify(next.gallery) !== JSON.stringify(venue.gallery || [])
    || JSON.stringify(next.spaces) !== JSON.stringify(venue.spaces || []);
  if (!changed) continue;

  const { error } = await supabase.from("venues").update(next).eq("id", venue.id);
  if (error) throw new Error(`Mise à jour de ${venue.title}: ${error.message}`);
  updatedVenues += 1;
}

let updatedPosts = 0;
for (const post of posts || []) {
  const image = replaceUrl(post.image, replacements);
  if (image === post.image) continue;

  const { error } = await supabase.from("blog_posts").update({ image }).eq("id", post.id);
  if (error) throw new Error(`Mise à jour de ${post.title}: ${error.message}`);
  updatedPosts += 1;
}

const exportsDir = join(rootDir, "exports");
await mkdir(exportsDir, { recursive: true });
const reportPath = join(exportsDir, `image-conversion-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");

console.log(`${replacements.size} image(s) convertie(s), ${updatedVenues} salle(s) et ${updatedPosts} article(s) mis à jour.`);
console.log(`Rapport : ${reportPath}`);
console.log("Les fichiers d'origine sont conservés pour permettre un retour arrière.");
