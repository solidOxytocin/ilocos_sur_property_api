import { Router } from 'express';
const router = Router();
import {prisma} from "../../lib/prisma";
import cloudinary from "../../config/cloudinary";
import multer from "multer";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { isAllowedImageMimeType, validateUploadedImages } from "../utils/upload-security";

const FIVE_MB = 5 * 1024 * 1024;
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: FIVE_MB },
    fileFilter: (_req, file, cb) => {
      if (isAllowedImageMimeType(file.mimetype)) cb(null, true);
      else cb(new Error("Only supported image files are allowed"));
    },
});

const getAllQuerySchema = z.object({
  searchQuery: z.string().trim().optional(),
  type: z.union([z.string(), z.array(z.string())]).optional(),
  status: z.union([z.string(), z.array(z.string())]).optional(),
  minPrice: z.coerce.number().finite().nonnegative().optional(),
  maxPrice: z.coerce.number().finite().nonnegative().optional(),
  city: z.string().trim().optional(),
  minArea: z.coerce.number().finite().nonnegative().optional(),
  maxArea: z.coerce.number().finite().nonnegative().optional(),
  sortBy: z.enum(["price", "createdAt", "lotArea", "city", "title"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});


router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    await validateUploadedImages([file]);

    const base64 = file.buffer.toString("base64");

    const result = await cloudinary.uploader.upload(
      `data:${file.mimetype};base64,${base64}`,
      {
        folder: "properties",
      }
    );

    res.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    res.status(500).json({ error: "Upload failed" });
  }
});


router.get('/bounds', async (req, res) => {
  const result:any[] = await prisma.$queryRaw`
    SELECT MAX("lotArea") AS "maxLotArea", MAX("price") AS "maxPrice"
    FROM "Property"
    WHERE "lotArea" IS NOT NULL AND "lotArea" != 'NaN'
  `;

  const maxLotArea = result[0]?.maxLotArea ?? 1500;
  const maxPrice = result[0]?.maxPrice ?? 50000000;

  res.json({ maxLotArea, maxPrice });
});

router.get('/getAll', validateRequest({ query: getAllQuerySchema }), async (req, res) => {
    const parsedQuery = getAllQuerySchema.parse(req.query);
    const {
        searchQuery,
        type,
        status,
        minPrice,
        maxPrice,
        city,
        minArea,
        maxArea,
        sortBy,
        sortOrder,
        page = 1,
        limit = 12,
    } = parsedQuery;

    const where: any = {};

    if (searchQuery) {
        const queryStr = String(searchQuery);
        where.OR = [
            { title: { contains: queryStr, mode: 'insensitive' } },
            { location: { is: { city: { contains: queryStr, mode: 'insensitive' } } } },
            { location: { is: { barangay: { contains: queryStr, mode: 'insensitive' } } } },
            { location: { is: { address: { contains: queryStr, mode: 'insensitive' } } } },
        ];
    } 
    
    if (city) {
        if (!where.location) where.location = {};
        if (!where.location.is) where.location.is = {};
        where.location.is.city = { equals: String(city), mode: 'insensitive' };
    }

    if (type) {
        where.type = { in: String(type).split(',') };
    }
    if (status) {
        where.status = { in: String(status).split(',') };
    }

    if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice !== undefined) where.price.gte = minPrice;
        if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (minArea || maxArea) {
        where.lotArea = {};
        if (minArea !== undefined) where.lotArea.gte = minArea;
        if (maxArea !== undefined) where.lotArea.lte = maxArea;
    }

    const skip  = (page - 1) * limit;

    const allowedSortFields = ['price', 'createdAt', 'lotArea', 'city', 'title'];
    const nullableFields = ['lotArea'];

    const sortField = allowedSortFields.includes(String(sortBy))
    ? String(sortBy)
    : 'createdAt';

    const order: 'asc' | 'desc' = sortOrder === 'asc' ? 'asc' : 'desc';

    let orderBy;

    if (sortField === 'city') {
        orderBy = {
            location: {
            city: order,
            },
    };
    } else if (nullableFields.includes(sortField)) {
        orderBy = {
            [sortField]: {
            sort: order,
            nulls: 'last',
            },
        };
    } else {
    orderBy = {
        [sortField]: order,
    };
    }
    const [total, properties] = await Promise.all([
        prisma.property.count({ where }),
        prisma.property.findMany({
            where,
            skip,
            take: limit,
            include: {
                features: true,
                amenity: true,
                media: true,
                location: {
                    include: {
                        coordinates: true
                    }
                }
            },
            orderBy:orderBy
            
        }),
    ]);

    const formattedProperties = properties.map((property: any) => {
        // Map Prisma's 'amenity', 'bedRooms', 'bathRooms' to frontend expected keys
        const { amenity, bedRooms, bathRooms, ...rest } = property;
        return {
            ...rest,
            amenities: amenity,
            bedrooms: bedRooms,
            bathrooms: bathRooms
        };
    });

    res.json({
        data: formattedProperties,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    });
});

/**
 * GET /property/city-counts
 * Returns the number of properties per city.
 * Response shape: [{ city: string; count: number }] sorted by count desc.
 */
router.get('/city-counts', async (req, res) => {
  try {
    // Group Location rows by city and count how many properties each city has
    const grouped = await prisma.location.groupBy({
      by: ['city'],
      _count: {
        propertyId: true,
      },
      orderBy: {
        _count: {
          propertyId: 'desc',
        },
      },
    });

    const result = grouped.map((row: any) => ({
      city: row.city,
      count: row._count.propertyId,
    }));

    res.json(result);
  } catch (e) {
    console.error('Error fetching city counts:', e);
    res.status(500).json({ error: 'Failed to fetch city counts' });
  }
});

export const propertyRouter = router;
