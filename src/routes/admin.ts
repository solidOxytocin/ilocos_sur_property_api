import { Router } from "express";
import multer from "multer";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { PropertyType, PropertyStatus, MediaType } from "../../generated/prisma/enums";
import cloudinary from "../../config/cloudinary";
import { requireAdminAuth } from "../middleware/auth";
import { numericIdParamSchema, validateRequest } from "../middleware/validation";
import { isAllowedImageMimeType, validateUploadedImages } from "../utils/upload-security";
import { verifyPassword } from "../utils/password";

const router = Router();

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

const propertyTypeEnum = z.enum([
  PropertyType.HOUSE_AND_LOT,
  PropertyType.LOT,
  PropertyType.CONDO,
  PropertyType.COMMERCIAL,
]);
const propertyStatusEnum = z.enum([PropertyStatus.AVAILABLE, PropertyStatus.SOLD, PropertyStatus.RESERVED, PropertyStatus.RENTED]);

const mediaSchema = z.object({
  url: z.string().url(),
  cloudinaryPublicId: z.string().trim().min(1).nullable().optional(),
  isPrimary: z.boolean().optional(),
});

const locationSchema = z.object({
  address: z.string().trim().min(1),
  barangay: z.string().trim().min(1),
  city: z.string().trim().min(1),
  province: z.enum(["Ilocos Sur", "Ilocos Norte"]),
  country: z.string().trim().min(1).optional(),
  region: z.string().trim().min(1).nullable().optional(),
  zipCode: z.string().trim().min(1).nullable().optional(),
  boundaries: z.unknown().nullable().optional(),
  coordinates: z
    .object({
      lat: z.coerce.number().finite(),
      lng: z.coerce.number().finite(),
    })
    .optional(),
});

const keyRefSchema = z.object({ key: z.string().trim().min(1) });

const createPropertySchema = z.object({
  title: z.string().trim().min(1),
  type: propertyTypeEnum.optional(),
  status: propertyStatusEnum.optional(),
  price: z.coerce.number().finite().nonnegative(),
  lotArea: z.coerce.number().finite().nonnegative().optional(),
  floorArea: z.coerce.number().finite().nonnegative().optional(),
  bedRooms: z.coerce.number().int().min(0).optional(),
  bathRooms: z.coerce.number().int().min(0).optional(),
  parking: z.coerce.number().int().min(0).optional(),
  details: z.string().optional(),
  slug: z.string().trim().min(1).optional(),
  location: locationSchema.optional(),
  media: z.array(mediaSchema).optional(),
  features: z.array(keyRefSchema).optional(),
  amenities: z.array(keyRefSchema).optional(),
});

const updatePropertySchema = createPropertySchema.partial();

const deleteManySchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1),
});

router.post("/auth/login", validateRequest({ body: loginSchema }), async (req, res) => {
  const username = String(req.body?.username ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");

  const jwtSecret = process.env.ADMIN_JWT_SECRET;
  const expiresIn = process.env.ADMIN_JWT_EXPIRES_IN ?? "12h";

  if (!jwtSecret) {
    console.error("Missing ADMIN_JWT_SECRET");
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  const users = await prisma.$queryRaw<{
    username: string;
    passwordHash: string;
    isActive: boolean;
  }[]>`
        SELECT "username", "passwordHash", "isActive"
        FROM "AdminUser"
        WHERE "username" = ${username}
        LIMIT 1
    `;

  const adminUser = users[0];

  if (!adminUser) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (!adminUser.isActive) {
    return res.status(403).json({ error: "Account disabled" });
  }

  const passwordMatches = await verifyPassword(password, adminUser.passwordHash);

  if (!passwordMatches) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const accessToken = jwt.sign({ role: "admin" }, jwtSecret, { subject: adminUser.username, expiresIn });

  const decoded = jwt.decode(accessToken) as { exp?: number } | null;
  const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : null;

  return res.json({
    accessToken,
    tokenType: "Bearer",
    expiresIn,
    expiresAt,
  });
});

router.use(requireAdminAuth);

const FIVE_MB = 5 * 1024 * 1024;

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: FIVE_MB },
  fileFilter: (_req, file, cb) => {
    if (isAllowedImageMimeType(file.mimetype)) cb(null, true);
    else cb(new Error("Only supported image files are allowed"));
  },
});

