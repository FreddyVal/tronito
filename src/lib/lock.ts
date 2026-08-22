/**
 * Bloqueo duro y opcional: mientras está activo, nadie puede robar el #1
 * durante 1 hora tras cada coronación, sin importar cuánto paguen. Distinto
 * de la ventana protegida del motor de precios (esa solo evita que el precio
 * baje; el trono sigue siendo robable en cualquier momento).
 *
 * Función pura (mismo patrón que pricing.ts) para poder testearla sin DB.
 */

const UNA_HORA_MS = 60 * 60_000;

export interface EstadoBloqueo {
  bloqueado: boolean;
  /** Instante en que se levanta el bloqueo. null si no hay bloqueo vigente. */
  bloqueadoHasta: Date | null;
}

export function calcularBloqueo(
  activo: boolean,
  ultimaCompra: { timestamp: Date } | null,
  ahora: Date,
): EstadoBloqueo {
  if (!activo || !ultimaCompra) {
    return { bloqueado: false, bloqueadoHasta: null };
  }

  const bloqueadoHasta = new Date(ultimaCompra.timestamp.getTime() + UNA_HORA_MS);
  return { bloqueado: ahora < bloqueadoHasta, bloqueadoHasta };
}
