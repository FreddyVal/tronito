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
    <div className="mx-auto w-[92%] max-w-[900px] py-16">
      {destronadoVisible && (
        <div className="mb-8 flex items-center justify-between gap-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          <span>Te bajaron del #1. Recupera el trono desde {formatCLP(precioLocal)}.</span>
          <button onClick={cerrarBannerDestronado} className="shrink-0 underline">
            Entendido
          </button>
        </div>
      )}

      <section className="pb-16 text-center">
        {estado.subastaPausada ? (
          <p className="text-lg font-semibold text-amber-700">La subasta está pausada.</p>
        ) : estado.bloqueado ? (
          <>
            <h1 className="mx-auto mb-8 max-w-2xl text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-bold tracking-tighter text-neutral-900">
              El trono está bloqueado por el momento
            </h1>
            <p className="text-5xl font-black tracking-tight text-blue-700">
              {formatCLP(precioLocal)}
            </p>
            <p className="mt-4 text-sm font-medium text-neutral-500">
              Nadie puede robarlo hasta las{" "}
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
            <h1 className="mx-auto mb-11 max-w-2xl text-[clamp(2rem,6vw,4rem)] leading-[1.05] font-bold tracking-tighter text-neutral-900">
              ¿Cuánto pagarías por aparecer primero en esta página?
            </h1>

            <div className="mx-auto max-w-[480px] rounded-[18px] bg-white p-6 shadow-[0_4px_25px_rgba(0,0,0,0.06)]">
              <p className="mb-4 text-left text-sm text-neutral-500">Tu oferta</p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPasosExtra((p) => Math.max(0, p - 1))}
                  disabled={pasosExtra === 0}
                  aria-label={`Bajar oferta en ${formatCLP(PASO_OFERTA)}`}
                  className="h-12 w-12 shrink-0 rounded-xl border border-neutral-200 text-xl font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-30"
                >
                  −
                </button>
                <div className="flex h-12 flex-1 items-center justify-center rounded-xl border border-neutral-200 px-3 text-xl font-bold text-blue-700">
                  {formatCLP(montoElegido)}
                </div>
                <button
                  onClick={() => setPasosExtra((p) => p + 1)}
                  aria-label={`Subir oferta en ${formatCLP(PASO_OFERTA)}`}
                  className="h-12 w-12 shrink-0 rounded-xl border border-neutral-200 text-xl font-medium text-blue-600 hover:bg-blue-50"
                >
                  +
                </button>
              </div>

              {pasosExtra > 0 && (
                <p className="mt-2 text-left text-xs text-neutral-400">
                  {formatCLP(precioLocal)} mínimo + {formatCLP(pasosExtra * PASO_OFERTA)} de colchón
                </p>
              )}

              <button
                onClick={() => setMostrarFormulario(true)}
                className="mt-4 w-full rounded-xl bg-blue-600 py-4 text-base font-bold text-white hover:bg-blue-700"
              >
                Comprar puesto #1 por {formatCLP(montoElegido)}
              </button>

              <p className="mt-3 text-xs text-neutral-400">Pago seguro con MercadoPago</p>
            </div>
          </>
        )}
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-900">Salón de la fama</h2>
          <span className="text-sm text-neutral-500">
            {estado.salonDeLaFama.length} {estado.salonDeLaFama.length === 1 ? "lugar" : "lugares"}
          </span>
        </div>
        {!estado.reyActual && estado.salonDeLaFama.length > 0 && (
          <p className="mb-4 text-sm text-neutral-400">
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
