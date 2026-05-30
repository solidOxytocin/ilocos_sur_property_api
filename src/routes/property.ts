import { Router } from 'express';
const router = Router();
import {prisma} from "../../lib/prisma";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { PropertyStatus } from "../../generated/prisma/enums";

const getAllQuerySchema = z.object({
  searchQuery: z.string().trim().optional(),
  type: z.union([z.string(), z.array(z.string())]).optional(),
  status: z.union([z.string(), z.array(z.string())]).optional(),
  features: z.union([z.string(), z.array(z.string())]).optional(),
  amenities: z.union([z.string(), z.array(z.string())]).optional(),
  minPrice: z.coerce.number().finite().nonnegative().optional(),
  maxPrice: z.coerce.number().finite().nonnegative().optional(),
  city: z.string().trim().optional(),
  barangay: z.string().trim().optional(),
  minArea: z.coerce.number().finite().nonnegative().optional(),
  maxArea: z.coerce.number().finite().nonnegative().optional(),
  sortBy: z.enum(["price", "createdAt", "lotArea", "city", "title"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const propertyInclude = {
  features: true,
  amenity: true,
  media: true,
  location: {
    include: {
      coordinates: true,
    },
  },
} as const;

function shouldDeprioritizeSold(statusFilter?: string | string[]): boolean {
  if (!statusFilter) return true;
  const statuses = String(statusFilter).split(",").map((s) => s.toUpperCase());
  if (statuses.length === 1 && statuses[0] === PropertyStatus.SOLD) return false;
  return statuses.includes(PropertyStatus.SOLD);
}

function splitWhereBySoldStatus(where: Record<string, unknown>) {
  const { status, ...rest } = where;
  let statusList: string[] | null = null;

  if (status && typeof status === "object") {
    const statusObj = status as { in?: string[]; equals?: string };
    if (Array.isArray(statusObj.in)) statusList = statusObj.in;
    else if (statusObj.equals) statusList = [statusObj.equals];
  } else if (typeof status === "string") {
    statusList = [status];
  }

  const nonSoldStatuses = statusList ? statusList.filter((s) => s !== PropertyStatus.SOLD) : null;
  const nonSoldWhere = {
    ...rest,
    ...(nonSoldStatuses === null
      ? { status: { not: PropertyStatus.SOLD } }
      : nonSoldStatuses.length === 0
      ? { status: { in: [] as string[] } }
      : nonSoldStatuses.length === 1
      ? { status: nonSoldStatuses[0] }
      : { status: { in: nonSoldStatuses } }),
  };

  const soldWhere = {
    ...rest,
    ...(!statusList || statusList.includes(PropertyStatus.SOLD)
      ? { status: PropertyStatus.SOLD }
      : { status: { in: [] as string[] } }),
  };

  return { nonSoldWhere, soldWhere };
}

function buildOrderBy(sortField: string, order: "asc" | "desc") {
  const nullableFields = ["lotArea"];
  if (sortField === "city") {
    return { location: { city: order } };
  }
  if (nullableFields.includes(sortField)) {
    return { [sortField]: { sort: order, nulls: "last" as const } };
  }
  return { [sortField]: order };
}

async function fetchPropertiesSoldLast(
  where: Record<string, unknown>,
  orderBy: Record<string, unknown>,
  skip: number,
  limit: number
) {
  const { nonSoldWhere, soldWhere } = splitWhereBySoldStatus(where);

  const [nonSoldCount, soldCount] = await Promise.all([
    prisma.property.count({ where: nonSoldWhere }),
    prisma.property.count({ where: soldWhere }),
  ]);

  const total = nonSoldCount + soldCount;
  let properties: Awaited<ReturnType<typeof prisma.property.findMany>> = [];

  if (skip < nonSoldCount) {
    const nonSoldTake = Math.min(limit, nonSoldCount - skip);
    const nonSold = await prisma.property.findMany({
      where: nonSoldWhere,
      skip,
      take: nonSoldTake,
      orderBy,
      include: propertyInclude,
    });
    properties = nonSold;

    if (properties.length < limit) {
      const sold = await prisma.property.findMany({
        where: soldWhere,
        skip: 0,
        take: limit - properties.length,
        orderBy,
        include: propertyInclude,
      });
      properties = [...properties, ...sold];
    }
  } else {
    properties = await prisma.property.findMany({
      where: soldWhere,
      skip: skip - nonSoldCount,
      take: limit,
      orderBy,
      include: propertyInclude,
    });
  }

  return { total, properties };
}

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
        features,
        amenities,
        minPrice,
        maxPrice,
        city,
        barangay,
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

    if (barangay) {
        if (!where.location) where.location = {};
        if (!where.location.is) where.location.is = {};
        where.location.is.barangay = { equals: String(barangay), mode: 'insensitive' };
    }

    if (type) {
        where.type = { in: String(type).split(',') };
    }
    if (status) {
        where.status = { in: String(status).split(',') };
    }

    if (features) {
        // AND logic: property must have ALL selected features
        const featureKeys = String(features).split(',').filter(Boolean);
        if (featureKeys.length > 0) {
            where.AND = where.AND || [];
            where.AND.push(...featureKeys.map((key: string) => ({
                features: { some: { key } },
            })));
        }
    }

    if (amenities) {
        // AND logic: property must have ALL selected amenities
        const amenityKeys = String(amenities).split(',').filter(Boolean);
        if (amenityKeys.length > 0) {
            where.AND = where.AND || [];
            where.AND.push(...amenityKeys.map((key: string) => ({
                amenity: { some: { key } },
            })));
        }
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

    const sortField = allowedSortFields.includes(String(sortBy))
    ? String(sortBy)
    : 'createdAt';

    const order: 'asc' | 'desc' = sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy = buildOrderBy(sortField, order);

    const deprioritizeSold = shouldDeprioritizeSold(status);

    const queryResult = deprioritizeSold
      ? await fetchPropertiesSoldLast(where, orderBy, skip, limit)
      : {
          total: await prisma.property.count({ where }),
          properties: await prisma.property.findMany({
            where,
            skip,
            take: limit,
            include: propertyInclude,
            orderBy,
          }),
        };

    const { total, properties } = queryResult;

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
