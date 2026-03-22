import express from "express";
import routes from "./routes/routes.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3100;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
  }),
);
app.use("/api", routes);
app.use(express.static(path.join(__dirname, 'public')));

 



app.listen(PORT, (req, res) => {
  console.log(`Server is running on PORT : ${PORT}`);
});
