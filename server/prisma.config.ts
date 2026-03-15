/// <reference types="node" />
import { defineConfig } from "prisma/config";

try {
  process.loadEnvFile?.();
} catch {}

export default defineConfig({
  schema: "prisma/schema.prisma",
  engine: "classic",
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
