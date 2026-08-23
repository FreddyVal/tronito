"use client";

import { useState } from "react";
import { formatCLP } from "@/lib/format";
import { faviconUrl } from "@/lib/favicon";

export interface EntradaCardData {
  titulo: string;
  descripcion: string;
  textoBoton: string;
  url: string;
  imagenUrl: string | null;
  montoPagado: number;
}

interface Props {
  entrada: EntradaCardData;
  rank: number;
  tiempoLabel: string;
  destacado: boolean;
}

/** Ícono con fallback en cascada: imagen propia -> favicon del sitio -> inicial del título. */
function Avatar({ entrada }: { entrada: EntradaCardData }) {
  const favicon = faviconUrl(entrada.url);
  const [src, setSrc] = useState(entrada.imagenUrl || favicon);

  if (!src) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-400">
        {entrada.titulo.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="h-9 w-9 shrink-0 rounded-full border border-neutral-100 object-cover"
      onError={() => setSrc(src === entrada.imagenUrl && favicon ? favicon : null)}
    />
  );
}

export function EntradaCard({ entrada, rank, tiempoLabel, destacado }: Props) {
  let hostname = entrada.url;
  try {
    hostname = new URL(entrada.url).hostname;
  } catch {
    // deja la url tal cual si no es parseable
  }

  return (
    <div
      className={`grid grid-cols-[2.5rem_2.5rem_1fr] items-center gap-4 rounded-2xl bg-white p-5 sm:grid-cols-[2.5rem_2.5rem_1fr_auto] ${
        destacado ? "ring-2 ring-amber-300" : "shadow-sm"
      }`}
    >
      <span
        className={`text-2xl font-bold ${destacado ? "text-amber-500" : "text-neutral-300"}`}
      >
        #{rank}
      </span>

      <Avatar entrada={entrada} />

      <div className="min-w-0">
        <p className="text-xs text-neutral-400">{tiempoLabel}</p>
        <p className="truncate font-semibold text-neutral-900">{entrada.titulo}</p>
        <p className="truncate text-sm text-neutral-500">{entrada.descripcion}</p>
        <a
          href={entrada.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="mt-1 inline-block text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
        >
          {entrada.textoBoton} <span aria-hidden>→</span>
        </a>
      </div>

      <span className="col-span-3 justify-self-end text-lg font-bold text-neutral-900 sm:col-span-1">
        {formatCLP(entrada.montoPagado)}
      </span>

      <span className="sr-only">{hostname}</span>
    </div>
  );
}
