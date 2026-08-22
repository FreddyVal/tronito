import { NextResponse } from "next/server";
import { getConfig, updateConfig, toConfigInput, configInputSchema } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const row = await getConfig();
  return NextResponse.json(toConfigInput(row));
}

export async function PATCH(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = configInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const updated = await updateConfig(parsed.data);
  return NextResponse.json(toConfigInput(updated));
}