async function safeDestroyCloudinary(publicId: string) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (e) {
    console.warn("Cloudinary destroy failed for", publicId, e);
  }
}

function mediaStillUsed(
  old: { url: string; cloudinaryPublicId: string | null },
  newMedia: { url?: string; cloudinaryPublicId?: string | null }[],
) {
  return newMedia.some(
    (n) =>
      (n.url && n.url === old.url) ||
      (n.cloudinaryPublicId && old.cloudinaryPublicId && n.cloudinaryPublicId === old.cloudinaryPublicId),
  );
}

router.post(
  "/media/upload",
  (req, res, next) => {
    imageUpload.array("images", 24)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "Each image must be 5MB or smaller" });
        }
        return res.status(400).json({ error: err.message });
      }
      if (err) {
        return res.status(400).json({ error: String((err as Error).message || err) });
      }
      return next();
    });
  },
  async (req, res) => {
    try {
      const files = (req.files as Express.Multer.File[]) ?? [];
      if (!files.length) {
        return res.status(400).json({ error: 'No image files (use form field "images")' });
      }
      await validateUploadedImages(files);

      const items: { url: string; cloudinaryPublicId: string }[] = [];
      for (const file of files) {
        const base64 = file.buffer.toString("base64");
        const result = await cloudinary.uploader.upload(`data:${file.mimetype};base64,${base64}`, {
          folder: "properties",
        });
        items.push({ url: result.secure_url, cloudinaryPublicId: result.public_id });
      }

      return res.json({ items });
    } catch (error: any) {
      console.error("Error uploading media:", error);
      return res.status(500).json({ error: "Upload failed" });
    }
  },
);

router.post("/property", validateRequest({ body: createPropertySchema }), async (req, res) => {
  try {
    const {
      title,
      type = PropertyType.HOUSE_AND_LOT,
      status = PropertyStatus.AVAILABLE,
      price,
      lotArea,
      floorArea,
      bedRooms,
      bathRooms,
      parking,
      details,
      slug,
      location,
      media,
      features,
      amenities,
    } = req.body;

    const data: any = {
      title,
      type,
      status,
      price,
      slug: slug || title.toLowerCase().replace(/\s+/g, "-"),
    };

    if (lotArea !== undefined) data.lotArea = lotArea;
    if (floorArea !== undefined) data.floorArea = floorArea;
    if (bedRooms !== undefined) data.bedRooms = bedRooms;
    if (bathRooms !== undefined) data.bathRooms = bathRooms;
    if (parking !== undefined) data.parking = parking;
    if (details) data.details = details;

    if (location) {
      data.location = {
        create: {
          address: location.address,
          barangay: location.barangay,
          city: location.city,
          province: location.province,
          country: location.country || "Philippines",
          region: location.region || null,
          zipCode: location.zipCode || null,
          boundaries: location.boundaries || null,
        },
      };
      if (location.coordinates) {
        data.location.create.coordinates = {
          create: {
            lat: location.coordinates.lat,
            lng: location.coordinates.lng,
          },
        };
      }
    }

    if (media && Array.isArray(media)) {
      data.media = {
        create: media.map((m: any) => ({
          url: m.url,
          type: MediaType.IMAGE,
          isPrimary: !!m.isPrimary,
          cloudinaryPublicId: m.cloudinaryPublicId || null,
        })),
      };
    }

    if (features && Array.isArray(features)) {
      data.features = {
        connect: features.map((f: any) => ({ key: f.key })),
      };
    }

    if (amenities && Array.isArray(amenities)) {
      data.amenity = {
        connect: amenities.map((a: any) => ({ key: a.key })),
      };
    }

    const property = await prisma.property.create({
      data,
      include: {
        location: { include: { coordinates: true } },
        media: true,
        features: true,
        amenity: true,
      },
    });

    return res.status(201).json(property);
  } catch (error: any) {
    console.error("Error creating property:", error);
    return res.status(500).json({ error: "Failed to create property" });
  }
});

