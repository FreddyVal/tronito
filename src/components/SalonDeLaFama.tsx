"use client";

import { useEffect, useState } from "react";
import type { ThroneEntryDTO } from "@/lib/throne";
import { tiempoDesde } from "@/lib/format";
import { EntradaCard, CardFantasma } from "./EntradaCard";

const MIN_PUESTOS_MOSTRADOS = 3;

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

  const puestosFantasma = Math.max(0, MIN_PUESTOS_MOSTRADOS - entradas.length);

  return (
    <ol className="flex flex-col gap-4">
      {entradas.map((entrada, i) => {
        const esReyActual = entrada.id === reyActualId;
        return (
          <li key={entrada.id}>
            <EntradaCard
              entrada={entrada}
              rank={i + 1}
              destacado={esReyActual}
              tiempoLabel={tiempoDesde(new Date(entrada.paidAt), ahora)}
            />
          </li>
        );
      })}
      {Array.from({ length: puestosFantasma }).map((_, i) => (
        <li key={`fantasma-${i}`}>
          <CardFantasma rank={entradas.length + i + 1} />
        </li>
      ))}
    </ol>
  );
}
