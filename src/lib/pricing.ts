/**
 * Motor de precios de Tronito. Función pura, sin acceso a DB ni reloj propio
 * (recibe `ahora` como parámetro) para que el mismo código corra en el
 * servidor (fuente de verdad) y en el cliente (animación local entre polls).
 *
 * Nunca confíes en un precio calculado por el cliente para procesar un pago:
 * el servidor SIEMPRE recalcula antes de crear la preferencia de MercadoPago.
 */

export type CurvaDecaimiento = "exponencial" | "lineal";

export interface PricingConfig {
  precioInicial: number;
  pisoMinimoAbsoluto: number;
  /** Basis points: 2000 = 20.00% */
  pisoPorcentajeBp: number;
  /** Basis points: 500 = 5.00% */
  porcentajeIncrementoBp: number;
  montoIncrementoMinimo: number;
  duracionVentanaProtegidaMin: number;
  tiempoParaLlegarAlPisoHoras: number;
  curvaDecaimiento: CurvaDecaimiento;
}

export interface UltimaCompra {
  monto: number;
  timestamp: Date;
}

/** Constante de forma de la curva exponencial: fija en código, no configurable. */
const EXP_LAMBDA = 4;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Fracción de decaimiento restante en [0, 1]. 1 = recién terminó la ventana
 * protegida (precio en su punto más alto), 0 = llegó al piso.
 */
function factorDecaimiento(fraction: number, curva: CurvaDecaimiento): number {
  if (curva === "lineal") {
    return 1 - fraction;
  }
  // Exponencial: cae rápido al inicio, se aplana cerca del piso.
  // Normalizado para que factor(0) = 1 y factor(1) = 0 exactamente.
  const num = Math.exp(-EXP_LAMBDA * fraction) - Math.exp(-EXP_LAMBDA);
  const den = 1 - Math.exp(-EXP_LAMBDA);
  return num / den;
}

/**
 * Calcula el precio vigente para robar el #1.
 *
 * - Si no hay historial (`ultimaCompra` es null), retorna `precioInicial`.
 * - Justo tras una compra por P, el precio salta a P + incremento y se
 *   mantiene así durante la ventana protegida.
 * - Pasada la ventana, decae hacia el piso a lo largo de
 *   `tiempoParaLlegarAlPisoHoras`, según la curva configurada.
 * - El piso es `max(pisoMinimoAbsoluto, pisoPorcentaje * P)`, siempre
 *   calculado sobre P (el último monto realmente pagado), no sobre P+incremento.
 */
export function calcularPrecioVigente(
  config: PricingConfig,
  ultimaCompra: UltimaCompra | null,
  ahora: Date,
): number {
  if (!ultimaCompra) {
    return Math.round(config.precioInicial);
  }

  const P = ultimaCompra.monto;
  const incremento = Math.max(
    (config.porcentajeIncrementoBp / 10_000) * P,
    config.montoIncrementoMinimo,
  );
  const precioTrasVenta = P + incremento;
  const piso = Math.max(
    config.pisoMinimoAbsoluto,
    (config.pisoPorcentajeBp / 10_000) * P,
  );

  const elapsedMs = ahora.getTime() - ultimaCompra.timestamp.getTime();
  const elapsedMin = elapsedMs / 60_000;

  if (elapsedMin <= config.duracionVentanaProtegidaMin) {
    return Math.round(precioTrasVenta);
  }

  const decayElapsedMin = elapsedMin - config.duracionVentanaProtegidaMin;
  const totalDecayMin = config.tiempoParaLlegarAlPisoHoras * 60;
  const fraction = totalDecayMin > 0 ? clamp(decayElapsedMin / totalDecayMin, 0, 1) : 1;

  const factor = factorDecaimiento(fraction, config.curvaDecaimiento);
  const precio = piso + (precioTrasVenta - piso) * factor;

  return Math.round(Math.max(precio, piso));
}

/** Precio para robar justo después de que alguien pague `monto`. Útil para previews en la UI. */
export function calcularPrecioTrasCompra(config: PricingConfig, monto: number): number {
  const incremento = Math.max(
    (config.porcentajeIncrementoBp / 10_000) * monto,
    config.montoIncrementoMinimo,
  );
  return Math.round(monto + incremento);
}
