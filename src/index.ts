import "dotenv/config";
import express from 'express'
import cors from 'cors'
import { propertyRouter} from "./routes/property";

const app = express();
app.use (express.json());
app.use(cors());


app.use("/property",propertyRouter)



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});