import { Router } from 'express';
const router = Router();
import {prisma} from "../../lib/prisma";


router.get('/bounds', async (req, res) => {
    const aggregate = await prisma.property.aggregate({
        _max: {
            price: true,
            lotArea: true
        }
    });
    res.json({
        maxPrice: aggregate._max.price || 50000000,
        maxLotArea: aggregate._max.lotArea || 1000
    });
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
        maxArea
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

    const properties = await prisma.property.findMany({
        where,
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
    });
    const formattedProperties = properties.map(property => {
        // Map Prisma's 'amenity', 'bedRooms', 'bathRooms' to frontend expected keys
        const { amenity, bedRooms, bathRooms, ...rest } = property;
        return {
            ...rest,
            amenities: amenity,
            bedrooms: bedRooms,
            bathrooms: bathRooms
        };
    });

    res.json(
        formattedProperties
    );
});

export const propertyRouter = router;