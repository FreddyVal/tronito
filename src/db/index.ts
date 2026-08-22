import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "./schema";

// Lazy: no conectar (ni fallar) al cargar el módulo. `next build` importa
// los route handlers para generar el manifest sin ejecutar queries reales,
// así que solo queremos fallar cuando de verdad se intenta usar la DB.
const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? "" });

export const db = drizzle(pool, { schema });
export { pool };
