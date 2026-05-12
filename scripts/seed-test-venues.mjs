import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
};

const loadMockVenues = () => {
  const sourcePath = path.join(rootDir, "src/data/venues.ts");
  const source = fs.readFileSync(sourcePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  const module = { exports: {} };
  const localRequire = (id) => {
    if (id === "@/types/venue") return {};
    return require(id);
  };

  Function("require", "exports", "module", output)(localRequire, module.exports, module);
  return module.exports.mockVenues;
};

const toVenueRow = (venue) => ({
  title: venue.title,
  slug: venue.slug,
  tagline: venue.tagline,
  description: venue.description,
  city: venue.city,
  address: venue.address,
  location: venue.location,
  venue_code: venue.venueCode,
  min_capacity: venue.minCapacity,
  max_capacity: venue.maxCapacity,
  event_categories: venue.eventCategories,
  venue_types: venue.venueTypes ?? [],
  services: venue.services,
  spaces: venue.spaces,
  access_details: venue.accessDetails,
  useful_information: venue.usefulInformation,
  pricing_text: venue.pricingText,
  cover_image: venue.coverImage,
  gallery: venue.gallery,
  video_url: venue.videoUrl ?? null,
  video_start_seconds: venue.videoStartSeconds ?? 0,
  video_end_seconds: venue.videoEndSeconds ?? null,
  tiktok_url: venue.tiktokUrl ?? null,
  google_review_url: venue.googleReviewUrl,
  price_tier: venue.priceTier,
  closing_time: venue.closingTime,
  ambiance_types: venue.ambianceTypes,
  external_options: venue.externalOptions,
  privatization_types: venue.privatizationTypes ?? [],
  guest_dispositions: venue.guestDispositions ?? [],
  option_features: venue.optionFeatures ?? [],
  metro_access: venue.metroAccess ?? null,
  featured: venue.featured,
  active: venue.active,
  contact_email: venue.contactEmail,
  rating: venue.rating,
  review_count: venue.reviewCount,
});

loadEnvFile(path.join(rootDir, ".env.local"));

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE;
const seedEmail = process.env.SUPABASE_SEED_EMAIL;
const seedPassword = process.env.SUPABASE_SEED_PASSWORD;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or Supabase key.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

if (!process.env.SUPABASE_SERVICE_ROLE_KEY && seedEmail && seedPassword) {
  const { error } = await supabase.auth.signInWithPassword({
    email: seedEmail,
    password: seedPassword,
  });

  if (error) {
    console.error(`Could not sign in seed user: ${error.message}`);
    process.exit(1);
  }
}

const venues = loadMockVenues();
let rows = venues.map(toVenueRow);
const skippedColumns = [];

let data = null;
let lastError = null;

for (let attempt = 0; attempt < 20; attempt += 1) {
  const result = await supabase
    .from("venues")
    .upsert(rows, { onConflict: "slug" })
    .select("slug,title,venue_code");

  if (!result.error) {
    data = result.data;
    lastError = null;
    break;
  }

  lastError = result.error;
  const missingColumn = result.error.message.match(/'([^']+)' column/)?.[1];

  if (!missingColumn) break;

  skippedColumns.push(missingColumn);
  rows = rows.map((row) => {
    const nextRow = { ...row };
    delete nextRow[missingColumn];
    return nextRow;
  });
}

if (lastError) {
  console.error(lastError.message);
  if (lastError.details) console.error(lastError.details);
  if (lastError.hint) console.error(lastError.hint);
  process.exit(1);
}

if (skippedColumns.length) {
  console.log(`Skipped missing columns: ${skippedColumns.join(", ")}`);
}

console.log(`Seeded ${data.length} venues:`);
data.forEach((venue) => {
  console.log(`- ${venue.venue_code} ${venue.title} (${venue.slug})`);
});
