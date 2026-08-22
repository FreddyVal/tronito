import { z } from "zod";
import { db } from "@/db";
import { config as configTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { PricingConfig } from "./pricing";

const CONFIG_ID = 1;

/** Rangos válidos para las perillas, usados tanto en el form de admin como en el servidor. */
export const configInputSchema = z.object({
  precioInicial: z.number().int().min(1).max(100_000_000),
  pisoMinimoAbsoluto: z.number().int().min(1).max(100_000_000),
  pisoPorcentaje: z.number().min(0).max(100), // porcentaje humano, ej. 20 = 20%
  porcentajeIncremento: z.number().min(0).max(1000), // porcentaje humano, ej. 5 = 5%
  montoIncrementoMinimo: z.number().int().min(0).max(100_000_000),
  duracionVentanaProtegidaMin: z.number().int().min(0).max(60 * 24 * 30),
  tiempoParaLlegarAlPisoHoras: z.number().int().min(1).max(24 * 365),
  curvaDecaimiento: z.enum(["exponencial", "lineal"]),
  subastaPausada: z.boolean(),
  bloqueoUnaHoraActivo: z.boolean(),
});

export type ConfigInput = z.infer<typeof configInputSchema>;

export type ConfigRow = typeof configTable.$inferSelect;

/** Lee la fila de config, creándola con defaults si todavía no existe. */
export async function getConfig(): Promise<ConfigRow> {
  const rows = await db.select().from(configTable).where(eq(configTable.id, CONFIG_ID));
  if (rows[0]) return rows[0];

  const inserted = await db
    .insert(configTable)
    .values({ id: CONFIG_ID })
    .onConflictDoNothing()
    .returning();

  if (inserted[0]) return inserted[0];

  // Otra request la insertó justo antes: releer.
  const retry = await db.select().from(configTable).where(eq(configTable.id, CONFIG_ID));
  if (!retry[0]) throw new Error("No se pudo leer ni crear la fila de config");
  return retry[0];
}

export async function updateConfig(input: ConfigInput): Promise<ConfigRow> {
  const parsed = configInputSchema.parse(input);

  const updated = await db
    .update(configTable)
    .set({
      precioInicial: parsed.precioInicial,
      pisoMinimoAbsoluto: parsed.pisoMinimoAbsoluto,
      pisoPorcentajeBp: Math.round(parsed.pisoPorcentaje * 100),
      porcentajeIncrementoBp: Math.round(parsed.porcentajeIncremento * 100),
      montoIncrementoMinimo: parsed.montoIncrementoMinimo,
      duracionVentanaProtegidaMin: parsed.duracionVentanaProtegidaMin,
      tiempoParaLlegarAlPisoHoras: parsed.tiempoParaLlegarAlPisoHoras,
      curvaDecaimiento: parsed.curvaDecaimiento,
      subastaPausada: parsed.subastaPausada,
      bloqueoUnaHoraActivo: parsed.bloqueoUnaHoraActivo,
      updatedAt: new Date(),
    })
    .where(eq(configTable.id, CONFIG_ID))
    .returning();

  if (!updated[0]) throw new Error("No existe la fila de config a actualizar");
  return updated[0];
}

/** Convierte la fila de DB (basis points) al formato humano que edita el panel de admin. */
export function toConfigInput(row: ConfigRow): ConfigInput {
  return {
    precioInicial: row.precioInicial,
    pisoMinimoAbsoluto: row.pisoMinimoAbsoluto,
    pisoPorcentaje: row.pisoPorcentajeBp / 100,
    porcentajeIncremento: row.porcentajeIncrementoBp / 100,
    montoIncrementoMinimo: row.montoIncrementoMinimo,
    duracionVentanaProtegidaMin: row.duracionVentanaProtegidaMin,
    tiempoParaLlegarAlPisoHoras: row.tiempoParaLlegarAlPisoHoras,
    curvaDecaimiento: row.curvaDecaimiento === "lineal" ? "lineal" : "exponencial",
    subastaPausada: row.subastaPausada,
    bloqueoUnaHoraActivo: row.bloqueoUnaHoraActivo,
  };
}

/** Convierte la fila de DB (basis points enteros) al formato que espera el motor de precios. */
export function toPricingConfig(row: ConfigRow): PricingConfig {
  return {
    precioInicial: row.precioInicial,
    pisoMinimoAbsoluto: row.pisoMinimoAbsoluto,
    pisoPorcentajeBp: row.pisoPorcentajeBp,
    porcentajeIncrementoBp: row.porcentajeIncrementoBp,
    montoIncrementoMinimo: row.montoIncrementoMinimo,
    duracionVentanaProtegidaMin: row.duracionVentanaProtegidaMin,
    tiempoParaLlegarAlPisoHoras: row.tiempoParaLlegarAlPisoHoras,
    curvaDecaimiento: row.curvaDecaimiento === "lineal" ? "lineal" : "exponencial",
  };
}
