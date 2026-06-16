import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { PropertyType, PropertyStatus, MediaType } from "../generated/prisma/enums";
import { REFERENCE_AMENITIES, REFERENCE_FEATURES } from "../src/data/reference-data";
import {
    hasCloudinaryConfig,
    uploadLocalFileToCloudinary,
    destroyCloudinaryPublicId,
} from "./seedCloudinary";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(__dirname, "data", "camella-manifest.json");

type CamellaListing = {
    key: string;
    title: string;
    type: string;
    status: string;
    price: number | null;
    lotArea: number | null;
    floorArea: number | null;
    bedRooms: number | null;
    bathRooms: number | null;
    parking: number | null;
    details: string | null;
    slug: string;
    heroImage: string | null;
    features: string[];
    amenities: string[];
    location: {
        address: string;
        barangay: string;
        city: string;
        province: string;
        country: string;
        region?: string | null;
        zipCode?: string | null;
        coordinates?: { lat: number; lng: number } | null;
        boundaries?: unknown;
    };
};

function toPropertyType(type: string): PropertyType {
    const normalized = type.toUpperCase().replace(/-/g, "_");
    if (normalized === "HOUSE" || normalized === "HOUSE_AND_LOT") {
        return PropertyType.HOUSE_AND_LOT;
    }
    return normalized as PropertyType;
}

function cloudinaryFolderForListing(listing: CamellaListing): string {
    const city = listing.location.city.toLowerCase().replace(/\s+/g, "-");
    return `properties/camella/${city}`;
}

function validateManifest(listings: CamellaListing[]): string[] {
    const errors: string[] = [];

    for (const listing of listings) {
        const label = listing.title || listing.key;
        if (listing.price == null || listing.price <= 0) {
            errors.push(`${label}: missing or invalid price`);
        }
        if (listing.lotArea == null || listing.lotArea <= 0) {
            errors.push(`${label}: missing or invalid lotArea`);
        }
        if (listing.type === "HOUSE_AND_LOT" && (listing.floorArea == null || listing.floorArea <= 0)) {
            errors.push(`${label}: missing or invalid floorArea`);
        }
        if (!listing.heroImage) {
            errors.push(`${label}: missing heroImage`);
            continue;
        }
        const heroPath = path.join(API_ROOT, listing.heroImage);
        if (!fs.existsSync(heroPath)) {
            errors.push(`${label}: hero image not found at ${listing.heroImage}`);
        }
        if (!listing.slug?.trim()) {
            errors.push(`${label}: missing slug`);
        }
    }

    const slugs = listings.map((l) => l.slug);
    const dupSlugs = slugs.filter((s, i) => slugs.indexOf(s) !== i);
    if (dupSlugs.length) {
        errors.push(`Duplicate slugs: ${[...new Set(dupSlugs)].join(", ")}`);
    }

    return errors;
}

function createPgPool(): Pool {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString?.trim()) {
        throw new Error("DATABASE_URL is not set");
    }

    const useSsl =
        connectionString.includes("render.com") ||
        connectionString.includes("sslmode=require") ||
        process.env.DATABASE_SSL === "true";

    return new Pool({
        connectionString,
        ssl: useSsl ? { rejectUnauthorized: false } : undefined,
        max: 5,
        connectionTimeoutMillis: 30_000,
    });
}

const pool = createPgPool();
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function verifyDatabaseConnection() {
    const client = await pool.connect();
    try {
        await client.query("SELECT 1");
        console.log("   Database connection OK");
    } finally {
        client.release();
    }
}

async function ensureReferenceData() {
    await prisma.features.createMany({ data: REFERENCE_FEATURES, skipDuplicates: true });
    await prisma.amenity.createMany({ data: REFERENCE_AMENITIES, skipDuplicates: true });
}

