import { Router } from 'express';
const router = Router();
import {prisma} from "../../lib/prisma";


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

router.get('/getAll', async (req, res) => {
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
    } = req.query;

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
        where.location.is.city = { contains: String(city), mode: 'insensitive' };
    }

    if (type) {
        where.type = { in: String(type).split(',') };
    }
    if (status) {
        where.status = { in: String(status).split(',') };
    }

    if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = parseFloat(String(minPrice));
        if (maxPrice) where.price.lte = parseFloat(String(maxPrice));
    }

    if (minArea || maxArea) {
        where.lotArea = {};
        if (minArea) where.lotArea.gte = parseFloat(String(minArea));
        if (maxArea) where.lotArea.lte = parseFloat(String(maxArea));
    }

    const page  = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10));
    const limit = Math.max(1, parseInt(String(req.query.limit ?? '12'), 10));
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