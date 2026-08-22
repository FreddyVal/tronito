import crypto from "crypto";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

export const isSandbox = (process.env.MP_ENV ?? "sandbox") !== "production";

function getClient(): MercadoPagoConfig {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error("MP_ACCESS_TOKEN no está configurada");
  return new MercadoPagoConfig({ accessToken });
}

function siteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SITE_URL no está configurada");
  return url.replace(/\/$/, "");
}

interface CrearPreferenciaInput {
  intentId: string;
  precio: number;
  titulo: string;
}

/** Crea una preferencia de Checkout Pro por el precio ya calculado en el servidor. */
export async function crearPreferencia(input: CrearPreferenciaInput) {
  const preference = new Preference(getClient());
  const base = siteUrl();

  const result = await preference.create({
    body: {
      items: [
        {
          id: input.intentId,
          title: `Tronito — robar el #1: ${input.titulo}`.slice(0, 250),
          quantity: 1,
          unit_price: input.precio,
          currency_id: "CLP",
        },
      ],
      external_reference: input.intentId,
      back_urls: {
        success: `${base}/pago/exito?intent=${input.intentId}`,
        pending: `${base}/pago/pendiente?intent=${input.intentId}`,
        failure: `${base}/pago/error?intent=${input.intentId}`,
      },
      auto_return: "approved",
      notification_url: `${base}/api/mercadopago/webhook`,
      statement_descriptor: "TRONITO",
    },
  });

  return result;
}

/** Consulta un pago por id contra la API de MercadoPago (nunca confiar en el payload del webhook). */
export async function obtenerPago(paymentId: string) {
  const payment = new Payment(getClient());
  return payment.get({ id: paymentId });
}

interface VerificarFirmaInput {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}

/**
 * Valida el header x-signature de MercadoPago según su esquema documentado:
 * manifest = `id:{dataId};request-id:{x-request-id};ts:{ts};`, firmado con
 * HMAC-SHA256 usando MP_WEBHOOK_SECRET, comparado contra el campo v1.
 */
export function verificarFirmaWebhook(input: VerificarFirmaInput): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) throw new Error("MP_WEBHOOK_SECRET no está configurada");

  const { xSignature, xRequestId, dataId } = input;
  if (!xSignature || !xRequestId || !dataId) return false;

  const parts = Object.fromEntries(
    xSignature.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key?.trim(), value?.trim()];
    }),
  );

  const ts = parts["ts"];
  const hash = parts["v1"];
  if (!ts || !hash) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const hashBuf = Buffer.from(hash, "hex");
  if (expectedBuf.length !== hashBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, hashBuf);
}
