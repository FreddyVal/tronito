import { describe, it, expect } from "vitest";
import { tiempoDesde } from "./format";

describe("tiempoDesde", () => {
  const ahora = new Date("2026-01-02T12:00:00Z");

  it("muestra 'hace instantes' bajo un minuto", () => {
    expect(tiempoDesde(new Date("2026-01-02T11:59:30Z"), ahora)).toBe("hace instantes");
  });

  it("muestra minutos", () => {
    expect(tiempoDesde(new Date("2026-01-02T11:45:00Z"), ahora)).toBe("hace 15 min");
  });

  it("muestra horas", () => {
    expect(tiempoDesde(new Date("2026-01-02T03:00:00Z"), ahora)).toBe("hace 9 h");
  });

  it("muestra días", () => {
    expect(tiempoDesde(new Date("2025-12-30T12:00:00Z"), ahora)).toBe("hace 3 d");
  });

  it("muestra meses", () => {
    expect(tiempoDesde(new Date("2025-10-01T12:00:00Z"), ahora)).toBe("hace 3 meses");
  });
});
