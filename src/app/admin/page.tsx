import { desc } from "drizzle-orm";
import { db } from "@/db";
import { throneHistory, purchaseIntents } from "@/db/schema";
import { getConfig, toConfigInput } from "@/lib/config";
import { getEstadoTrono } from "@/lib/throne";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [configRow, estado, coronaciones, intentos] = await Promise.all([
    getConfig(),
    getEstadoTrono(),
    db.select().from(throneHistory).orderBy(desc(throneHistory.paidAt)).limit(50),
    db.select().from(purchaseIntents).orderBy(desc(purchaseIntents.createdAt)).limit(50),
  ]);

  const coronacionesDTO = coronaciones.map((c) => ({ ...c, paidAt: c.paidAt.toISOString() }));
  const intentosDTO = intentos.map((i) => ({
    ...i,
    createdAt: i.createdAt.toISOString(),
    processedAt: i.processedAt ? i.processedAt.toISOString() : null,
  }));

  return (
    <AdminDashboard
      initialConfig={toConfigInput(configRow)}
      precioVigente={estado.precioVigente}
      reyActualTitulo={estado.reyActual?.titulo ?? null}
      initialCoronaciones={coronacionesDTO}
      initialIntentos={intentosDTO}
    />
  );
}
