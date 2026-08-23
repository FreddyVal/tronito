const clpFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export function formatCLP(monto: number): string {
  return clpFormatter.format(monto);
}

/** "hace 9 h", "hace 1 d", "hace 3 min", "hace instantes". */
export function tiempoDesde(fecha: Date, ahora: Date = new Date()): string {
  const segundos = Math.max(0, Math.floor((ahora.getTime() - fecha.getTime()) / 1000));

  if (segundos < 60) return "hace instantes";

  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;

  const dias = Math.floor(horas / 24);
  if (dias < 30) return `hace ${dias} d`;

  const meses = Math.floor(dias / 30);
  return `hace ${meses} mes${meses === 1 ? "" : "es"}`;
}
