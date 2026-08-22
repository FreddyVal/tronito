import { isSandbox } from "@/lib/mercadopago";

export function SandboxBanner() {
  if (!isSandbox) return null;
  return (
    <div className="bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-amber-950">
      MODO SANDBOX — los pagos son de prueba, no se cobra dinero real.
    </div>
  );
}
