import { Footer } from "@/components/Footer";

export const metadata = { title: "Términos y condiciones — Tronito" };

export default function TerminosPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 p-6 py-10 text-neutral-800">
        <h1 className="text-2xl font-bold text-neutral-900">Términos y Condiciones de Tronito</h1>
        <p className="text-sm text-neutral-500">Última actualización: 22 de agosto de 2026</p>

        <p>
          Al usar Tronito y al comprar un lugar en el sitio, aceptas estos términos en su
          totalidad. Si no estás de acuerdo, no uses el servicio.
        </p>

        <Seccion titulo="1. Qué es Tronito">
          <p>
            Tronito es un <strong>experimento de subasta de publicidad</strong>. Existe un único
            puesto destacado (el &ldquo;#1&rdquo; o &ldquo;el trono&rdquo;) que se compra: quien
            paga el precio vigente en ese momento aparece en el primer lugar, con el título, la
            descripción y el enlace que haya ingresado.
          </p>
          <p>
            Tronito <strong>no es</strong> un juego de azar, ni una inversión, ni un sorteo, ni una
            promesa de ganancia. Es, simplemente, espacio publicitario que se subasta de forma
            continua.
          </p>
        </Seccion>

        <Seccion titulo="2. Cómo funciona">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Solo se subasta el puesto #1. El precio para tomarlo lo determina el sistema en
              tiempo real.
            </li>
            <li>
              El precio <strong>sube</strong> cada vez que alguien toma el #1, y{" "}
              <strong>baja</strong> progresivamente cuando nadie lo toma, hasta un precio mínimo.
              El precio que verás al momento de pagar es el vigente en ese instante.
            </li>
            <li>
              <strong>Cualquiera puede superarte</strong> pagando el precio vigente y quitarte el
              #1 en cualquier momento. Al ser superado, tu anuncio pasa a la lista de puestos
              anteriores.
            </li>
            <li>
              Puedes volver a tomar el #1 pagando nuevamente el precio vigente en ese momento, que
              puede ser distinto al que pagaste antes.
            </li>
            <li>
              La lista de puestos anteriores (&ldquo;salón de la fama&rdquo;) muestra montos ya
              pagados; esos montos son históricos y no cambian.
            </li>
          </ul>
        </Seccion>

        <Seccion titulo="3. Los pagos no son reembolsables">
          <p>
            Todos los pagos son <strong>finales y no reembolsables</strong>. Comprar el #1 te da
            visibilidad en el momento en que lo compras, <strong>no</strong> un lugar permanente.
            Puedes ser superado segundos después de pagar, y en ese caso no corresponde reembolso
            alguno. Al pagar, declaras entender y aceptar esto.
          </p>
        </Seccion>

        <Seccion titulo="4. Sin garantías ni recomendaciones">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Comprar un lugar <strong>no garantiza ningún resultado</strong>: ni visitas, ni
              ventas, ni clics, ni tiempo mínimo en el #1.
            </li>
            <li>
              Nada de lo que aparece en Tronito está <strong>revisado, verificado ni
              recomendado</strong> por Tronito. Los anuncios, enlaces y productos son
              responsabilidad exclusiva de quien los publica.
            </li>
            <li>
              Tronito no se hace responsable por el contenido, la veracidad, la legalidad ni el
              funcionamiento de los sitios enlazados por los anunciantes.
            </li>
          </ul>
        </Seccion>

        <Seccion titulo="5. Reglas de contenido">
          <p>Al publicar, te comprometes a no incluir contenido que:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Sea ilegal, fraudulento o engañoso.</li>
            <li>
              Infrinja derechos de terceros (marcas, propiedad intelectual, imagen, privacidad).
            </li>
            <li>Contenga discurso de odio, acoso, violencia o discriminación.</li>
            <li>Sea sexual o pornográfico, o dirigido a menores de edad.</li>
            <li>
              Promueva estafas, esquemas piramidales, sustancias ilegales, armas o actividades
              peligrosas.
            </li>
            <li>Incluya malware, phishing o enlaces maliciosos.</li>
          </ul>
          <p>Eres el único responsable del contenido que publicas y de contar con los derechos para hacerlo.</p>
        </Seccion>

        <Seccion titulo="6. Moderación">
          <p>
            Tronito puede, a su entera discreción y sin aviso previo,{" "}
            <strong>ocultar o eliminar</strong> cualquier anuncio que infrinja estas reglas o que
            considere inapropiado, <strong>sin derecho a reembolso</strong> cuando la eliminación
            se deba a un incumplimiento de tu parte. Tronito también puede{" "}
            <strong>pausar o suspender</strong> el servicio total o parcialmente en cualquier
            momento.
          </p>
        </Seccion>

        <Seccion titulo="7. Pagos">
          <p>
            Los pagos se procesan a través de <strong>MercadoPago</strong>. Al pagar, aceptas
            también los términos y condiciones de MercadoPago. Tronito no almacena los datos de tu
            medio de pago; ese procesamiento lo realiza MercadoPago.
          </p>
        </Seccion>

        <Seccion titulo="8. Edad mínima">
          <p>
            Debes ser <strong>mayor de 18 años</strong> y tener capacidad legal para contratar. Al
            usar Tronito, declaras cumplir con este requisito.
          </p>
        </Seccion>

        <Seccion titulo="9. Limitación de responsabilidad">
          <p>
            En la máxima medida permitida por la ley, Tronito se ofrece &ldquo;tal cual&rdquo; y
            &ldquo;según disponibilidad&rdquo;. Tronito no será responsable por daños directos,
            indirectos, incidentales o consecuentes derivados del uso del servicio, incluyendo
            pérdida de dinero, de oportunidades o de datos. Tu único recurso ante disconformidad
            con el servicio es dejar de usarlo.
          </p>
        </Seccion>

        <Seccion titulo="10. Cambios">
          <p>
            Tronito puede modificar estos términos y las mecánicas del servicio (incluidos los
            parámetros de precio) en cualquier momento. La versión vigente será siempre la
            publicada en esta página. El uso continuado del servicio implica la aceptación de los
            cambios.
          </p>
        </Seccion>

        <Seccion titulo="11. Ley aplicable">
          <p>
            Estos términos se rigen por las leyes de la <strong>República de Chile</strong>.
            Cualquier controversia se someterá a los tribunales competentes de Chile.
          </p>
        </Seccion>

        <Seccion titulo="12. Contacto">
          <p>
            ¿Tuviste un problema o tienes una consulta? Escríbenos a{" "}
            <a href="mailto:f.valdebenito.alarcon@gmail.com" className="underline">
              f.valdebenito.alarcon@gmail.com
            </a>
            .
          </p>
        </Seccion>

        <hr className="border-neutral-200" />

        <p className="text-sm italic text-neutral-500">
          Tronito es un experimento. Los lugares se compran y se pierden: cualquiera puede
          superarte pagando más. Nada de lo que aparece aquí está revisado ni recomendado por
          Tronito, y comprar un lugar no garantiza ningún resultado.
        </p>
      </main>
      <Footer />
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold text-neutral-900">{titulo}</h2>
      {children}
    </section>
  );
}
