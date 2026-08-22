import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { throneHistory, purchaseIntents } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [coronaciones, intentos] = await Promise.all([
    db.select().from(throneHistory).orderBy(desc(throneHistory.paidAt)).limit(50),
    db.select().from(purchaseIntents).orderBy(desc(purchaseIntents.createdAt)).limit(50),
  ]);

  return NextResponse.json({ coronaciones, intentos });
}
