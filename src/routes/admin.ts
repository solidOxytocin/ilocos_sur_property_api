import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../../lib/prisma';
import { PropertyType, PropertyStatus, MediaType } from '../../generated/prisma/enums';
import cloudinary from '../../config/cloudinary';
import { requireAdminAuth } from '../middleware/auth';

const router = Router();
router.use(requireAdminAuth);

const TEN_MB = 10 * 1024 * 1024;

const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: TEN_MB },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    },
});

async function safeDestroyCloudinary(publicId: string) {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (e) {
        console.warn('Cloudinary destroy failed for', publicId, e);
    }
}

function mediaStillUsed(
    old: { url: string; cloudinaryPublicId: string | null },
    newMedia: { url?: string; cloudinaryPublicId?: string | null }[]
) {
    return newMedia.some(
        (n) =>
            (n.url && n.url === old.url) ||
            (n.cloudinaryPublicId &&
                old.cloudinaryPublicId &&
                n.cloudinaryPublicId === old.cloudinaryPublicId)
    );
}

/** POST /admin/media/upload — multiple images (field name `images`), max 10MB each */
router.post('/media/upload', (req, res, next) => {
    imageUpload.array('images', 24)(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'Each image must be 10MB or smaller' });
            }
            return res.status(400).json({ error: err.message });
        }
        if (err) {
            return res.status(400).json({ error: String((err as Error).message || err) });
        }
        next();
    });
}, async (req, res) => {
    try {
        const files = req.files as Express.Multer.File[];
        if (!files?.length) {
            return res.status(400).json({ error: 'No image files (use form field "images")' });
        }

        const items: { url: string; cloudinaryPublicId: string }[] = [];
        for (const file of files) {
            const base64 = file.buffer.toString('base64');
            const result = await cloudinary.uploader.upload(`data:${file.mimetype};base64,${base64}`, {
                folder: 'properties',
            });
            items.push({ url: result.secure_url, cloudinaryPublicId: result.public_id });
        }

        res.json({ items });
    } catch (error: any) {
        console.error('Error uploading media:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

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
            type: type ? (String(type).toUpperCase() as PropertyType) : PropertyType.HOUSE,
            status: status ? (String(status).toUpperCase() as PropertyStatus) : PropertyStatus.AVAILABLE,
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
                    boundaries: location.boundaries || null,
                },
            };
            if (location.coordinates) {
                data.location.create.coordinates = {
                    create: {
                        lat: parseFloat(location.coordinates.lat),
                        lng: parseFloat(location.coordinates.lng),
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

        res.status(201).json(property);
    } catch (error: any) {
        console.error('Error creating property:', error);
        res.status(500).json({ error: 'Failed to create property' });
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
                        boundaries: location.boundaries || null,
                    },
                    update: {
                        address: location.address,
                        barangay: location.barangay,
                        city: location.city,
                        province: location.province,
                        country: location.country || 'Philippines',
                        region: location.region,
                        zipCode: location.zipCode,
                        boundaries: location.boundaries || null,
                    },
                },
            };
            if (location.coordinates) {
                data.location.upsert.create.coordinates = {
                    create: {
                        lat: parseFloat(location.coordinates.lat),
                        lng: parseFloat(location.coordinates.lng),
                    },
                };
                data.location.upsert.update.coordinates = {
                    upsert: {
                        create: {
                            lat: parseFloat(location.coordinates.lat),
                            lng: parseFloat(location.coordinates.lng),
                        },
                        update: {
                            lat: parseFloat(location.coordinates.lat),
                            lng: parseFloat(location.coordinates.lng),
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

        res.json(property);
    } catch (error: any) {
        console.error('Error updating property:', error);
        res.status(500).json({ error: 'Failed to update property' });
    }
});

// Delete a single property
router.delete('/property/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const mediaRows = await prisma.media.findMany({ where: { propertyId: id } });
        for (const m of mediaRows) {
            if (m.cloudinaryPublicId) {
                await safeDestroyCloudinary(m.cloudinaryPublicId);
            }
        }
        await prisma.property.delete({
            where: { id },
        });
        res.json({ success: true, message: 'Property deleted' });
    } catch (error: any) {
        console.error('Error deleting property:', error);
        res.status(500).json({ error: 'Failed to delete property' });
    }
});

// Delete multiple properties
router.post('/property/delete-many', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ error: 'ids array is required' });
        }
        const intIds = ids.map((x: string | number) => parseInt(String(x)));
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
        res.json({ success: true, message: `${ids.length} properties deleted` });
    } catch (error: any) {
        console.error('Error deleting properties:', error);
        res.status(500).json({ error: 'Failed to delete properties' });
    }
});

export const adminRouter = router;
