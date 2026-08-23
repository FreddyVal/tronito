export function Footer() {
  return (
    <footer className="mx-auto mt-10 w-[92%] max-w-[512px] border-t border-neutral-300/60 py-8 text-center text-[0.72rem] text-neutral-400">
      <p>tronito. · El ranking que premia la viralidad</p>
      <p className="mt-2">
        Los puestos cambian según las ofertas realizadas por los participantes. No revisamos ni
        recomendamos lo publicado.
      </p>
      <a href="/terminos" className="mt-2 inline-block text-[#2a5fc4] underline hover:opacity-70">
        Términos y condiciones
      </a>
    </footer>
  );
}
