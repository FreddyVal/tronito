import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { throneHistory } from "@/db/schema";

export const runtime = "nodejs";

const bodySchema = z.object({ oculto: z.boolean() });

/** Ocultar/mostrar un anuncio (moderación). No borra el registro histórico del pago. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const updated = await db
    .update(throneHistory)
    .set({ oculto: parsed.data.oculto })
    .where(eq(throneHistory.id, id))
    .returning();

  if (!updated[0]) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  return NextResponse.json(updated[0]);
}

/** Elimina el registro por completo (contenido ilegal/abusivo). Irreversible. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = await db.delete(throneHistory).where(eq(throneHistory.id, id)).returning();
  if (!deleted[0]) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
