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

interface Tema {
  bg: string;
  border: string;
  badgeBg: string;
  badgeText: string;
  acento: string;
  /** Animación de brillo tipo medalla — solo para el podio (#1, #2, #3). */
  animacion?: string;
}

function temaDeRank(rank: number): Tema {
  if (rank === 1) {
    // Oro
    return {
      bg: "#fdf6e3",
      border: "#e8c566",
      badgeBg: "#fef3c7",
      badgeText: "#c8860a",
      acento: "#c8860a",
      animacion: "brillo-dorado",
    };
  }
  if (rank === 2) {
    // Plata
    return {
      bg: "#f4f5f7",
      border: "#b6bac2",
      badgeBg: "#e5e7eb",
      badgeText: "#6b7280",
      acento: "#71767f",
      animacion: "brillo-plateado",
    };
  }
  if (rank === 3) {
    // Bronce
    return {
      bg: "#fbeee1",
      border: "#cd7f32",
      badgeBg: "#f3dcc3",
      badgeText: "#a15c2e",
      acento: "#a15c2e",
      animacion: "brillo-bronce",
    };
  }
  return { bg: "#fafafa", border: "#d0d0d0", badgeBg: "#e0e0e0", badgeText: "#888888", acento: "#888888" };
}

/** Ícono con fallback en cascada: imagen propia -> favicon del sitio -> inicial del título. */
function Avatar({ entrada }: { entrada: EntradaCardData }) {
  const favicon = faviconUrl(entrada.url);
  const [src, setSrc] = useState(entrada.imagenUrl || favicon);

  if (!src) {
    return (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-neutral-400">
        {entrada.titulo.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="h-5 w-5 shrink-0 rounded-full object-cover"
      onError={() => setSrc(src === entrada.imagenUrl && favicon ? favicon : null)}
    />
  );
}

export function EntradaCard({ entrada, rank, tiempoLabel, destacado }: Props) {
  const tema = temaDeRank(rank);
  let hostname = entrada.url;
  try {
    hostname = new URL(entrada.url).hostname;
  } catch {
    // deja la url tal cual si no es parseable
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 ${tema.animacion ? "brillo-medalla" : ""}`}
      style={{
        background: tema.bg,
        border: `2px solid ${tema.border}`,
        animation: tema.animacion ? `${tema.animacion} 2.8s ease-in-out infinite` : undefined,
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute right-4 bottom-2 text-[4.5rem] leading-none font-black select-none"
        style={{ color: tema.border, opacity: 0.12 }}
      >
        #{rank}
      </span>

      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="rounded-md px-2 py-0.5 text-[0.7rem] font-bold"
            style={{ background: tema.badgeBg, color: tema.badgeText }}
          >
            #{rank}
          </span>
          <Avatar entrada={entrada} />
          <span className="text-[0.72rem] text-neutral-400">
            {destacado ? `en el #1 ${tiempoLabel}` : tiempoLabel}
          </span>
        </div>
        <span className="text-[0.85rem] font-bold" style={{ color: tema.acento }}>
          {formatCLP(entrada.montoPagado)}
        </span>
      </div>

      <p className="mb-1 truncate text-base font-bold text-neutral-900">{entrada.titulo}</p>
      <p className="mb-3 line-clamp-2 text-[0.82rem] leading-snug text-neutral-500">
        {entrada.descripcion}
      </p>

      <hr className="mb-3 w-8 border-t-[1.5px]" style={{ borderColor: tema.border }} />

      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-[0.72rem] text-neutral-400">{hostname}</span>
        <a
          href={entrada.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex shrink-0 items-center gap-1 text-[0.85rem] font-semibold hover:opacity-60"
          style={{ color: tema.acento }}
        >
          {entrada.textoBoton} <span aria-hidden>→</span>
        </a>
      </div>
    </div>
  );
}

/** Puesto vacío decorativo: no es un registro real, solo invita a ocuparlo. */
export function CardFantasma({ rank }: { rank: number }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5"
      style={{ background: "#fafafa", border: "2px solid #d0d0d0" }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute right-4 bottom-2 text-[4.5rem] leading-none font-black text-[#d0d0d0] opacity-12 select-none"
      >
        #{rank}
      </span>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-[#e0e0e0] px-2 py-0.5 text-[0.7rem] font-bold text-[#888]">
            #{rank}
          </span>
        </div>
        <span className="text-[0.85rem] font-bold text-neutral-400">—</span>
      </div>
      <p className="mt-2 text-base font-bold text-neutral-400">Disponible</p>
    </div>
  );
}
