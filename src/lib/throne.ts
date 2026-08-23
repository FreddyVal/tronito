import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { throneHistory } from "@/db/schema";
import { getConfig, toPricingConfig } from "./config";
import { calcularPrecioVigente, type PricingConfig } from "./pricing";
import { calcularBloqueo } from "./lock";

export type ThroneRow = typeof throneHistory.$inferSelect;

/** Forma segura para el cliente: fechas como string ISO, sin campos internos (mp_payment_id). */
export interface ThroneEntryDTO {
  id: string;
  titulo: string;
  descripcion: string;
  textoBoton: string;
  url: string;
  imagenUrl: string | null;
  montoPagado: number;
  paidAt: string;
}

export interface EstadoTrono {
  config: PricingConfig;
  subastaPausada: boolean;
  precioVigente: number;
  /** Bloqueo duro (distinto de la ventana protegida): mientras está activo,
   * nadie puede robar el #1, sin importar cuánto pague. */
  bloqueado: boolean;
  bloqueadoHasta: string | null;
  /** Rey mostrado públicamente. null si el tablero está vacío O si la última
   * toma fue ocultada por moderación (el trono se muestra vacante, no se
   * "reasigna" a un rey anterior). */
  reyActual: ThroneEntryDTO | null;
  /** Solo monto/fecha del último pago real (aunque esté oculto), para que el
   * cliente pueda animar el decaimiento localmente sin exponer contenido
   * moderado. */
  ultimaCompraBase: { monto: number; timestamp: string } | null;
  /** El "Salón de la fama": la entrada con el monto pagado más alto de toda
   * la historia (récord). Se recalcula en cada lectura — si alguien paga más
   * que el récord actual, pasa a ser la nueva. */
  recordHistorico: ThroneEntryDTO | null;
  /** Historial de tomas del #1, ordenado por fecha (más reciente primero).
   * El precio del #1 sube y baja con el tiempo, así que este orden NO es por
   * monto pagado — puede coincidir con recordHistorico o no. */
  historial: ThroneEntryDTO[];
  ahora: string;
}

function toDTO(row: ThroneRow): ThroneEntryDTO {
  return {
    id: row.id,
    titulo: row.titulo,
    descripcion: row.descripcion,
    textoBoton: row.textoBoton,
    url: row.url,
    imagenUrl: row.imagenUrl,
    montoPagado: row.montoPagado,
    paidAt: row.paidAt.toISOString(),
  };
}

export async function getEstadoTrono(): Promise<EstadoTrono> {
  const configRow = await getConfig();
  const pricingConfig = toPricingConfig(configRow);

  // El motor de precios siempre se basa en el último pago REAL, esté oculto o no:
  // el precio refleja plata efectivamente pagada, la moderación solo afecta visibilidad.
  const ultimaFilaRows = await db
    .select()
    .from(throneHistory)
    .orderBy(desc(throneHistory.paidAt))
    .limit(1);
  const ultimaFila = ultimaFilaRows[0] ?? null;

  const reyActual = ultimaFila && !ultimaFila.oculto ? toDTO(ultimaFila) : null;

  const recordHistoricoRows = await db
    .select()
    .from(throneHistory)
    .where(eq(throneHistory.oculto, false))
    .orderBy(desc(throneHistory.montoPagado))
    .limit(1);
  const recordHistorico = recordHistoricoRows[0] ? toDTO(recordHistoricoRows[0]) : null;

  const historialRows = await db
    .select()
    .from(throneHistory)
    .where(eq(throneHistory.oculto, false))
    .orderBy(desc(throneHistory.paidAt));

  const ahora = new Date();
  const precioVigente = calcularPrecioVigente(
    pricingConfig,
    ultimaFila ? { monto: ultimaFila.montoPagado, timestamp: ultimaFila.paidAt } : null,
    ahora,
  );

  // El bloqueo, igual que el precio, se basa en el último pago REAL (esté
  // oculto o no) — protege el puesto pagado, no solo lo que se muestra.
  const { bloqueado, bloqueadoHasta } = calcularBloqueo(
    configRow.bloqueoUnaHoraActivo,
    ultimaFila ? { timestamp: ultimaFila.paidAt } : null,
    ahora,
  );

  return {
    config: pricingConfig,
    subastaPausada: configRow.subastaPausada,
    precioVigente,
    bloqueado,
    bloqueadoHasta: bloqueadoHasta ? bloqueadoHasta.toISOString() : null,
    reyActual,
    ultimaCompraBase: ultimaFila
      ? { monto: ultimaFila.montoPagado, timestamp: ultimaFila.paidAt.toISOString() }
      : null,
    recordHistorico,
    historial: historialRows.map(toDTO),
    ahora: ahora.toISOString(),
  };
}
