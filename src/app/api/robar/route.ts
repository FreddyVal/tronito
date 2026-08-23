import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { purchaseIntents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getEstadoTrono } from "@/lib/throne";
import { crearPreferencia, isSandbox } from "@/lib/mercadopago";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const bodySchema = z.object({
  titulo: z.string().trim().min(1).max(120),
  descripcion: z.string().trim().min(1).max(500),
  url: z.string().trim().url().max(2000),
  imagenUrl: z.string().trim().url().max(2000).optional().or(z.literal("")),
  // Sobre-oferta opcional elegida en el stepper del front (+/- $1.000 sobre el
  // mínimo). Si no viene, se cobra exactamente el precio vigente.
  montoElegido: z.number().int().min(1).max(100_000_000).optional(),
});

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);

  const ok = await checkRateLimit(ip);
  if (!ok) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera un minuto e intenta de nuevo." },
      { status: 429 },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const estado = await getEstadoTrono();
  if (estado.subastaPausada) {
    return NextResponse.json({ error: "La subasta está pausada por el momento." }, { status: 403 });
  }
  if (estado.bloqueado) {
    return NextResponse.json(
      {
        error: "El trono está bloqueado por el momento. Nadie puede robarlo todavía.",
        bloqueadoHasta: estado.bloqueadoHasta,
      },
      { status: 403 },
    );
  }

  const { titulo, descripcion, url, imagenUrl, montoElegido } = parsed.data;

  if (montoElegido !== undefined && montoElegido < estado.precioVigente) {
    return NextResponse.json(
      {
        error: "El precio subió mientras completabas el formulario. Actualiza e intenta de nuevo.",
        precioVigente: estado.precioVigente,
      },
      { status: 409 },
    );
  }

  const precio = montoElegido ?? estado.precioVigente;

  const inserted = await db
    .insert(purchaseIntents)
    .values({
      expectedPrice: precio,
      titulo,
      descripcion,
      url,
      imagenUrl: imagenUrl || null,
      status: "pending",
    })
    .returning();

  const intent = inserted[0];
  if (!intent) {
    return NextResponse.json({ error: "No se pudo crear el intento de pago" }, { status: 500 });
  }

  try {
    const preferencia = await crearPreferencia({
      intentId: intent.id,
      precio,
      titulo,
    });

    await db
      .update(purchaseIntents)
      .set({ mpPreferenceId: preferencia.id })
      .where(eq(purchaseIntents.id, intent.id));

    const initPoint = isSandbox
      ? preferencia.sandbox_init_point ?? preferencia.init_point
      : preferencia.init_point;

    if (!initPoint) {
      return NextResponse.json({ error: "MercadoPago no devolvió un link de pago" }, { status: 502 });
    }

    return NextResponse.json({ initPoint, precio, intentId: intent.id });
  } catch (err) {
    console.error("Error creando preferencia de MercadoPago", err);
    return NextResponse.json({ error: "No se pudo iniciar el pago" }, { status: 502 });
  }
}
