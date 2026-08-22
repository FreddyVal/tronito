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
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const miTronoId = useSyncExternalStore(subscribeNoop, leerMiTrono, getServerSnapshot);
  const destronadoVisible =
    !dismissed && Boolean(miTronoId && estado.reyActual?.id !== miTronoId);

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
        ) : (
          <>
            <p className="text-sm text-neutral-500">Roba el #1 por</p>
            <p className="my-2 text-5xl font-black tracking-tight text-neutral-900">
              {formatCLP(precioLocal)}
            </p>
            {estado.bloqueado ? (
              <p className="mt-2 text-sm font-medium text-neutral-500">
                El trono está bloqueado. Nadie puede robarlo hasta las{" "}
                {estado.bloqueadoHasta &&
                  new Date(estado.bloqueadoHasta).toLocaleTimeString("es-CL", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                .
              </p>
            ) : (
              <button
                onClick={() => setMostrarFormulario(true)}
                className="mt-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-700"
              >
                Robar el #1
              </button>
            )}
          </>
        )}

        <div className="mt-6 border-t border-neutral-100 pt-6">
          {estado.reyActual ? (
            <>
              <p className="text-xs uppercase tracking-wide text-neutral-400">Rey actual</p>
              <a
                href={estado.reyActual.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="mt-1 block text-xl font-bold text-neutral-900 hover:underline"
              >
                {estado.reyActual.titulo}
              </a>
              <p className="mt-1 text-sm text-neutral-500">{estado.reyActual.descripcion}</p>
              <span className="mt-2 inline-block rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                el rey pagó {formatCLP(estado.reyActual.montoPagado)}
              </span>
            </>
          ) : (
            <p className="text-sm text-neutral-400">El trono está vacante.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-neutral-900">Salón de la fama</h2>
        <SalonDeLaFama entradas={estado.salonDeLaFama} />
      </section>

      {mostrarFormulario && (
        <FormularioRobar
          precioVigente={precioLocal}
          subastaPausada={estado.subastaPausada}
          onCerrar={() => setMostrarFormulario(false)}
        />
      )}
    </div>
  );
}
