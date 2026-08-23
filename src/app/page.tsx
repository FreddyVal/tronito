import { getEstadoTrono } from "@/lib/throne";
import { TronoApp } from "@/components/TronoApp";
import { SandboxBanner } from "@/components/SandboxBanner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const estado = await getEstadoTrono();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SandboxBanner />
      <main className="flex flex-1 flex-col items-center px-4 py-10">
        <Header />
        <TronoApp initialEstado={estado} />
      </main>
      <Footer />
    </div>
  );
}
