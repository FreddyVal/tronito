import { sql, eq } from "drizzle-orm";
import { db } from "@/db";
import { config as configTable, purchaseIntents, throneHistory } from "@/db/schema";
import { obtenerPago, verificarFirmaWebhook } from "@/lib/mercadopago";

export const runtime = "nodejs";

/**
 * Única fuente de verdad para coronar un nuevo rey. Idempotente (una misma
 * notificación repetida, o dos notificaciones para el mismo pago, no
 * duplican la coronación) y responde 200 siempre que procesó la notificación
 * correctamente, aunque el pago en sí no haya sido aprobado.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const body = await request.json().catch(() => null);

  const type = body?.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const dataIdFromQuery = url.searchParams.get("data.id") ?? url.searchParams.get("id");
  const paymentId: string | null = body?.data?.id ?? dataIdFromQuery;

  if (type !== "payment" || !paymentId) {
    // Otros topics (merchant_order, etc.) no nos interesan; confirmamos recepción igual.
    return new Response("ok", { status: 200 });
  }

  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  const firmaValida = verificarFirmaWebhook({
    xSignature,
    xRequestId,
    dataId: dataIdFromQuery ?? paymentId,
  });

  if (!firmaValida) {
    console.warn("Webhook de MercadoPago con firma inválida", { paymentId });
    return new Response("firma inválida", { status: 401 });
  }

  let payment;
  try {
    payment = await obtenerPago(paymentId);
  } catch (err) {
    console.error("No se pudo consultar el pago en MercadoPago", paymentId, err);
    // 200 igual: si es un error transitorio, MP reintentará la notificación.
    return new Response("error consultando pago", { status: 200 });
  }

  const externalReference = payment.external_reference;
  const status = payment.status;
  const transactionAmount = payment.transaction_amount;

  if (!externalReference) {
    console.warn("Pago sin external_reference, se ignora", paymentId);
    return new Response("ok", { status: 200 });
  }

  const intentRows = await db
    .select()
    .from(purchaseIntents)
    .where(eq(purchaseIntents.id, externalReference));
  const intent = intentRows[0];

  if (!intent) {
    console.warn("purchase_intent no encontrado para external_reference", externalReference);
    return new Response("ok", { status: 200 });
  }

  if (intent.status !== "pending") {
    // Ya procesado antes (idempotencia).
    return new Response("ok", { status: 200 });
  }

  if (status === "rejected" || status === "cancelled") {
    await db
      .update(purchaseIntents)
      .set({ status: "rejected", mpPaymentId: String(paymentId), processedAt: new Date() })
      .where(eq(purchaseIntents.id, intent.id));
    return new Response("ok", { status: 200 });
  }

  if (status !== "approved") {
    // pending / in_process / authorized: todavía no hay resolución final,
    // dejamos el intent en pending a la espera de una próxima notificación.
    return new Response("ok", { status: 200 });
  }

  if (transactionAmount !== intent.expectedPrice) {
    console.error("Monto del pago no coincide con el precio esperado", {
      paymentId,
      transactionAmount,
      expectedPrice: intent.expectedPrice,
    });
    await db
      .update(purchaseIntents)
      .set({ status: "rejected", mpPaymentId: String(paymentId), processedAt: new Date() })
      .where(eq(purchaseIntents.id, intent.id));
    return new Response("ok", { status: 200 });
  }

  try {
    await db.transaction(async (tx) => {
      // Lock de fila singleton para serializar coronaciones concurrentes.
      await tx.execute(sql`select id from ${configTable} where id = 1 for update`);

      const freshIntentRows = await tx
        .select()
        .from(purchaseIntents)
        .where(eq(purchaseIntents.id, intent.id));
      const freshIntent = freshIntentRows[0];
      if (!freshIntent || freshIntent.status !== "pending") {
        // Otra notificación concurrente ya lo procesó dentro del lock.
        return;
      }

      await tx.insert(throneHistory).values({
        titulo: intent.titulo,
        descripcion: intent.descripcion,
        url: intent.url,
        imagenUrl: intent.imagenUrl,
        montoPagado: intent.expectedPrice,
        mpPaymentId: String(paymentId),
      });

      await tx
        .update(purchaseIntents)
        .set({ status: "approved", mpPaymentId: String(paymentId), processedAt: new Date() })
        .where(eq(purchaseIntents.id, intent.id));
    });
  } catch (err) {
    // Defensa en profundidad: si por una carrera muy ajustada igual se
    // pisó el unique constraint de mp_payment_id, lo tratamos como
    // "ya procesado" en vez de fallar la notificación.
    console.error("Error coronando (posible carrera en mp_payment_id)", paymentId, err);
  }

  return new Response("ok", { status: 200 });
}
