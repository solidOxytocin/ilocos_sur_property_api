/**
 * Phase 2 — Build camella-manifest.json from folder layout + filenames.
 *
 * Usage:
 *   node scripts/build-camella-manifest.mjs
 *   node scripts/build-camella-manifest.mjs --photos ./camella-photos --out ./prisma/data/camella-manifest.json
 *
 * Reads computation sheets under camella-photos/{Subdivision}/{Category}/
 * Matches hero images in camella-photos/_cropped/
 * Ignores "Maps and Requirements" folders.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_ROOT = path.resolve(__dirname, "..");

const IMAGE_EXT = /\.(png|jpe?g|webp)$/i;
const PROPERTY_TYPE_HOUSE_AND_LOT = "HOUSE_AND_LOT";
const SKIP_DIRS = /^(maps and requirements|_cropped)$/i;

const SUBDIVISION_META = {
  "Camella Candon": {
    city: "Candon",
    province: "Ilocos Sur",
    coordinates: { lat: 17.193, lng: 120.453 },
  },
  "Camella Bantay": {
    city: "Bantay",
    province: "Ilocos Sur",
    coordinates: { lat: 17.5847, lng: 120.3892 },
  },
  "Camella Laoag": {
    city: "Laoag City",
    province: "Ilocos Norte",
    coordinates: { lat: 18.1978, lng: 120.5927 },
  },
};

const DEFAULT_FEATURES = ["gated", "road"];
const DEFAULT_AMENITIES = ["security"];

function parseArgs(argv) {
  const args = {
    photos: path.join(API_ROOT, "camella-photos"),
    out: path.join(API_ROOT, "prisma", "data", "camella-manifest.json"),
  };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--photos" && argv[i + 1]) {
      args.photos = path.resolve(argv[++i]);
    } else if (argv[i] === "--out" && argv[i + 1]) {
      args.out = path.resolve(argv[++i]);
    }
  }
  return args;
}

function normKey(name) {
  return path
    .basename(name, path.extname(name))
    .replace(/_test_photo$/i, "")
    .replace(/_photo$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function titleCaseWords(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function parseCategory(folderName) {
  const f = folderName.toLowerCase();
  if (/lot\s*only|lots\s*only/.test(f)) return "LOT_ONLY";
  if (f.includes("rfo") && f.includes("bts")) return null; // per-file: RFO or BTS
  if (f.includes("nrfo")) return "NRFO";
  if (f.includes("rfo")) return "RFO";
  return "UNKNOWN";
}

function parseLotAreaFromText(text) {
  const m =
    text.match(/(\d+)\s*sqm?s?\b/i) ||
    text.match(/\b(\d+)\s*sqm/i) ||
    text.match(/(\d+)sqm/i);
  return m ? Number(m[1]) : null;
}

function stripBlockLotSegment(baseName) {
  // e.g. "CRISELLE 8-7 RFO ..." or "MIKA 20-19 RFO ..."
  return baseName
    .replace(/\s+\d{1,4}-\d{1,4}\s+(?=RFO|BTS)/i, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseModelAndArea(baseName, categoryFolder) {
  const raw = stripBlockLotSegment(baseName);
  const upper = raw.toUpperCase();

  if (/^lot only\b/i.test(raw)) {
    return { model: null, lotArea: parseLotAreaFromText(raw), variant: null };
  }

  // Camella Laoag Criselle 174 sqms
  let m = raw.match(/^Camella\s+Laoag\s+(.+?)\s+(\d+)\s*sqm?s?\b/i);
  if (m) return { model: formatModelName(m[1]), lotArea: Number(m[2]), variant: null };

  // Arielle EU 66 sqm Camella Candon
  m = raw.match(/^(.+?)\s+(\d+)\s*sqm\s+Camella\b/i);
  if (m) return { model: formatModelName(m[1]), lotArea: Number(m[2]), variant: null };

  // Cara CB NRFO Camella Laoag 168sqm / Dana CB BTS Camella Candon
  m = raw.match(/^(.+?)\s+(?:NRFO|RFO|BTS)\s+Camella\b/i);
  if (m) {
    const model = formatModelName(m[1]);
    const lotArea = parseLotAreaFromText(raw);
    return { model, lotArea, variant: null };
  }

  m = raw.match(/^(.+?)\s+(\d+)\s*sqm\s+Camella\s+Laoag$/i);
  if (m) return { model: formatModelName(m[1]), lotArea: Number(m[2]), variant: null };

  // CRISELLE 72SQM CAMELLA BANTAY
  m = raw.match(/^(.+?)\s+(\d+)\s*SQM\s+CAMELLA\b/i);
  if (m) return { model: formatModelName(m[1]), lotArea: Number(m[2]), variant: null };

  // MODEL RFO CAMELLA SUBDIVISION NEW
  m = raw.match(/^(.+?)\s+RFO\s+CAMELLA\b/i);
  if (m) return { model: formatModelName(m[1]), lotArea: parseLotAreaFromText(raw), variant: null };

  // Dana CB BTS Camella Candon
  m = raw.match(/^(.+?)\s+BTS\s+Camella\b/i);
  if (m) return { model: formatModelName(m[1]), lotArea: parseLotAreaFromText(raw), variant: null };

  // Bella NRFO Camella Candon / Criselle NRFO Camella Candon
  m = raw.match(/^(.+?)\s+NRFO\s+Camella\b/i);
  if (m) return { model: formatModelName(m[1]), lotArea: parseLotAreaFromText(raw), variant: null };

  // DANIELLE CAMELLA  BANTAY (RFO folder, no RFO in filename)
  m = raw.match(/^(.+?)\s+CAMELLA\s+\w+/i);
  if (m && /rfo/i.test(categoryFolder)) {
    return { model: formatModelName(m[1]), lotArea: parseLotAreaFromText(raw), variant: null };
  }

  return {
    model: formatModelName(raw.split(/\s+Camella\b/i)[0] || raw),
    lotArea: parseLotAreaFromText(raw),
    variant: null,
  };
}

/** Preserve Camella model codes like "Cara CB", "Arielle EU". */
function formatModelName(raw) {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (!cleaned) return null;

  const upperTokens = new Set(["CB", "EU", "IU", "NRFO", "RFO", "BTS", "NEW"]);
  return cleaned
    .split(" ")
    .map((word) => {
      const u = word.toUpperCase();
      if (upperTokens.has(u)) return u;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function resolveListingCategory(categoryFolder, baseName) {
  const folderCat = parseCategory(categoryFolder);
  if (folderCat === "LOT_ONLY") return "LOT_ONLY";
  if (folderCat === "NRFO") return "NRFO";
  if (folderCat === "RFO") return "RFO";

  const upper = baseName.toUpperCase();
  if (/\bBTS\b/.test(upper)) return "BTS";
  if (/\bRFO\b/.test(upper)) return "RFO";
  if (/\bNRFO\b/.test(upper)) return "NRFO";
  return folderCat || "UNKNOWN";
}

function buildTitle({ model, lotArea, subdivision, city, category, type }) {
  if (type === "LOT") {
    const area = lotArea ? `${lotArea} sqm ` : "";
    return `${area}Lot — ${subdivision}`.replace(/\s+/g, " ").trim();
  }
  const label = category === "LOT_ONLY" ? "" : ` (${category})`;
  const lotSuffix = lotArea ? `, ${lotArea} sqm lot` : "";
  return `${model}${lotSuffix} — ${subdivision}${label}`;
}

function buildSlugBase({ model, lotArea, subdivision, category, type }) {
  const parts = [type === "LOT" ? "lot" : model, subdivision, category];
  if (lotArea) parts.push(`${lotArea}sqm`);
  return slugify(parts.filter(Boolean).join(" "));
}

function ensureUniqueSlugs(listings) {
  const used = new Map();
  for (const listing of listings) {
    let slug = listing.slug;
    const count = used.get(slug) ?? 0;
    if (count > 0) {
      slug = `${slug}-${count + 1}`;
    }
    used.set(listing.slug, count + 1);
    listing.slug = slug;
  }
}

function buildDetails({ model, lotArea, subdivision, city, province, category, type }) {
  if (type === "LOT") {
    const area = lotArea ? `${lotArea} sqm ` : "";
    return `${area}lot for sale in ${subdivision}, ${city}, ${province}. Gated Camella community.`;
  }
  const parts = [`${category} house and lot in ${subdivision}, ${city}.`];
  if (model) parts.push(`Model: ${model}.`);
  if (lotArea) parts.push(`${lotArea} sqm lot.`);
  parts.push("Contact us for updated pricing and availability.");
  return parts.join(" ");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function listSourceSheets(photosDir) {
  const sheets = [];
  for (const subdivision of fs.readdirSync(photosDir, { withFileTypes: true })) {
    if (!subdivision.isDirectory() || SKIP_DIRS.test(subdivision.name)) continue;
    const subPath = path.join(photosDir, subdivision.name);
    for (const category of fs.readdirSync(subPath, { withFileTypes: true })) {
      if (!category.isDirectory() || SKIP_DIRS.test(category.name)) continue;
      const catPath = path.join(subPath, category.name);
      for (const file of fs.readdirSync(catPath, { withFileTypes: true })) {
        if (!file.isFile() || !IMAGE_EXT.test(file.name)) continue;
        sheets.push({
          subdivision: subdivision.name,
          categoryFolder: category.name,
          fileName: file.name,
          fullPath: path.join(catPath, file.name),
        });
      }
    }
  }
  return sheets.sort((a, b) => a.fullPath.localeCompare(b.fullPath));
}

function indexCroppedHeroes(croppedDir) {
  const index = new Map();
  if (!fs.existsSync(croppedDir)) return index;

  const files = fs
    .readdirSync(croppedDir)
    .filter((f) => IMAGE_EXT.test(f))
    .sort((a, b) => {
      const aTest = /_test_photo/i.test(a);
      const bTest = /_test_photo/i.test(b);
      if (aTest !== bTest) return aTest ? 1 : -1;
      return a.localeCompare(b);
    });

  for (const file of files) {
    const key = normKey(file);
    if (!index.has(key)) index.set(key, file);
  }
  return index;
}

function toRelative(fromRoot, absolutePath) {
  return path.relative(fromRoot, absolutePath).split(path.sep).join("/");
}

function buildEntry(sheet, croppedIndex, photosDir) {
  const meta = SUBDIVISION_META[sheet.subdivision];
  if (!meta) {
    throw new Error(`Unknown subdivision folder: ${sheet.subdivision}`);
  }

  const baseName = path.basename(sheet.fileName, path.extname(sheet.fileName));
  const category = resolveListingCategory(sheet.categoryFolder, baseName);
  const type = category === "LOT_ONLY" ? "LOT" : PROPERTY_TYPE_HOUSE_AND_LOT;
  const { model, lotArea } = parseModelAndArea(baseName, sheet.categoryFolder);

  const subdivision = sheet.subdivision;
  const { city, coordinates, province = "Ilocos Sur" } = meta;

  const title = buildTitle({ model, lotArea, subdivision, city, category, type });
  const slug = buildSlugBase({ model, lotArea, subdivision, category, type });
  const key = slugify(`${subdivision}-${category}-${model || "lot"}-${lotArea || "na"}-${baseName}`);

  const cropKey = normKey(sheet.fileName);
  const croppedFile = croppedIndex.get(cropKey) ?? null;
  const heroImage = croppedFile
    ? toRelative(API_ROOT, path.join(photosDir, "_cropped", croppedFile))
    : null;

  const sourceSheet = toRelative(API_ROOT, sheet.fullPath);

  return {
    key,
    title,
    type,
    status: "AVAILABLE",
    price: null,
    lotArea,
    floorArea: null,
    bedRooms: null,
    bathRooms: null,
    parking: null,
    details: buildDetails({ model, lotArea, subdivision, city, province, category, type }),
    slug,
    subdivision,
    city,
    province,
    country: "Philippines",
    region: "Region I",
    category,
    model,
    location: {
      address: subdivision,
      barangay: "",
      city,
      province,
      country: "Philippines",
      region: "Region I",
      zipCode: null,
      coordinates,
      boundaries: null,
    },
    heroImage,
    sourceSheet,
    features: [...DEFAULT_FEATURES],
    amenities: [...DEFAULT_AMENITIES],
    _meta: {
      categoryFolder: sheet.categoryFolder,
      sourceFileName: sheet.fileName,
    },
  };
}

function main() {
  const { photos, out } = parseArgs(process.argv);
  const croppedDir = path.join(photos, "_cropped");

  if (!fs.existsSync(photos)) {
    console.error(`Photos directory not found: ${photos}`);
    process.exit(1);
  }

  const sheets = listSourceSheets(photos);
  const croppedIndex = indexCroppedHeroes(croppedDir);
  const listings = sheets.map((s) => buildEntry(s, croppedIndex, photos));
  ensureUniqueSlugs(listings);

  const manifest = {
    generatedAt: new Date().toISOString(),
    version: 1,
    photosDir: toRelative(API_ROOT, photos),
    listingCount: listings.length,
    notes: [
      "Fill price and floorArea from computation sheets before seeding.",
      "Do not publish sourceSheet paths or block/lot data from filenames.",
      "heroImage paths are relative to ilocos_sur_property_api root.",
    ],
    listings,
  };

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  const missingHero = listings.filter((l) => !l.heroImage);
  const missingPrice = listings.filter((l) => l.price == null);

  console.log(`Wrote ${listings.length} listings → ${out}`);
  console.log(`  Hero images matched: ${listings.length - missingHero.length}/${listings.length}`);
  console.log(`  Price filled: ${listings.length - missingPrice.length}/${listings.length} (fill before seed)`);

  if (missingHero.length) {
    console.warn("\nMissing cropped hero:");
    missingHero.forEach((l) => console.warn(`  - ${l.sourceSheet}`));
  }

  const bySub = {};
  for (const l of listings) {
    const k = `${l.subdivision} | ${l.category}`;
    bySub[k] = (bySub[k] || 0) + 1;
  }
  console.log("\nBreakdown:");
  Object.entries(bySub)
    .sort()
    .forEach(([k, n]) => console.log(`  ${n}  ${k}`));
}

main();
