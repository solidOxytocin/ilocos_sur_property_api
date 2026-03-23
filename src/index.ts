import "dotenv/config";
import express from 'express'
import cors from 'cors'
import {prisma} from "../lib/prisma";

const app = express();
app.use (express.json());
app.use(cors());


app.get("/", async (req,res)=>{
   const properties = await prisma.property.findMany({
    include: {
        feature: true,
    },
    });

    res.json(
        properties
    );
});
const PORT = 3000
app.listen( PORT, ()=>{
    console.log("Connecting to:", process.env.DATABASE_URL);
    console.log( `Server is running in localhost:${PORT}`)
})


