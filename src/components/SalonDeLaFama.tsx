import type { ThroneEntryDTO } from "@/lib/throne";
import { formatCLP } from "@/lib/format";

export function SalonDeLaFama({ entradas }: { entradas: ThroneEntryDTO[] }) {
  if (entradas.length === 0) {
    return (
      <p className="text-center text-sm text-neutral-500">
        Todavía nadie ha tomado el trono. Sé el primero.
      </p>
    );
  }

  return (
    <ol className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
      {entradas.map((entrada, i) => (
        <li key={entrada.id} className="flex items-center gap-4 p-4">
          <span className="w-8 shrink-0 text-center text-sm font-semibold text-neutral-400">
            #{i + 1}
          </span>
          {entrada.imagenUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entrada.imagenUrl}
              alt=""
              className="h-12 w-12 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="h-12 w-12 shrink-0 rounded-lg bg-neutral-100" />
          )}
          <div className="min-w-0 flex-1">
            <a
              href={entrada.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="block truncate font-medium text-neutral-900 hover:underline"
            >
              {entrada.titulo}
            </a>
            <p className="truncate text-sm text-neutral-500">{entrada.descripcion}</p>
          </div>
          <span className="shrink-0 font-semibold text-neutral-900">
            {formatCLP(entrada.montoPagado)}
          </span>
        </li>
      ))}
    </ol>
  );
}