async function clearExistingListings() {
    console.log("🗑️  Removing existing property listings...");

    if (hasCloudinaryConfig()) {
        const existingMedia = await prisma.media.findMany({
            where: { cloudinaryPublicId: { not: null } },
            select: { cloudinaryPublicId: true },
        });
        console.log(`   Destroying ${existingMedia.length} Cloudinary media asset(s)...`);
        for (const row of existingMedia) {
            if (row.cloudinaryPublicId) {
                await destroyCloudinaryPublicId(row.cloudinaryPublicId);
            }
        }
    }

    const deleted = await prisma.property.deleteMany();
    console.log(`   Deleted ${deleted.count} property row(s).`);
}

async function resolveHeroMedia(listing: CamellaListing) {
    const heroPath = path.join(API_ROOT, listing.heroImage!);
    const folder = cloudinaryFolderForListing(listing);

    try {
        const { url, cloudinaryPublicId } = await uploadLocalFileToCloudinary(heroPath, {
            folder,
            publicId: listing.slug,
        });
        return {
            url,
            cloudinaryPublicId,
            type: MediaType.IMAGE,
            isPrimary: true,
        };
    } catch (e) {
        console.warn(`   ⚠️  Cloudinary upload failed for "${listing.title}"`, e);
        return {
            url: listing.heroImage!,
            cloudinaryPublicId: null as string | null,
            type: MediaType.IMAGE,
            isPrimary: true,
        };
    }
}

async function seedCamellaListings(listings: CamellaListing[]) {
    console.log("🏡 Seeding Camella listings...");
    if (hasCloudinaryConfig()) {
        console.log("   Cloudinary configured — uploading cropped hero images.");
    } else {
        console.log("   ⚠️  Cloudinary env missing — media rows will use local paths only.");
    }

    let n = 0;
    for (const listing of listings) {
        n += 1;
        const mediaRow = await resolveHeroMedia(listing);
        const loc = listing.location;

        await prisma.property.create({
            data: {
                title: listing.title,
                type: toPropertyType(listing.type),
                status: listing.status.toUpperCase() as PropertyStatus,
                price: listing.price!,
                lotArea: listing.lotArea,
                floorArea: listing.floorArea,
                bedRooms: listing.bedRooms,
                bathRooms: listing.bathRooms,
                parking: listing.parking,
                details: listing.details,
                slug: listing.slug,
                location: {
                    create: {
                        address: loc.address,
                        barangay: loc.barangay || "",
                        city: loc.city,
                        province: loc.province,
                        country: loc.country,
                        region: loc.region ?? null,
                        zipCode: loc.zipCode ?? null,
                        boundaries: loc.boundaries ? (loc.boundaries as object) : null,
                        coordinates: {
                            create: {
                                lat: loc.coordinates?.lat ?? 0,
                                lng: loc.coordinates?.lng ?? 0,
                            },
                        },
                    },
                },
                media: { create: [mediaRow] },
                features: {
                    connect: (listing.features || []).map((key) => ({ key })),
                },
                amenity: {
                    connect: (listing.amenities || []).map((key) => ({ key })),
                },
            },
        });

        if (n % 5 === 0 || n === listings.length) {
            console.log(`   … ${n} / ${listings.length}`);
        }
    }

    console.log(`✅  Seeded ${listings.length} Camella listing(s).`);
}

async function main() {
    if (!fs.existsSync(MANIFEST_PATH)) {
        throw new Error(`Manifest not found: ${MANIFEST_PATH}`);
    }

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")) as {
        listings: CamellaListing[];
    };
    const listings = manifest.listings ?? [];

    if (listings.length === 0) {
        throw new Error("Manifest has no listings.");
    }

    const errors = validateManifest(listings);
    if (errors.length) {
        console.error("❌ Manifest validation failed:\n");
        errors.forEach((e) => console.error(`   • ${e}`));
        process.exit(1);
    }

    console.log(`📋 Manifest OK — ${listings.length} listings`);
    await verifyDatabaseConnection();
    await ensureReferenceData();
    await clearExistingListings();
    await seedCamellaListings(listings);
    console.log("✅ Camella seed complete!");
}

main()
    .catch(async (e) => {
        console.error("❌ Camella seed error");
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
