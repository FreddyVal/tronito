import { describe, it, expect } from "vitest";
import { faviconUrl } from "./favicon";

describe("faviconUrl", () => {
  it("construye la URL del servicio de favicons a partir del hostname", () => {
    expect(faviconUrl("https://www.google.cl/algo?x=1")).toBe(
      "https://www.google.com/s2/favicons?domain=www.google.cl&sz=64",
    );
  });

  it("respeta el tamaño pedido", () => {
    expect(faviconUrl("https://example.com", 32)).toBe(
      "https://www.google.com/s2/favicons?domain=example.com&sz=32",
    );
  });

  it("retorna null si la URL es inválida", () => {
    expect(faviconUrl("no-es-una-url")).toBeNull();
  });
});
