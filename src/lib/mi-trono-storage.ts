const KEY = "tronito.miUltimoTronoId";

/** Recuerda que este navegador tomó el trono con esta fila de throne_history. */
export function recordarMiTrono(throneEntryId: string) {
  try {
    localStorage.setItem(KEY, throneEntryId);
  } catch {
    // localStorage puede fallar en modo privado; no es crítico.
  }
}

export function leerMiTrono(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function olvidarMiTrono() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // no-op
  }
}
