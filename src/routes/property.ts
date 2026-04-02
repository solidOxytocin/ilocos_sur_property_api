import { Router } from 'express';
const router = Router();
import {prisma} from "../../lib/prisma";


router.get('/getAll',async (req,res)=>{
   const properties = await prisma.property.findMany({
    include: {
        features: true,
        amenity: true,
        media: true,
        location: {
             include:{
                coordinates:true
            }
        }
    },
    });
    const formattedProperties = properties.map(property => {
        // Map Prisma's 'amenity' to 'amenities' for the frontend
        const { amenity, ...rest } = property;
        return {
            ...rest,
            amenities: amenity
        };
    });

    res.json(
        formattedProperties
    );
});

export const propertyRouter = router;