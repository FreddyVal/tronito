"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { recordarMiTrono } from "@/lib/mi-trono-storage";

type Status = "pending" | "approved" | "rejected" | "expired";

const POLL_MS = 2000;
const MAX_INTENTOS = 30; // ~1 minuto

export function EstadoPago({ intentId }: { intentId: string | null }) {
  const [status, setStatus] = useState<Status | "cargando" | "sin-intent">(
    intentId ? "cargando" : "sin-intent",
  );
  const intentosRef = useRef(0);

  useEffect(() => {
    if (!intentId) return;
    let cancelado = false;

    async function poll() {
      try {
        const res = await fetch(`/api/intent/${intentId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelado) return;

        if (data.status === "approved") {
          if (data.throneEntryId) recordarMiTrono(data.throneEntryId);
          setStatus("approved");
          return;
        }
        if (data.status === "rejected" || data.status === "expired") {
          setStatus(data.status);
          return;
        }

        intentosRef.current += 1;
        if (intentosRef.current < MAX_INTENTOS) {
          setTimeout(poll, POLL_MS);
        } else {
          setStatus("pending");
        }
      } catch {
        intentosRef.current += 1;
        if (!cancelado && intentosRef.current < MAX_INTENTOS) setTimeout(poll, POLL_MS);
      }
    }

    poll();
    return () => {
      cancelado = true;
    };
  }, [intentId]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      {status === "sin-intent" && (
        <p className="text-neutral-600">No encontramos referencia de tu pago.</p>
      )}
      {status === "cargando" && (
        <>
          <p className="text-lg font-semibold text-neutral-900">Confirmando tu pago…</p>
          <p className="text-sm text-neutral-500">Esto puede tardar unos segundos.</p>
        </>
      )}
      {status === "pending" && (
        <>
          <p className="text-lg font-semibold text-amber-700">Tu pago sigue en proceso</p>
          <p className="text-sm text-neutral-500">
            MercadoPago todavía no confirma el pago. Si fue aprobado, aparecerás como rey en
            cuanto se procese.
          </p>
        </>
      )}
      {status === "approved" && (
        <>
          <p className="text-lg font-semibold text-green-700">¡Eres el nuevo rey del #1!</p>
          <p className="text-sm text-neutral-500">Tu anuncio ya está arriba.</p>
        </>
      )}
      {status === "rejected" && (
        <>
          <p className="text-lg font-semibold text-red-700">El pago no fue aprobado</p>
          <p className="text-sm text-neutral-500">No se realizó ningún cobro. Puedes intentar de nuevo.</p>
        </>
      )}
      {status === "expired" && (
        <>
          <p className="text-lg font-semibold text-red-700">El intento expiró</p>
          <p className="text-sm text-neutral-500">Puedes intentar robar el #1 de nuevo.</p>
        </>
      )}
      <Link href="/" className="mt-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700">
        Volver a Tronito
      </Link>
    </div>
  );
}
