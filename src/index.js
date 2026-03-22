const express = require('express');
const cors = require('cors');

const {PrismaClient} = require('../generated/prisma/client');
const {PrismaPg} = require("@prisma/adapter-pg")
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const app = express();
const prisma = new PrismaClient();
app.use (express.json());
app.use(cors());


app.get("/", async (req,res)=>{
    const userCount = await prisma.user.userCount();

    res.json(
        userCount == 0 ? " No User " : userCount 
        
    );
});
const PORT = 3000
app.listen( PORT, ()=>{
    console.log( `Server is running in localhost:${PORT}`)
})


