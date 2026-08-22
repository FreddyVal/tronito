import { defineConfig } from "drizzle-kit";
import "dotenv/config";

// DATABASE_URL solo hace falta para "migrate"/"studio" (comandos que se
// conectan de verdad). "generate" solo lee schema.ts, así que no bloqueamos
// acá — drizzle-kit falla con un mensaje claro si migrate/studio la necesitan
// y no está seteada.
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
