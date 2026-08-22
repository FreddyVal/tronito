import { NextResponse } from "next/server";
import { getEstadoTrono } from "@/lib/throne";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const estado = await getEstadoTrono();
  return NextResponse.json(estado, {
    headers: { "Cache-Control": "no-store" },
  });
}
