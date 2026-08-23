"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { EstadoTrono } from "@/lib/throne";
import { calcularPrecioVigente } from "@/lib/pricing";
import { formatCLP } from "@/lib/format";
import { FormularioRobar } from "./FormularioRobar";
import { SalonDeLaFama } from "./SalonDeLaFama";
import { leerMiTrono, olvidarMiTrono } from "@/lib/mi-trono-storage";

const POLL_MS = 2500;
const TICK_MS = 1000;
const PASO_OFERTA = 1000;

// No hay eventos nativos para localStorage escrito desde la misma pestaña,
// así que no nos suscribimos a cambios externos: solo evitamos el mismatch
// de hidratación server/cliente (snapshot server = null, cliente = valor real).
function subscribeNoop() {
  return () => {};
}
function getServerSnapshot() {
  return null;
}

export function TronoApp({ initialEstado }: { initialEstado: EstadoTrono }) {
  const [estado, setEstado] = useState(initialEstado);
  const [precioLocal, setPrecioLocal] = useState(initialEstado.precioVigente);
  const [pasosExtra, setPasosExtra] = useState(0);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const miTronoId = useSyncExternalStore(subscribeNoop, leerMiTrono, getServerSnapshot);
  const destronadoVisible =
    !dismissed && Boolean(miTronoId && estado.reyActual?.id !== miTronoId);

  // El piso del stepper es siempre el precio vigente exacto; la oferta elegida
  // (lo que realmente se cobra) es ese piso más los pasos de $1.000 que sume el usuario.
  const montoElegido = precioLocal + pasosExtra * PASO_OFERTA;

  // Anima el precio bajando localmente entre polls, sin pegarle al servidor cada segundo.
  useEffect(() => {
    if (estado.subastaPausada) return;
    const id = setInterval(() => {
      const ultima = estado.ultimaCompraBase;
      const precio = calcularPrecioVigente(
        estado.config,
        ultima ? { monto: ultima.monto, timestamp: new Date(ultima.timestamp) } : null,
        new Date(),
      );
      setPrecioLocal(precio);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [estado]);

  // Reconcilia con el servidor: nuevos reyes, cambios de perillas, pausa.
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/estado", { cache: "no-store" });
        if (!res.ok) return;
        const data: EstadoTrono = await res.json();
        setEstado(data);
        setPrecioLocal(data.precioVigente);
      } catch {
        // Error de red transitorio: se reintenta en el próximo poll.
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, []);

  function cerrarBannerDestronado() {
    olvidarMiTrono();
    setDismissed(true);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-4 py-10">
      {destronadoVisible && (
        <div className="flex items-center justify-between gap-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          <span>Te bajaron del #1. Recupera el trono desde {formatCLP(precioLocal)}.</span>
          <button onClick={cerrarBannerDestronado} className="shrink-0 underline">
            Entendido
          </button>
        </div>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
        {estado.subastaPausada ? (
          <p className="text-lg font-semibold text-amber-700">La subasta está pausada.</p>
        ) : estado.bloqueado ? (
          <>
            <p className="text-sm text-neutral-500">Roba el #1 por</p>
            <p className="my-2 text-5xl font-black tracking-tight text-blue-700">
              {formatCLP(precioLocal)}
            </p>
            <p className="mt-2 text-sm font-medium text-neutral-500">
              El trono está bloqueado. Nadie puede robarlo hasta las{" "}
              {estado.bloqueadoHasta &&
                new Date(estado.bloqueadoHasta).toLocaleTimeString("es-CL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              .
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-neutral-500">
              ¿Cuánto pagarías por estar en el puesto #1 cuando esta página se haga viral?
            </p>
            <div className="my-3 flex items-center justify-center gap-4">
              <button
                onClick={() => setPasosExtra((p) => Math.max(0, p - 1))}
                disabled={pasosExtra === 0}
                aria-label={`Bajar oferta en ${formatCLP(PASO_OFERTA)}`}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-200 text-lg font-bold text-blue-600 hover:bg-blue-50 disabled:opacity-30"
              >
                −
              </button>
              <p className="text-4xl font-black tracking-tight text-blue-700 sm:text-5xl">
                {formatCLP(montoElegido)}
              </p>
              <button
                onClick={() => setPasosExtra((p) => p + 1)}
                aria-label={`Subir oferta en ${formatCLP(PASO_OFERTA)}`}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-200 text-lg font-bold text-blue-600 hover:bg-blue-50"
              >
                +
              </button>
            </div>
            {pasosExtra > 0 && (
              <p className="text-xs text-neutral-400">
                {formatCLP(precioLocal)} mínimo + {formatCLP(pasosExtra * PASO_OFERTA)} de colchón
              </p>
            )}
            <button
              onClick={() => setMostrarFormulario(true)}
              className="mt-4 w-full rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Llévate el puesto #1 por {formatCLP(montoElegido)}
            </button>
          </>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-neutral-900">Salón de la fama</h2>
        {!estado.reyActual && estado.salonDeLaFama.length > 0 && (
          <p className="mb-3 text-sm text-neutral-400">
            El trono está vacante por el momento — el anuncio del último pago fue ocultado por
            moderación.
          </p>
        )}
        <SalonDeLaFama entradas={estado.salonDeLaFama} reyActualId={estado.reyActual?.id ?? null} />
      </section>

      {mostrarFormulario && (
        <FormularioRobar
          precioVigente={precioLocal}
          montoInicial={montoElegido}
          subastaPausada={estado.subastaPausada}
          onCerrar={() => setMostrarFormulario(false)}
        />
      )}
    </div>
  );
}
