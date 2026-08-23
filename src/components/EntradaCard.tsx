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
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-400">
        {entrada.titulo.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="h-10 w-10 shrink-0 rounded-full border border-neutral-100 object-cover"
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
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
        destacado ? "border-amber-300 ring-1 ring-amber-200" : "border-neutral-200"
      }`}
    >
      <div className="flex items-center gap-3 p-4">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            destacado ? "bg-amber-400 text-amber-950" : "bg-neutral-100 text-neutral-500"
          }`}
        >
          #{rank}
        </span>

        <Avatar entrada={entrada} />

        <div className="min-w-0 flex-1">
          <p className="text-xs text-neutral-400">{tiempoLabel}</p>
          <p className="truncate font-semibold text-neutral-900">{entrada.titulo}</p>
        </div>

        <span className="shrink-0 font-bold text-neutral-900">{formatCLP(entrada.montoPagado)}</span>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-neutral-100 px-4 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm text-neutral-500">{entrada.descripcion}</p>
          <p className="truncate text-xs text-neutral-400">{hostname}</p>
        </div>
        <a
          href={entrada.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
        >
          {entrada.textoBoton} <span aria-hidden>→</span>
        </a>
      </div>
    </div>
  );
}
