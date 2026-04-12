import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, } from "../generated/prisma/client";
import { PropertyType, PropertyStatus, MediaType} from "../generated/prisma/enums"
import {mockProperties} from "./data/mockProperties"

const connectionString=  process.env.DATABASE_URL
const pool = new Pool({ connectionString:connectionString });
const adapter = new PrismaPg({connectionString: connectionString });

const prisma = new PrismaClient({ adapter });

async function clearTableData(){
  console.log("🗑️ Delete Existing Data");
 
  await prisma.coordinate.deleteMany();
  await prisma.location.deleteMany();
  await prisma.features.deleteMany(); 
  await prisma.amenity.deleteMany(); 
  await prisma.media.deleteMany();
  await prisma.property.deleteMany();
}

async function featureSeeding(){
  console.log("⭐ Feature Seeding Start")

  const features = await prisma.features.createMany({
    data: [
      { name: "Main Road", key: "road" },
      { name: "Hospital", key: "hospital" },
      { name: "School", key: "school" },
      { name: "Market", key: "store" },
      { name: "Beach Spot", key: "beach" },
      { name: "Mall Nearby", key: "shopping" },
      { name: "Parking", key:"parking"},
    ],
    skipDuplicates: true,
  });

console.log("✅  Feature Seeding Done ")
}

async function amenitySeeding(){
  console.log("🏊 Amenity Seeding Start")

  const amenities = await prisma.amenity.createMany({
    data: [
      { name: "Swimming Pool", key: "pool" },
      { name: "Gym", key: "gym" },
      { name: "24/7 Security", key: "security" },
      { name: "Elevator", key: "elevator" },
    ],
    skipDuplicates: true,
  });

  console.log("✅  Amenity Seeding Done ")
}

async function propertySeeding(){
  console.log("🏢 Property Seeding Start")

  for (const item of mockProperties) {
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
          // Spread logic: Only adds the key if the value exists
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
                create:{
                    lng:  item.location.coordinates?.lng ?? 0 ,
                    lat: item.location.coordinates?.lat ?? 0
                }
               
              }
            },
          },

          media: {
            create: item.media.map((m: any) => ({
              url: m.url,
              type: m.type.toUpperCase() as MediaType,
              isPrimary: m.isPrimary,
            })),
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
    }

  console.log("✅  Property Seeding Done ")
}

async function main() {
  console.log("🌱 Seed Starts");
  await featureSeeding()
  await amenitySeeding()
  await propertySeeding()
  console.log("✅ Seeding complete!");
}

await clearTableData()
  .then(async ()=>{
    main()
    .then(async () => {
      await prisma.$disconnect();
      await pool.end();
    })
    .catch(async (e) => {
      console.log("❌ Main Error");
      console.error(e);
      await prisma.$disconnect();
      await pool.end();
      process.exit(1);
    });
  })
  .catch(async (e)=> {
    console.log("❌ Clearing Error");
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1)
  })
