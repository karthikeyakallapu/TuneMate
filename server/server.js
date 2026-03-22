import express from "express";
import routes from "./routes/routes.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3100;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const normalizeOrigin = (origin = "") => origin.replace(/\/+$/, "");

const parseOriginsFromEnv = (value) => {
  if (!value || typeof value !== "string") return [];
  return value
    .split(",")
    .map((origin) => normalizeOrigin(origin.trim()))
    .filter(Boolean);
};

const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://tunemate.vercel.app",
  "https://www.tunemate.vercel.app",
].map(normalizeOrigin);

const configuredAllowedOrigins = new Set([
  ...defaultAllowedOrigins,
  ...parseOriginsFromEnv(process.env.FRONTEND_URL),
  ...parseOriginsFromEnv(process.env.FRONTEND_URLS),
]);

const allowAllOrigins =
  process.env.ALLOW_ALL_ORIGINS === "true" ||
  configuredAllowedOrigins.has("*");

const corsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedRequestOrigin = normalizeOrigin(origin);

    if (
      allowAllOrigins ||
      configuredAllowedOrigins.has(normalizedRequestOrigin)
    ) {
      return callback(null, true);
    }

    return callback(new Error(`CORS_BLOCKED:${normalizedRequestOrigin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-skip-auth-refresh"],
  optionsSuccessStatus: 204,
};

app.use(express.json());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use((error, req, res, next) => {
  if (
    typeof error?.message === "string" &&
    error.message.startsWith("CORS_BLOCKED:")
  ) {
    return res.status(403).json({
      data: {
        type: "error",
        message: `CORS blocked for origin ${req.headers.origin || "unknown"}`,
      },
    });
  }

  return next(error);
});

app.use("/api", routes);
app.use(express.static(path.join(__dirname, "public")));

 



app.listen(PORT, (req, res) => {
  console.log(`Server is running on PORT : ${PORT}`);
});
