import { describe, it, expect } from "vitest";
import { calcularPrecioVigente, calcularPrecioTrasCompra, type PricingConfig } from "./pricing";

const baseConfig: PricingConfig = {
  precioInicial: 2000,
  pisoMinimoAbsoluto: 2000,
  pisoPorcentajeBp: 2000, // 20%
  porcentajeIncrementoBp: 500, // 5%
  montoIncrementoMinimo: 500,
  duracionVentanaProtegidaMin: 30,
  tiempoParaLlegarAlPisoHoras: 12,
  curvaDecaimiento: "exponencial",
};

describe("calcularPrecioVigente", () => {
  it("retorna precioInicial cuando el tablero está vacío", () => {
    const ahora = new Date("2026-01-01T00:00:00Z");
    expect(calcularPrecioVigente(baseConfig, null, ahora)).toBe(2000);
  });

  it("usa monto_incremento_minimo cuando el porcentaje da menos que el mínimo", () => {
    // P = 2000, 5% = 100, pero el mínimo es 500 -> precio tras venta = 2500
    const compra = { monto: 2000, timestamp: new Date("2026-01-01T00:00:00Z") };
    const ahora = new Date("2026-01-01T00:05:00Z"); // dentro de la ventana
    expect(calcularPrecioVigente(baseConfig, compra, ahora)).toBe(2500);
  });

  it("usa el porcentaje cuando supera al mínimo", () => {
    // P = 20000, 5% = 1000 > 500 -> precio tras venta = 21000
    const compra = { monto: 20000, timestamp: new Date("2026-01-01T00:00:00Z") };
    const ahora = new Date("2026-01-01T00:05:00Z");
    expect(calcularPrecioVigente(baseConfig, compra, ahora)).toBe(21000);
  });

  it("no baja durante la ventana protegida", () => {
    const compra = { monto: 10000, timestamp: new Date("2026-01-01T00:00:00Z") };
    const justoAntesDeQueTermine = new Date("2026-01-01T00:30:00Z"); // == 30 min, inclusive
    expect(calcularPrecioVigente(baseConfig, compra, justoAntesDeQueTermine)).toBe(
      calcularPrecioTrasCompra(baseConfig, 10000),
    );
  });

  it("decae linealmente cuando la curva es lineal", () => {
    const config: PricingConfig = { ...baseConfig, curvaDecaimiento: "lineal" };
    const P = 10000;
    const compra = { monto: P, timestamp: new Date("2026-01-01T00:00:00Z") };
    const precioTrasVenta = calcularPrecioTrasCompra(config, P);
    const piso = Math.max(config.pisoMinimoAbsoluto, (config.pisoPorcentajeBp / 10_000) * P);

    // A mitad de camino del decaimiento (30min ventana + 6h de 12h totales)
    const mitad = new Date("2026-01-01T06:30:00Z");
    const esperadoMitad = Math.round(piso + (precioTrasVenta - piso) * 0.5);
    expect(calcularPrecioVigente(config, compra, mitad)).toBe(esperadoMitad);

    // Al llegar exactamente al final del decaimiento -> piso exacto
    const final = new Date("2026-01-01T12:30:00Z");
    expect(calcularPrecioVigente(config, compra, final)).toBe(Math.round(piso));

    // Mucho después de llegar al piso -> se mantiene en el piso
    const muchoDespues = new Date("2026-01-05T00:00:00Z");
    expect(calcularPrecioVigente(config, compra, muchoDespues)).toBe(Math.round(piso));
  });

  it("decae exponencialmente y llega exactamente al piso en fraction=1", () => {
    const P = 10000;
    const compra = { monto: P, timestamp: new Date("2026-01-01T00:00:00Z") };
    const piso = Math.max(baseConfig.pisoMinimoAbsoluto, (baseConfig.pisoPorcentajeBp / 10_000) * P);

    const final = new Date("2026-01-01T12:30:00Z"); // 30min ventana + 12h decaimiento
    expect(calcularPrecioVigente(baseConfig, compra, final)).toBe(Math.round(piso));
  });

  it("la curva exponencial cae más rápido al inicio que la lineal (misma fracción)", () => {
    const P = 10000;
    const compra = { monto: P, timestamp: new Date("2026-01-01T00:00:00Z") };
    const configExp = baseConfig;
    const configLin: PricingConfig = { ...baseConfig, curvaDecaimiento: "lineal" };

    // 10% del tiempo de decaimiento transcurrido
    const t = new Date("2026-01-01T01:42:00Z"); // 30min ventana + 1.2h (10% de 12h)
    const precioExp = calcularPrecioVigente(configExp, compra, t);
    const precioLin = calcularPrecioVigente(configLin, compra, t);
    expect(precioExp).toBeLessThan(precioLin);
  });

  it("el piso usa piso_minimo_absoluto cuando el porcentaje da menos", () => {
    // P = 5000, 20% = 1000 < piso_minimo_absoluto 2000 -> piso = 2000
    const compra = { monto: 5000, timestamp: new Date("2026-01-01T00:00:00Z") };
    const final = new Date("2026-01-01T12:30:00Z");
    expect(calcularPrecioVigente(baseConfig, compra, final)).toBe(2000);
  });

  it("el piso usa el porcentaje cuando supera al mínimo absoluto", () => {
    // P = 50000, 20% = 10000 > piso_minimo_absoluto 2000 -> piso = 10000
    const compra = { monto: 50000, timestamp: new Date("2026-01-01T00:00:00Z") };
    const final = new Date("2026-01-01T12:30:00Z");
    expect(calcularPrecioVigente(baseConfig, compra, final)).toBe(10000);
  });

  it("nunca retorna un precio por debajo del piso", () => {
    const compra = { monto: 10000, timestamp: new Date("2026-01-01T00:00:00Z") };
    const muyLejos = new Date("2027-01-01T00:00:00Z");
    const piso = Math.max(baseConfig.pisoMinimoAbsoluto, (baseConfig.pisoPorcentajeBp / 10_000) * 10000);
    expect(calcularPrecioVigente(baseConfig, compra, muyLejos)).toBeGreaterThanOrEqual(piso);
  });
});
