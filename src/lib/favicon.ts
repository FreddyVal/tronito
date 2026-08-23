/**
 * Ícono automático a partir del dominio de destino, vía el servicio público
 * de favicons de Google. Sin backend propio; si falla, el componente que lo
 * usa debe caer a un placeholder (inicial del título).
 */
export function faviconUrl(url: string, size = 64): string | null {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=${size}`;
  } catch {
    return null;
  }
}
