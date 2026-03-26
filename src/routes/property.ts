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

    res.json(
        properties
    );
});

export const propertyRouter = router;