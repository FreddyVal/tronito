"use client";

import { useState } from "react";
import { formatCLP } from "@/lib/format";
import { EntradaCard } from "./EntradaCard";

interface Props {
  /** Precio vigente en el servidor al abrir el formulario: piso del stepper del paso 3. */
  precioVigente: number;
  /** Monto ya elegido en el stepper de la home, usado como punto de partida del paso 3. */
  montoInicial: number;
  subastaPausada: boolean;
  onCerrar: () => void;
}

type Plataforma = "instagram" | "x" | "youtube" | "externo";

const PREFIJOS: Record<Plataforma, string> = {
  instagram: "instagram.com/",
  x: "x.com/",
  youtube: "youtube.com/",
  externo: "",
};

const PASO_OFERTA = 1000;
const TOTAL_PASOS = 3;

function IconoInstagram() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconoX() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" aria-hidden>
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}

function IconoYoutube() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10.5 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconoLink() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L12.5 19.5" />
    </svg>
  );
}

const ICONOS: Record<Plataforma, () => React.JSX.Element> = {
  instagram: IconoInstagram,
  x: IconoX,
  youtube: IconoYoutube,
  externo: IconoLink,
};

function IconoTile({ plataforma, seleccionado }: { plataforma: Plataforma; seleccionado: boolean }) {
  const Icono = ICONOS[plataforma];
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
        seleccionado ? "bg-[#1a3a6b] text-white" : "bg-neutral-100 text-neutral-500"
      }`}
    >
      <Icono />
    </span>
  );
}

export function FormularioRobar({ precioVigente, montoInicial, subastaPausada, onCerrar }: Props) {
  const [paso, setPaso] = useState(1);

  // El prefijo (instagram.com/, x.com/, etc.) es fijo y no editable — solo
  // se guarda lo que el usuario escribe DESPUÉS del prefijo. Así, cambiar de
  // plataforma solo reemplaza el prefijo y nunca borra lo ya escrito.
  const [plataforma, setPlataforma] = useState<Plataforma>("externo");
  const [rutaUsuario, setRutaUsuario] = useState("");

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [textoBoton, setTextoBoton] = useState("");

  const [pasosExtra, setPasosExtra] = useState(
    Math.max(0, Math.round((montoInicial - precioVigente) / PASO_OFERTA)),
  );

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prefijo = PREFIJOS[plataforma];
  const url = rutaUsuario ? `https://${prefijo}${rutaUsuario}` : "";
  const montoElegido = precioVigente + pasosExtra * PASO_OFERTA;

  function urlValida(): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  async function publicar() {
    setError(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/robar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          descripcion,
          textoBoton: textoBoton || undefined,
          url,
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
        <div className="mb-1 flex items-center justify-between">
          <button
            onClick={() => (paso === 1 ? onCerrar() : setPaso(paso - 1))}
            className="text-sm text-neutral-500 hover:text-neutral-800"
          >
            ← {paso === 1 ? "Cerrar" : "Atrás"}
          </button>
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_PASOS }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-6 rounded-full ${
                  i + 1 <= paso ? "bg-[#1a3a6b]" : "bg-neutral-200"
                }`}
              />
            ))}
          </div>
        </div>

        <h2 className="mb-4 text-lg font-bold text-neutral-900">Arma tu Tronito</h2>

        {subastaPausada ? (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            La subasta está pausada por el momento. Vuelve más tarde.
          </p>
        ) : (
          <>
            {paso === 1 && (
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-neutral-900">¿A dónde los mandas?</p>
                  <p className="text-sm text-neutral-500">El que toque tu Tronito cae aquí al tiro.</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["instagram", "Instagram"],
                      ["x", "X"],
                      ["youtube", "YouTube"],
                      ["externo", "Link externo"],
                    ] as [Plataforma, string][]
                  ).map(([valor, etiqueta]) => (
                    <button
                      key={valor}
                      onClick={() => setPlataforma(valor)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium ${
                        plataforma === valor
                          ? "border-[#1a3a6b] bg-[#f0f4fb] text-[#1a3a6b]"
                          : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      <IconoTile plataforma={valor} seleccionado={plataforma === valor} />
                      {etiqueta}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700">
                    URL de destino
                  </label>
                  <div className="mt-1 flex items-center rounded-lg border border-neutral-300 px-3 py-2 text-sm focus-within:border-[#1a3a6b] focus-within:ring-1 focus-within:ring-[#1a3a6b]">
                    <span className="shrink-0 text-neutral-400 select-none">
                      https://{prefijo}
                    </span>
                    <input
                      autoFocus
                      value={rutaUsuario}
                      onChange={(e) => setRutaUsuario(e.target.value.replace(/^https?:\/\//, ""))}
                      className="ml-0.5 min-w-0 flex-1 outline-none"
                      placeholder={plataforma === "externo" ? "tunegocio.cl/tu-pagina" : "tu-usuario"}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setPaso(2)}
                  disabled={!urlValida()}
                  className="w-full rounded-full bg-[#1a3a6b] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
                >
                  Listo, sigamos
                </button>
              </div>
            )}

            {paso === 2 && (
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-neutral-900">¿Qué quieres que diga?</p>
                  <p className="text-sm text-neutral-500">Un título y una línea, cortito y al pique.</p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-neutral-700">Título</label>
                    <span className="text-xs text-neutral-400">{titulo.length}/120</span>
                  </div>
                  <input
                    autoFocus
                    maxLength={120}
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#1a3a6b] focus:outline-none focus:ring-1 focus:ring-[#1a3a6b]"
                    placeholder="Mi anuncio"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-neutral-700">Una línea más</label>
                    <span className="text-xs text-neutral-400">{descripcion.length}/500</span>
                  </div>
                  <textarea
                    maxLength={500}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#1a3a6b] focus:outline-none focus:ring-1 focus:ring-[#1a3a6b]"
                    rows={3}
                    placeholder="De qué se trata"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-neutral-700">Texto del botón</label>
                    <span className="text-xs text-neutral-400">{textoBoton.length}/30</span>
                  </div>
                  <input
                    maxLength={30}
                    value={textoBoton}
                    onChange={(e) => setTextoBoton(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#1a3a6b] focus:outline-none focus:ring-1 focus:ring-[#1a3a6b]"
                    placeholder="Ver más"
                  />
                </div>

                <button
                  onClick={() => setPaso(3)}
                  disabled={!titulo.trim() || !descripcion.trim()}
                  className="w-full rounded-full bg-[#1a3a6b] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
                >
                  Muéstrame cómo queda
                </button>
              </div>
            )}

            {paso === 3 && (
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-neutral-900">Este es tu Tronito</p>
                  <p className="text-sm text-neutral-500">Así te va a ver la gente al tiro en el #1.</p>
                </div>

                <EntradaCard
                  entrada={{
                    titulo,
                    descripcion,
                    textoBoton: textoBoton || "Ver más",
                    url,
                    imagenUrl: null,
                    montoPagado: montoElegido,
                  }}
                  rank={1}
                  destacado
                  tiempoLabel="recién"
                />

                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>Cuánto pagas</span>
                    <span>mínimo {formatCLP(precioVigente)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-4">
                    <button
                      onClick={() => setPasosExtra((p) => Math.max(0, p - 1))}
                      disabled={pasosExtra === 0}
                      aria-label="Bajar oferta"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg font-bold text-neutral-900 hover:opacity-50 disabled:opacity-20"
                    >
                      −
                    </button>
                    <p className="text-2xl font-black tracking-tight text-neutral-900">
                      {formatCLP(montoElegido)}
                    </p>
                    <button
                      onClick={() => setPasosExtra((p) => p + 1)}
                      aria-label="Subir oferta"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg font-bold text-neutral-900 hover:opacity-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  onClick={publicar}
                  disabled={enviando}
                  className="w-full rounded-full bg-[#1a3a6b] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {enviando ? "Redirigiendo a MercadoPago…" : `Publicar mi Tronito por ${formatCLP(montoElegido)}`}
                </button>

                <p className="text-center text-xs text-neutral-400">
                  Al pagar aceptas los{" "}
                  <a href="/terminos" target="_blank" className="text-[#2a5fc4] underline hover:opacity-70">
                    términos y condiciones
                  </a>
                  . Pago no reembolsable.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
