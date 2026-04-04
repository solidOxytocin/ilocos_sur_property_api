import "dotenv/config";
import express from 'express'
import cors from 'cors'
import { propertyRouter} from "./routes/property";

const app = express();
app.use (express.json());
app.use(cors());


import { adminRouter } from "./routes/admin";

app.use("/property",propertyRouter)
app.use("/admin", adminRouter)


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});