router.put(
  "/property/:id",
  validateRequest({ params: numericIdParamSchema, body: updatePropertySchema }),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { title, type, status, price, lotArea, floorArea, bedRooms, bathRooms, parking, details, slug, location, media, features, amenities } =
        req.body;

      if (media && Array.isArray(media)) {
        const oldMedia = await prisma.media.findMany({ where: { propertyId: id } });
        for (const row of oldMedia) {
          if (row.cloudinaryPublicId && !mediaStillUsed(row, media)) {
            await safeDestroyCloudinary(row.cloudinaryPublicId);
          }
        }
        await prisma.media.deleteMany({ where: { propertyId: id } });
      }

      const data: any = {};
      if (title !== undefined) data.title = title;
      if (type !== undefined) data.type = type;
      if (status !== undefined) data.status = status;
      if (price !== undefined) data.price = price;
      if (lotArea !== undefined) data.lotArea = lotArea;
      if (floorArea !== undefined) data.floorArea = floorArea;
      if (bedRooms !== undefined) data.bedRooms = bedRooms;
      if (bathRooms !== undefined) data.bathRooms = bathRooms;
      if (parking !== undefined) data.parking = parking;
      if (details !== undefined) data.details = details;
      if (slug !== undefined) data.slug = slug;

      if (location) {
        data.location = {
          upsert: {
            create: {
              address: location.address,
              barangay: location.barangay,
              city: location.city,
              province: location.province,
              country: location.country || "Philippines",
              region: location.region || null,
              zipCode: location.zipCode || null,
              boundaries: location.boundaries || null,
            },
            update: {
              address: location.address,
              barangay: location.barangay,
              city: location.city,
              province: location.province,
              country: location.country || "Philippines",
              region: location.region,
              zipCode: location.zipCode,
              boundaries: location.boundaries || null,
            },
          },
        };
        if (location.coordinates) {
          data.location.upsert.create.coordinates = {
            create: {
              lat: location.coordinates.lat,
              lng: location.coordinates.lng,
            },
          };
          data.location.upsert.update.coordinates = {
            upsert: {
              create: {
                lat: location.coordinates.lat,
                lng: location.coordinates.lng,
              },
              update: {
                lat: location.coordinates.lat,
                lng: location.coordinates.lng,
              },
            },
          };
        }
      }

      if (media && Array.isArray(media)) {
        data.media = {
          create: media.map((m: any) => ({
            url: m.url,
            type: MediaType.IMAGE,
            isPrimary: !!m.isPrimary,
            cloudinaryPublicId: m.cloudinaryPublicId || null,
          })),
        };
      }

      if (features && Array.isArray(features)) {
        data.features = {
          set: [],
          connect: features.map((f: any) => ({ key: f.key })),
        };
      }

      if (amenities && Array.isArray(amenities)) {
        data.amenity = {
          set: [],
          connect: amenities.map((a: any) => ({ key: a.key })),
        };
      }

      const property = await prisma.property.update({
        where: { id },
        data,
        include: {
          location: { include: { coordinates: true } },
          media: true,
          features: true,
          amenity: true,
        },
      });

      return res.json(property);
    } catch (error: any) {
      console.error("Error updating property:", error);
      return res.status(500).json({ error: "Failed to update property" });
    }
  },
);

router.delete("/property/:id", validateRequest({ params: numericIdParamSchema }), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const mediaRows = await prisma.media.findMany({ where: { propertyId: id } });
    for (const m of mediaRows) {
      if (m.cloudinaryPublicId) {
        await safeDestroyCloudinary(m.cloudinaryPublicId);
      }
    }
    await prisma.property.delete({
      where: { id },
    });
    return res.json({ success: true, message: "Property deleted" });
  } catch (error: any) {
    console.error("Error deleting property:", error);
    return res.status(500).json({ error: "Failed to delete property" });
  }
});

router.post("/property/delete-many", validateRequest({ body: deleteManySchema }), async (req, res) => {
  try {
    const { ids } = req.body;
    const intIds = ids as number[];
    const mediaRows = await prisma.media.findMany({
      where: { propertyId: { in: intIds }, cloudinaryPublicId: { not: null } },
    });
    for (const m of mediaRows) {
      if (m.cloudinaryPublicId) {
        await safeDestroyCloudinary(m.cloudinaryPublicId);
      }
    }
    await prisma.property.deleteMany({
      where: {
        id: { in: intIds },
      },
    });
    return res.json({ success: true, message: `${ids.length} properties deleted` });
  } catch (error: any) {
    console.error("Error deleting properties:", error);
    return res.status(500).json({ error: "Failed to delete properties" });
  }
});

export const adminRouter = router;
