import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { purchaseIntents, throneHistory } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Estado de un intento de pago para que la página de retorno de MercadoPago
 * pueda hacer polling hasta que el webhook (única fuente de verdad) resuelva
 * el intent, y para obtener el id de la fila de throne_history resultante
 * (útil para detectar destronamientos vía localStorage más adelante).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const rows = await db.select().from(purchaseIntents).where(eq(purchaseIntents.id, id));
  const intent = rows[0];
  if (!intent) {
    return NextResponse.json({ error: "Intento no encontrado" }, { status: 404 });
  }

  let throneEntryId: string | null = null;
  if (intent.status === "approved" && intent.mpPaymentId) {
    const throneRows = await db
      .select({ id: throneHistory.id })
      .from(throneHistory)
      .where(eq(throneHistory.mpPaymentId, intent.mpPaymentId));
    throneEntryId = throneRows[0]?.id ?? null;
  }

  return NextResponse.json(
    { status: intent.status, throneEntryId },
    { headers: { "Cache-Control": "no-store" } },
  );
}
