"use client";

import { useEffect, useState } from "react";
import type { ThroneEntryDTO } from "@/lib/throne";
import { formatCLP, tiempoDesde } from "@/lib/format";

interface Props {
  entradas: ThroneEntryDTO[];
  /** id de la fila que es rey en vivo ahora mismo, o null si el trono está
   * vacante (tablero vacío, o el rey real está oculto por moderación). No
   * asumas que entradas[0] es el rey — con moderación puede no serlo. */
  reyActualId: string | null;
}

export function SalonDeLaFama({ entradas, reyActualId }: Props) {
  // El "hace X" se recalcula cada minuto para que no quede pegado.
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (entradas.length === 0) {
    return (
      <p className="text-center text-sm text-neutral-500">
        Todavía nadie ha tomado el trono. Sé el primero.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {entradas.map((entrada, i) => {
        const esReyActual = entrada.id === reyActualId;
        return (
          <li
            key={entrada.id}
            className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
              esReyActual ? "border-amber-300 ring-1 ring-amber-200" : "border-neutral-200"
            }`}
          >
            <div className="flex items-center gap-3 p-4">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  esReyActual ? "bg-amber-400 text-amber-950" : "bg-neutral-100 text-neutral-500"
                }`}
              >
                #{i + 1}
              </span>

              {entrada.imagenUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={entrada.imagenUrl}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-400">
                  {entrada.titulo.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-xs text-neutral-400">
                  {esReyActual ? "en el #1 " : ""}
                  {tiempoDesde(new Date(entrada.paidAt), ahora)}
                </p>
                <p className="truncate font-semibold text-neutral-900">{entrada.titulo}</p>
              </div>

              <span className="shrink-0 font-bold text-neutral-900">
                {formatCLP(entrada.montoPagado)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-neutral-100 px-4 py-2.5">
              <p className="truncate text-sm text-neutral-500">{entrada.descripcion}</p>
              <a
                href={entrada.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex shrink-0 items-center gap-1 text-sm font-medium text-neutral-700 hover:underline"
              >
                Ver <span aria-hidden>→</span>
              </a>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
