import { getEstadoTrono } from "@/lib/throne";
import { TronoApp } from "@/components/TronoApp";
import { SandboxBanner } from "@/components/SandboxBanner";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const estado = await getEstadoTrono();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SandboxBanner />
      <main className="flex-1">
        <TronoApp initialEstado={estado} />
      </main>
      <Footer />
    </div>
  );
}
