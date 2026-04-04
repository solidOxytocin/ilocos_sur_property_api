import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { PropertyType, PropertyStatus, MediaType } from '../../generated/prisma/enums';

const router = Router();

// Create a new property
router.post('/property', async (req, res) => {
    try {
        const {
            title,
            type,
            status,
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
            type: type ? String(type).toUpperCase() as PropertyType : PropertyType.HOUSE,
            status: status ? String(status).toUpperCase() as PropertyStatus : PropertyStatus.AVAILABLE,
            price: parseFloat(price),
            slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
        };

        if (lotArea) data.lotArea = parseFloat(lotArea);
        if (floorArea) data.floorArea = parseFloat(floorArea);
        if (bedRooms) data.bedRooms = parseInt(bedRooms);
        if (bathRooms) data.bathRooms = parseInt(bathRooms);
        if (parking) data.parking = parseInt(parking);
        if (details) data.details = details;

        if (location) {
            data.location = {
                create: {
                    address: location.address,
                    barangay: location.barangay,
                    city: location.city,
                    province: location.province,
                    country: location.country || 'Philippines',
                    region: location.region || null,
                    zipCode: location.zipCode || null,
                }
            };
            if (location.coordinates) {
                 data.location.create.coordinates = {
                     create: {
                         lat: parseFloat(location.coordinates.lat),
                         lng: parseFloat(location.coordinates.lng)
                     }
                 };
            }
        }

        if (media && Array.isArray(media)) {
             data.media = {
                 create: media.map((m: any) => ({
                     url: m.url,
                     type: MediaType.IMAGE,
                     isPrimary: !!m.isPrimary,
                 }))
             };
        }

        if (features && Array.isArray(features)) {
             data.features = {
                 connect: features.map((f: any) => ({ key: f.key }))
             };
        }

        if (amenities && Array.isArray(amenities)) {
             data.amenity = {
                 connect: amenities.map((a: any) => ({ key: a.key }))
             };
        }

        const property = await prisma.property.create({
            data,
            include: {
                location: { include: { coordinates: true } },
                media: true,
                features: true,
                amenity: true,
            }
        });

        res.status(201).json(property);
    } catch (error: any) {
        console.error("Error creating property:", error);
        res.status(500).json({ error: error.message });
    }
});

// Update a property
router.put('/property/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const {
            title,
            type,
            status,
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

        if (media && Array.isArray(media)) {
             await prisma.media.deleteMany({ where: { propertyId: id } });
        }

        const data: any = {};
        if (title !== undefined) data.title = title;
        if (type !== undefined) data.type = String(type).toUpperCase();
        if (status !== undefined) data.status = String(status).toUpperCase();
        if (price !== undefined) data.price = parseFloat(price);
        if (lotArea !== undefined) data.lotArea = parseFloat(lotArea);
        if (floorArea !== undefined) data.floorArea = parseFloat(floorArea);
        if (bedRooms !== undefined) data.bedRooms = parseInt(bedRooms);
        if (bathRooms !== undefined) data.bathRooms = parseInt(bathRooms);
        if (parking !== undefined) data.parking = parseInt(parking);
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
                        country: location.country || 'Philippines',
                        region: location.region || null,
                        zipCode: location.zipCode || null,
                    },
                    update: {
                        address: location.address,
                        barangay: location.barangay,
                        city: location.city,
                        province: location.province,
                        country: location.country || 'Philippines',
                        region: location.region,
                        zipCode: location.zipCode,
                    }
                }
            };
            if (location.coordinates) {
                 data.location.upsert.create.coordinates = {
                     create: {
                         lat: parseFloat(location.coordinates.lat),
                         lng: parseFloat(location.coordinates.lng)
                     }
                 };
                 data.location.upsert.update.coordinates = {
                     upsert: {
                         create: {
                             lat: parseFloat(location.coordinates.lat),
                             lng: parseFloat(location.coordinates.lng)
                         },
                         update: {
                             lat: parseFloat(location.coordinates.lat),
                             lng: parseFloat(location.coordinates.lng)
                         }
                     }
                 };
            }
        }

        if (media && Array.isArray(media)) {
             data.media = {
                 create: media.map((m: any) => ({
                     url: m.url,
                     type: MediaType.IMAGE,
                     isPrimary: !!m.isPrimary,
                 }))
             };
        }

        if (features && Array.isArray(features)) {
             data.features = {
                 set: [],
                 connect: features.map((f: any) => ({ key: f.key }))
             };
        }

        if (amenities && Array.isArray(amenities)) {
             data.amenity = {
                 set: [],
                 connect: amenities.map((a: any) => ({ key: a.key }))
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
            }
        });

        res.json(property);
    } catch (error: any) {
        console.error("Error updating property:", error);
        res.status(500).json({ error: error.message });
    }
});

// Delete a single property
router.delete('/property/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.property.delete({
            where: { id }
        });
        res.json({ success: true, message: "Property deleted" });
    } catch (error: any) {
        console.error("Error deleting property:", error);
        res.status(500).json({ error: error.message });
    }
});

// Delete multiple properties
router.post('/property/delete-many', async (req, res) => {
    try {
        const { ids } = req.body; // Expects { ids: [1, 2, 3] }
        if (!ids || !Array.isArray(ids)) {
             return res.status(400).json({ error: 'ids array is required' });
        }
        await prisma.property.deleteMany({
            where: {
                id: { in: ids.map(id => parseInt(id)) }
            }
        });
        res.json({ success: true, message: `${ids.length} properties deleted` });
    } catch (error: any) {
        console.error("Error deleting properties:", error);
        res.status(500).json({ error: error.message });
    }
});

export const adminRouter = router;
