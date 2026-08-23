import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Next.js carga .env.local automáticamente, pero drizzle-kit corre fuera de
// Next y "dotenv/config" por defecto solo lee ".env" — hay que apuntarlo
// explícitamente a .env.local (que es donde vive el secreto real, gitignoreado).
config({ path: ".env.local" });

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
