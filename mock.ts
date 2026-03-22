const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const mockProperties = require("../data/mockProperties"); // adjust path

async function main() {
  for (const property of mockProperties) {
    await prisma.property.create({
      data: {
        title: property.title,
        type: property.type,
        status: property.status,
        price: property.price,
        createdAt: new Date(property.createdAt),
        updatedAt: property.updatedAt
          ? new Date(property.updatedAt)
          : new Date(),

        lotArea: property.lotArea,
        details: property.details,

        location: {
          create: property.location,
        },

        media: {
          create: property.media,
        },

        features: {
          create: property.features,
        },
      },
    });
  }

  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });