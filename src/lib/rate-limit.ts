import crypto from "crypto";
import { and, gte, eq, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { rateLimitLog } from "@/db/schema";

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;
const PRUNE_OLDER_THAN_MS = 60 * 60_000; // 1 hora

function hashIp(ip: string): string {
  const salt = process.env.MP_WEBHOOK_SECRET ?? "tronito";
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/**
 * true si `ip` puede intentar comprar de nuevo. Registra el intento y poda
 * oportunistamente filas viejas — no requiere un cron aparte.
 */
export async function checkRateLimit(ip: string): Promise<boolean> {
  const ipHash = hashIp(ip);
  const windowStart = new Date(Date.now() - WINDOW_MS);

  const recent = await db
    .select({ count: sql<number>`count(*)` })
    .from(rateLimitLog)
    .where(and(eq(rateLimitLog.ipHash, ipHash), gte(rateLimitLog.createdAt, windowStart)));

  const count = Number(recent[0]?.count ?? 0);
  if (count >= MAX_REQUESTS_PER_WINDOW) return false;

  await db.insert(rateLimitLog).values({ ipHash });

  const pruneCutoff = new Date(Date.now() - PRUNE_OLDER_THAN_MS);
  await db.delete(rateLimitLog).where(lt(rateLimitLog.createdAt, pruneCutoff));

  return true;
}

/** Extrae la IP del cliente desde los headers estándar de proxy de Vercel. */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
