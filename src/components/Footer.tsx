export function Footer() {
  return (
    <footer className="mx-auto w-[92%] max-w-[900px] border-t border-neutral-200 py-10 text-[13px] text-neutral-500">
      <strong className="text-neutral-700">Tronito.</strong>
      <p className="mt-2">
        Los puestos cambian según las ofertas realizadas por los participantes. Es un experimento
        de subasta de publicidad — no revisamos ni recomendamos lo publicado.
      </p>
      <a href="/terminos" className="mt-2 inline-block text-blue-600 underline hover:text-blue-800">
        Términos y condiciones
      </a>
    </footer>
  );
}
