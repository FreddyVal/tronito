"use client";

import { useState, type FormEvent } from "react";
import { formatCLP } from "@/lib/format";

interface Props {
  montoElegido: number;
  subastaPausada: boolean;
  onCerrar: () => void;
}

export function FormularioRobar({ montoElegido, subastaPausada, onCerrar }: Props) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [url, setUrl] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/robar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          descripcion,
          url,
          imagenUrl: imagenUrl || undefined,
          montoElegido,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar el pago");
        setEnviando(false);
        return;
      }
      window.location.href = data.initPoint;
    } catch {
      setError("Error de red. Intenta de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900">Roba el #1</h2>
          <button
            onClick={onCerrar}
            className="text-neutral-400 hover:text-neutral-700"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {subastaPausada ? (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            La subasta está pausada por el momento. Vuelve más tarde.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <p className="text-sm text-neutral-600">
              Tu oferta: <span className="font-semibold text-neutral-900">{formatCLP(montoElegido)}</span>.
              Si el precio subió mientras completabas esto, te avisamos antes de cobrarte.
            </p>

            <div>
              <label className="block text-sm font-medium text-neutral-700">Título</label>
              <input
                required
                maxLength={120}
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                placeholder="Mi anuncio"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700">Descripción</label>
              <textarea
                required
                maxLength={500}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                rows={3}
                placeholder="De qué se trata"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700">
                URL de destino
              </label>
              <input
                required
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700">
                URL de imagen (opcional)
              </label>
              <input
                type="url"
                value={imagenUrl}
                onChange={(e) => setImagenUrl(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                placeholder="https://..."
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
            >
              {enviando ? "Redirigiendo a MercadoPago…" : `Pagar ${formatCLP(montoElegido)} y robar el #1`}
            </button>

            <p className="text-center text-xs text-neutral-400">
              Al pagar aceptas los{" "}
              <a href="/terminos" target="_blank" className="underline">
                términos y condiciones
              </a>
              . Pago no reembolsable.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
