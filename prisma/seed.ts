import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { PropertyType, PropertyStatus, MediaType } from "../generated/prisma/enums";
import { mockProperties } from "./data/mockProperties";
import { hashPassword } from "../src/utils/password";
import {
    hasCloudinaryConfig,
    seedImageToCloudinary,
    destroyCloudinaryPublicId,
} from "./seedCloudinary";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({ adapter });

async function clearTableData() {
    console.log("🗑️ Delete Existing Data");

    if (hasCloudinaryConfig()) {
        const existingMedia = await prisma.media.findMany({
            where: { cloudinaryPublicId: { not: null } },
            select: { cloudinaryPublicId: true },
        });
        console.log(`   Removing ${existingMedia.length} Cloudinary seed/listing assets (best-effort)...`);
        for (const row of existingMedia) {
            if (row.cloudinaryPublicId) {
                await destroyCloudinaryPublicId(row.cloudinaryPublicId);
            }
        }
    }

    await prisma.coordinate.deleteMany();
    await prisma.location.deleteMany();
    await prisma.features.deleteMany();
    await prisma.amenity.deleteMany();
    await prisma.media.deleteMany();
    await prisma.property.deleteMany();
    await prisma.$executeRaw`DELETE FROM "AdminUser"`;
}

async function adminUserSeeding() {
    if(!process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim()){
        return;
    }
    const username = String(process.env.ADMIN_BOOTSTRAP_USERNAME ?? "admin").trim().toLowerCase();
    const password = process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim();
    const passwordHash = await hashPassword(password);

    await prisma.$executeRaw`
        INSERT INTO "AdminUser" ("username", "passwordHash", "isActive", "createdAt", "updatedAt")
        VALUES (${username}, ${passwordHash}, true, NOW(), NOW())
        ON CONFLICT ("username")
        DO UPDATE SET
          "passwordHash" = EXCLUDED."passwordHash",
          "isActive" = EXCLUDED."isActive",
          "updatedAt" = NOW()
    `;

    console.log(`✅ Admin user seeded (${username})`);
}

async function featureSeeding() {
    console.log("⭐ Feature Seeding Start");

    await prisma.features.createMany({
        data: [
            // Original
            { name: "Main Road",       key: "road" },
            { name: "Hospital",        key: "hospital" },
            { name: "School",          key: "school" },
            { name: "Market",          key: "store" },
            { name: "Beach Spot",      key: "beach" },
            { name: "Mall Nearby",     key: "shopping" },
            { name: "Parking",         key: "parking" },
            // New
            { name: "Church/Chapel",   key: "church" },
            { name: "Transport Hub",   key: "transport" },
            { name: "Nature/Park",     key: "nature" },
            { name: "Restaurant",      key: "restaurant" },
            { name: "Gas Station",     key: "gas_station" },
            { name: "Gated Community", key: "gated" },
            { name: "Fiber/Internet",  key: "wifi" },
            { name: "Mountain View",   key: "mountain" },
        ],
        skipDuplicates: true,
    });

    console.log("✅  Feature Seeding Done ");
}

async function amenitySeeding() {
    console.log("🏊 Amenity Seeding Start");

    await prisma.amenity.createMany({
        data: [
            // Original
            { name: "Swimming Pool",   key: "pool" },
            { name: "Gym",             key: "gym" },
            { name: "24/7 Security",   key: "security" },
            { name: "Elevator",        key: "elevator" },
            // New
            { name: "CCTV",            key: "cctv" },
            { name: "Water System",    key: "water" },
            { name: "Solar Power",     key: "solar" },
            { name: "Garden/Yard",     key: "garden" },
            { name: "Balcony",         key: "balcony" },
            { name: "Covered Parking", key: "covered_parking" },
        ],
        skipDuplicates: true,
    });

    console.log("✅  Amenity Seeding Done ");
}

async function resolveMediaRow(m: { url: string; type: string; isPrimary?: boolean }) {
    try {
        const { url, cloudinaryPublicId } = await seedImageToCloudinary(m.url);
        return {
            url,
            cloudinaryPublicId,
            type: m.type.toUpperCase() as MediaType,
            isPrimary: !!m.isPrimary,
        };
    } catch (e) {
        console.warn(`   ⚠️  Cloudinary upload failed for "${m.url.slice(0, 80)}..." — storing original URL only.`, e);
        return {
            url: m.url,
            cloudinaryPublicId: null as string | null,
            type: m.type.toUpperCase() as MediaType,
            isPrimary: !!m.isPrimary,
        };
    }
}

async function propertySeeding() {
    console.log("🏢 Property Seeding Start");
    if (hasCloudinaryConfig()) {
        console.log("   (Cloudinary configured — uploading mock images; duplicate URLs are deduplicated.)");
    } else {
        console.log("   (Cloudinary env missing — media rows use original remote URLs, cloudinaryPublicId null.)");
    }

    let n = 0;
    for (const item of mockProperties) {
        n += 1;
        const mediaRows = await Promise.all((item.media || []).map((m: any) => resolveMediaRow(m)));

        await prisma.property.create({
            data: {
                title: item.title,
                type: item.type.toUpperCase() as PropertyType,
                status: item.status.toUpperCase() as PropertyStatus,
                price: item.price,
                lotArea: item.lotArea ?? null,
                floorArea: item.floorArea ?? null,
                bedRooms: item.bedrooms ?? null,
                bathRooms: item.bathrooms ?? null,
                parking: item.parking ?? null,
                details: item.details ?? null,
                slug: item.title.toLowerCase().replace(/\s+/g, "-"),
                ...(item.createdAt && { createdAt: new Date(item.createdAt) }),
                ...(item.updatedAt && { updatedAt: new Date(item.updatedAt) }),

                location: {
                    create: {
                        address: item.location.address,
                        barangay: item.location.barangay,
                        city: item.location.city,
                        province: item.location.province,
                        country: item.location.country,
                        boundaries: item.location.boundaries ? (item.location.boundaries as any) : null,
                        coordinates: {
                            create: {
                                lng: item.location.coordinates?.lng ?? 0,
                                lat: item.location.coordinates?.lat ?? 0,
                            },
                        },
                    },
                },

                media: {
                    create: mediaRows,
                },

                features: {
                    connect: (item.features || []).map((f: any) => ({
                        key: f.key,
                    })),
                },
                amenity: {
                    connect: (item.amenities || []).map((a: any) => ({
                        key: a.key,
                    })),
                },
            },
        });

        if (n % 5 === 0) {
            console.log(`   … ${n} / ${mockProperties.length} properties`);
        }
    }

    console.log("✅  Property Seeding Done ");
}

async function main() {
    console.log("🌱 Seed Starts");
    await adminUserSeeding();
    await featureSeeding();
    await amenitySeeding();
    await propertySeeding();
    console.log("✅ Seeding complete!");
}

await clearTableData()
    .then(async () => {
        await main();
        await prisma.$disconnect();
        await pool.end();
    })
    .catch(async (e) => {
        console.log("❌ Seed Error");
        console.error(e);
        await prisma.$disconnect();
        await pool.end();
        process.exit(1);
    });
