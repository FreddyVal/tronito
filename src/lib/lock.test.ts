import { describe, it, expect } from "vitest";
import { calcularBloqueo } from "./lock";

describe("calcularBloqueo", () => {
  it("no bloquea si el interruptor está apagado, aunque haya compra reciente", () => {
    const ultimaCompra = { timestamp: new Date("2026-01-01T00:00:00Z") };
    const ahora = new Date("2026-01-01T00:05:00Z");
    expect(calcularBloqueo(false, ultimaCompra, ahora)).toEqual({
      bloqueado: false,
      bloqueadoHasta: null,
    });
  });

  it("no bloquea si el tablero está vacío", () => {
    const ahora = new Date("2026-01-01T00:00:00Z");
    expect(calcularBloqueo(true, null, ahora)).toEqual({ bloqueado: false, bloqueadoHasta: null });
  });

  it("bloquea dentro de la primera hora tras la compra", () => {
    const ultimaCompra = { timestamp: new Date("2026-01-01T00:00:00Z") };
    const ahora = new Date("2026-01-01T00:59:59Z");
    const resultado = calcularBloqueo(true, ultimaCompra, ahora);
    expect(resultado.bloqueado).toBe(true);
    expect(resultado.bloqueadoHasta).toEqual(new Date("2026-01-01T01:00:00Z"));
  });

  it("deja de bloquear exactamente al cumplirse la hora", () => {
    const ultimaCompra = { timestamp: new Date("2026-01-01T00:00:00Z") };
    const ahora = new Date("2026-01-01T01:00:00Z");
    expect(calcularBloqueo(true, ultimaCompra, ahora).bloqueado).toBe(false);
  });

  it("no bloquea mucho después de la hora", () => {
    const ultimaCompra = { timestamp: new Date("2026-01-01T00:00:00Z") };
    const ahora = new Date("2026-01-02T00:00:00Z");
    expect(calcularBloqueo(true, ultimaCompra, ahora).bloqueado).toBe(false);
  });
});
