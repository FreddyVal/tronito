"use client";

import { useEffect, useState } from "react";
import type { ThroneEntryDTO } from "@/lib/throne";
import { tiempoDesde } from "@/lib/format";
import { EntradaCard } from "./EntradaCard";

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
        const tiempo = tiempoDesde(new Date(entrada.paidAt), ahora);
        return (
          <li key={entrada.id}>
            <EntradaCard
              entrada={entrada}
              rank={i + 1}
              destacado={esReyActual}
              tiempoLabel={esReyActual ? `en el #1 ${tiempo}` : tiempo}
            />
          </li>
        );
      })}
    </ol>
  );
}
