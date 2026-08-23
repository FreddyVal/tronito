"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { EstadoTrono } from "@/lib/throne";
import { calcularPrecioVigente } from "@/lib/pricing";
import { formatCLP } from "@/lib/format";
import { tiempoDesde } from "@/lib/format";
import { FormularioRobar } from "./FormularioRobar";
import { HistorialTrono } from "./HistorialTrono";
import { EntradaCard } from "./EntradaCard";
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

function hostnameDe(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
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
    <div className="flex w-full flex-col items-center">
      {destronadoVisible && (
        <div className="mb-6 flex w-full max-w-[512px] items-center justify-between gap-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
          <span>Te bajaron del #1. Recupera el trono desde {formatCLP(precioLocal)}.</span>
          <button onClick={cerrarBannerDestronado} className="shrink-0 underline">
            Entendido
          </button>
        </div>
      )}

      {estado.subastaPausada ? (
        <p className="mb-6 text-lg font-semibold text-amber-700">La subasta está pausada.</p>
      ) : (
        <>
          {estado.bloqueado ? (
            <>
              <h1 className="mb-6 max-w-[520px] text-center text-2xl leading-snug font-bold text-neutral-900">
                El trono está <span className="text-[#2a5fc4]">bloqueado</span> por el momento
              </h1>
              <p className="mb-3 text-3xl font-bold text-neutral-900">{formatCLP(precioLocal)}</p>
              <p className="mb-6 text-sm text-neutral-500">
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
            <h1 className="mb-6 max-w-[520px] text-center text-[1.6rem] leading-[1.4] font-bold text-neutral-900 max-[480px]:text-xl">
              ¿Cuánto pagarías por estar en el <span className="text-[#2a5fc4]">puesto #1</span>{" "}
              cuando esta página se haga viral?
            </h1>
          )}

          {estado.recordHistorico && (
            <>
              <div className="mb-4 w-full max-w-[512px] text-center">
                <h2 className="text-lg font-bold text-neutral-900">Salón de la fama</h2>
                <p className="mt-1 text-sm text-neutral-500">El que más ha pagado históricamente</p>
              </div>
              <div className="mb-8 w-full max-w-[512px]">
                <EntradaCard
                  entrada={estado.recordHistorico}
                  rank={1}
                  destacado={estado.recordHistorico.id === estado.reyActual?.id}
                  tiempoLabel={tiempoDesde(new Date(estado.recordHistorico.paidAt))}
                />
              </div>
            </>
          )}

          {!estado.bloqueado && (
            <>
              <p className="mb-2 text-sm text-neutral-500">Precio por el puesto #1 de esta lista</p>

              <div className="mb-5 flex items-center gap-4 rounded-full border-[1.5px] border-neutral-200 bg-white px-6 py-2.5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <button
                  onClick={() => setPasosExtra((p) => Math.max(0, p - 1))}
                  disabled={pasosExtra === 0}
                  aria-label={`Bajar oferta en ${formatCLP(PASO_OFERTA)}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xl font-bold text-neutral-900 hover:opacity-50 disabled:opacity-20"
                >
                  −
                </button>
                <p className="text-2xl font-bold whitespace-nowrap text-neutral-900">
                  <span className="mr-0.5 text-xl font-semibold">$</span>
                  {montoElegido.toLocaleString("es-CL")}
                </p>
                <button
                  onClick={() => setPasosExtra((p) => p + 1)}
                  aria-label={`Subir oferta en ${formatCLP(PASO_OFERTA)}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xl font-bold text-neutral-900 hover:opacity-50"
                >
                  +
                </button>
              </div>

              {pasosExtra > 0 && (
                <p className="mb-3 -mt-2 text-xs text-neutral-400">
                  {formatCLP(precioLocal)} mínimo + {formatCLP(pasosExtra * PASO_OFERTA)} de colchón
                </p>
              )}

              <button
                onClick={() => setMostrarFormulario(true)}
                className="mb-3 w-full max-w-[512px] rounded-full bg-[#1a3a6b] py-4 text-base font-semibold text-white shadow-[0_4px_12px_rgba(26,58,107,0.3)] hover:opacity-90"
              >
                Llévate el puesto #1 por {formatCLP(montoElegido)}
              </button>

              <div className="mb-6 flex items-center gap-1.5 text-[0.72rem] text-neutral-400">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Pago seguro a través de MercadoPago
              </div>

              <p className="mb-6 text-center text-sm text-neutral-900">
                {estado.reyActual ? (
                  <>
                    <strong>{hostnameDe(estado.reyActual.url)}</strong>
                    <span className="text-neutral-400"> en </span>
                    <strong>#1</strong>
                    <span className="text-neutral-400">
                      {" "}
                      {tiempoDesde(new Date(estado.reyActual.paidAt))}
                    </span>
                  </>
                ) : (
                  <span className="text-neutral-400">
                    {estado.historial.length > 0
                      ? "El trono está vacante — el último pago fue ocultado por moderación."
                      : "El trono está vacante — sé el primero."}
                  </span>
                )}
              </p>
            </>
          )}
        </>
      )}

      <div className="mb-4 w-full max-w-[512px] text-center">
        <h2 className="text-lg font-bold text-neutral-900">Últimos en robar el #1</h2>
        <p className="mt-1 text-sm text-neutral-500">
          El precio por el #1 sube al comprarlo y baja con el tiempo, así que este orden es por
          fecha, no siempre de mayor a menor monto.
        </p>
      </div>
      <div className="w-full max-w-[512px]">
        <HistorialTrono entradas={estado.historial} reyActualId={estado.reyActual?.id ?? null} />
      </div>

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
