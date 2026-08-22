"use client";

import { useState } from "react";
import { formatCLP } from "@/lib/format";
import type { ConfigInput } from "@/lib/config";

interface CoronacionDTO {
  id: string;
  titulo: string;
  descripcion: string;
  url: string;
  imagenUrl: string | null;
  montoPagado: number;
  mpPaymentId: string;
  paidAt: string;
  oculto: boolean;
}

interface IntentoDTO {
  id: string;
  expectedPrice: number;
  titulo: string;
  status: string;
  mpPreferenceId: string | null;
  mpPaymentId: string | null;
  createdAt: string;
  processedAt: string | null;
}

interface Props {
  initialConfig: ConfigInput;
  precioVigente: number;
  reyActualTitulo: string | null;
  initialCoronaciones: CoronacionDTO[];
  initialIntentos: IntentoDTO[];
}

export function AdminDashboard({
  initialConfig,
  precioVigente,
  reyActualTitulo,
  initialCoronaciones,
  initialIntentos,
}: Props) {
  const [form, setForm] = useState<ConfigInput>(initialConfig);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [coronaciones, setCoronaciones] = useState(initialCoronaciones);
  const [intentos, setIntentos] = useState(initialIntentos);
  const [actualizando, setActualizando] = useState(false);

  async function actualizarTransacciones() {
    setActualizando(true);
    try {
      const res = await fetch("/api/admin/transacciones", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setCoronaciones(data.coronaciones);
      setIntentos(data.intentos);
    } finally {
      setActualizando(false);
    }
  }

  async function guardar(next: ConfigInput) {
    setGuardando(true);
    setMensaje(null);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = await res.json();
      if (!res.ok) {
        setMensaje(data.error ?? "Error guardando");
        return;
      }
      setForm(data);
      setMensaje("Guardado.");
    } catch {
      setMensaje("Error de red guardando.");
    } finally {
      setGuardando(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    guardar(form);
  }

  function toggleKillSwitch() {
    const next = { ...form, subastaPausada: !form.subastaPausada };
    setForm(next);
    guardar(next);
  }

  function toggleBloqueoUnaHora() {
    const next = { ...form, bloqueoUnaHoraActivo: !form.bloqueoUnaHoraActivo };
    setForm(next);
    guardar(next);
  }

  async function moderar(id: string, oculto: boolean) {
    const res = await fetch(`/api/admin/anuncios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oculto }),
    });
    if (res.ok) {
      setCoronaciones((prev) => prev.map((c) => (c.id === id ? { ...c, oculto } : c)));
    }
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este anuncio permanentemente? No se puede deshacer.")) return;
    const res = await fetch(`/api/admin/anuncios/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCoronaciones((prev) => prev.filter((c) => c.id !== id));
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 p-6 py-10">
      <h1 className="text-2xl font-bold text-neutral-900">Panel de admin — Tronito</h1>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-3 text-lg font-bold">Estado del trono</h2>
        <p className="text-sm text-neutral-600">
          Precio vigente: <strong>{formatCLP(precioVigente)}</strong>
        </p>
        <p className="text-sm text-neutral-600">
          Rey actual: <strong>{reyActualTitulo ?? "vacante"}</strong>
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={toggleKillSwitch}
            disabled={guardando}
            className={`rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
              form.subastaPausada ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {form.subastaPausada ? "Reanudar subasta" : "Pausar subasta (kill switch)"}
          </button>
          <button
            onClick={toggleBloqueoUnaHora}
            disabled={guardando}
            className={`rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
              form.bloqueoUnaHoraActivo
                ? "bg-neutral-900 hover:bg-neutral-700"
                : "bg-neutral-300 hover:bg-neutral-400"
            }`}
          >
            Bloqueo de 1h tras coronar: {form.bloqueoUnaHoraActivo ? "activado" : "desactivado"}
          </button>
        </div>
        <p className="mt-2 text-xs text-neutral-400">
          Con el bloqueo activado, nadie puede robar el #1 durante la hora siguiente a cada
          coronación, sin importar cuánto pague.
        </p>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-bold">Perillas del motor de precios</h2>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="Precio inicial (CLP)">
            <input
              type="number"
              min={1}
              value={form.precioInicial}
              onChange={(e) => setForm({ ...form, precioInicial: Number(e.target.value) })}
              className="input"
            />
          </Campo>
          <Campo label="Piso mínimo absoluto (CLP)">
            <input
              type="number"
              min={1}
              value={form.pisoMinimoAbsoluto}
              onChange={(e) => setForm({ ...form, pisoMinimoAbsoluto: Number(e.target.value) })}
              className="input"
            />
          </Campo>
          <Campo label="Piso porcentaje (%)">
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={form.pisoPorcentaje}
              onChange={(e) => setForm({ ...form, pisoPorcentaje: Number(e.target.value) })}
              className="input"
            />
          </Campo>
          <Campo label="Porcentaje de incremento (%)">
            <input
              type="number"
              min={0}
              max={1000}
              step={0.1}
              value={form.porcentajeIncremento}
              onChange={(e) => setForm({ ...form, porcentajeIncremento: Number(e.target.value) })}
              className="input"
            />
          </Campo>
          <Campo label="Monto de incremento mínimo (CLP)">
            <input
              type="number"
              min={0}
              value={form.montoIncrementoMinimo}
              onChange={(e) => setForm({ ...form, montoIncrementoMinimo: Number(e.target.value) })}
              className="input"
            />
          </Campo>
          <Campo label="Ventana protegida (minutos)">
            <input
              type="number"
              min={0}
              value={form.duracionVentanaProtegidaMin}
              onChange={(e) =>
                setForm({ ...form, duracionVentanaProtegidaMin: Number(e.target.value) })
              }
              className="input"
            />
          </Campo>
          <Campo label="Tiempo para llegar al piso (horas)">
            <input
              type="number"
              min={1}
              value={form.tiempoParaLlegarAlPisoHoras}
              onChange={(e) =>
                setForm({ ...form, tiempoParaLlegarAlPisoHoras: Number(e.target.value) })
              }
              className="input"
            />
          </Campo>
          <Campo label="Curva de decaimiento">
            <select
              value={form.curvaDecaimiento}
              onChange={(e) =>
                setForm({
                  ...form,
                  curvaDecaimiento: e.target.value as ConfigInput["curvaDecaimiento"],
                })
              }
              className="input"
            >
              <option value="exponencial">Exponencial</option>
              <option value="lineal">Lineal</option>
            </select>
          </Campo>

          <div className="sm:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={guardando}
              className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
            >
              {guardando ? "Guardando…" : "Guardar perillas"}
            </button>
            {mensaje && <span className="text-sm text-neutral-500">{mensaje}</span>}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Moderación (últimas coronaciones)</h2>
          <button
            onClick={actualizarTransacciones}
            disabled={actualizando}
            className="rounded-full border border-neutral-300 px-4 py-1.5 text-xs font-medium hover:bg-neutral-100 disabled:opacity-50"
          >
            {actualizando ? "Actualizando…" : "Actualizar"}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500">
                <th className="py-2 pr-4">Título</th>
                <th className="py-2 pr-4">Monto</th>
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {coronaciones.map((c) => (
                <tr key={c.id} className="border-b border-neutral-100">
                  <td className="py-2 pr-4">{c.titulo}</td>
                  <td className="py-2 pr-4">{formatCLP(c.montoPagado)}</td>
                  <td className="py-2 pr-4">{new Date(c.paidAt).toLocaleString("es-CL")}</td>
                  <td className="py-2 pr-4">{c.oculto ? "Oculto" : "Visible"}</td>
                  <td className="py-2 space-x-2">
                    <button
                      onClick={() => moderar(c.id, !c.oculto)}
                      className="rounded-full border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-100"
                    >
                      {c.oculto ? "Mostrar" : "Ocultar"}
                    </button>
                    <button
                      onClick={() => eliminar(c.id)}
                      className="rounded-full border border-red-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-bold">Últimos intentos de pago</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500">
                <th className="py-2 pr-4">Título</th>
                <th className="py-2 pr-4">Precio esperado</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2">Creado</th>
              </tr>
            </thead>
            <tbody>
              {intentos.map((i) => (
                <tr key={i.id} className="border-b border-neutral-100">
                  <td className="py-2 pr-4">{i.titulo}</td>
                  <td className="py-2 pr-4">{formatCLP(i.expectedPrice)}</td>
                  <td className="py-2 pr-4">{i.status}</td>
                  <td className="py-2">{new Date(i.createdAt).toLocaleString("es-CL")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-neutral-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
