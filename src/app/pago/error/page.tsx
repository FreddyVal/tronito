import { EstadoPago } from "@/components/EstadoPago";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const { intent } = await searchParams;
  return <EstadoPago intentId={intent ?? null} />;
}
