# Contexto de Tronito — para retomar

_Generado el 2026-08-22 al cierre de una sesión de trabajo. Este documento resume qué es el
proyecto, qué se construyó, qué decisiones se tomaron y qué queda pendiente, para retomarlo sin
tener que releer todo el historial de chat._

## Qué es Tronito

Sitio "rey de la colina" para publicidad: existe **un solo puesto #1** (el trono). Quien paga el
precio vigente se convierte en el rey; cualquiera puede robárselo pagando el nuevo precio, que
sube al comprar y decae con el tiempo hacia un piso.

**Regla de negocio central, confirmada explícitamente y NO renegociable sin decisión nueva:**
un solo trono, hay que igualar o superar el precio vigente para ser rey. Se descartó
deliberadamente el mecanismo de lugarcito.online de "pagar cualquier monto y quedar en un puesto
inferior sin destronar a nadie" — eso NO existe en Tronito.

## Estado del repo / deploy

- Repo: `github.com/FreddyVal/tronito`, rama `master`.
- Deploy en Vercel: **https://tronito.vercel.app** (dominio de producción de Vercel; el proyecto
  sigue en `MP_ENV=sandbox`, no en producción real de MercadoPago todavía).
- DB: Neon Postgres (proyecto ya creado, migrado). Connection string pooled en `.env.local`
  (gitignoreado) y en las env vars de Vercel.
- Migraciones aplicadas: `0000` (schema inicial), `0001` (columna `bloqueo_una_hora_activo`),
  `0002` (columna `texto_boton`). Todas corridas contra la DB real de Neon.
- Panel de admin en `/admin`, protegido con HTTP Basic Auth (`ADMIN_USER`/`ADMIN_PASSWORD`).

**⚠️ Al cierre de esta sesión hay cambios SIN commitear** (el tema oro/plata/bronce del podio +
el texto explicativo del Salón de la fama): `src/app/globals.css`, `src/components/EntradaCard.tsx`,
`src/components/FormularioRobar.tsx`, `src/components/TronoApp.tsx`. Todo lo anterior a eso ya
está commiteado y pusheado a `origin/master` (el usuario fue commiteando bastante seguido desde
el IDE en paralelo a esta sesión, así que `git log` es la fuente de verdad, no esta lista).

## Bloqueador conocido: sandbox de MercadoPago

El pago de prueba de punta a punta **todavía no se completó con éxito**. El sandbox de
MercadoPago para Chile tiene un bug de plataforma documentado (loop de redirects infinito en el
paso de login del comprador de prueba), reproducido en Chrome, Edge y Firefox — confirmado que
no es un bug de nuestro código (la preferencia se crea bien, el redirect a MercadoPago funciona,
el problema está dentro del propio flujo de login de MercadoPago). Alternativas para retomar:
- Reintentar más tarde (el sandbox de Chile es conocido por ser inestable por temporadas).
- En el checkout, usar la opción **"Tarjeta"** bajo "Sin cuenta de Mercado Pago" para saltarse el
  login roto por completo.

Una vez que un pago de sandbox se complete, falta verificar: que el webhook corona al nuevo rey,
que aparece en el salón de la fama, y que `/admin` muestra la transacción.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind v4, Turbopack), fuente Inter.
- Postgres en Neon vía `@neondatabase/serverless` (driver `Pool`, no el HTTP de un solo shot,
  porque el webhook necesita transacciones reales con `SELECT ... FOR UPDATE`) + Drizzle ORM.
- MercadoPago Checkout Pro (Preferences API), SDK oficial `mercadopago` v3.
- Deploy en Vercel.

## Mecánica implementada

- **Motor de precios** (`src/lib/pricing.ts`, función pura, testeada): al comprar por $P, el
  precio salta a `P + incremento`; se mantiene fijo durante la ventana protegida; después decae
  (lineal o exponencial, configurable) hacia un piso `max(piso_absoluto, piso_% * P)`. Todo
  calculado en cada lectura a partir de `(último_monto, timestamp)`, nunca mutado por un cron.
- **Bloqueo de 1 hora** (`src/lib/lock.ts`, opcional, default apagado): mientras está activo,
  nadie puede **iniciar** una compra durante la hora siguiente a cada coronación. Distinto de la
  ventana protegida (que solo congela el precio). Deliberadamente NO se aplica en el webhook — la
  regla "un pago aprobado siempre corona, sin reembolsos" sigue siendo absoluta ahí.
- **Sobre-oferta**: el comprador puede pagar más del mínimo, en pasos de $1.000, vía un stepper
  tanto en la home como en el paso final del wizard. El servidor valida que lo pagado sea ≥ precio
  vigente real en el momento del submit (si subió mientras completaba el form, se rechaza con 409
  y mensaje claro, no cobra de más silenciosamente).
- **Salón de la fama**: ranking por monto pagado (histórico, fijo para siempre) — distinto del
  precio vigente para robar el #1 (que si decae). El rey en vivo es la fila más reciente por
  `paid_at`, no necesariamente la de mayor monto (aunque normalmente coincide).
- **Moderación**: ocultar la fila del rey actual deja el trono "vacante" en la vista pública — NO
  se reasigna a un rey anterior. El precio y el bloqueo de 1h siguen basándose en el último pago
  real, esté oculto o no (reflejan plata efectivamente pagada, no visibilidad).
- **Webhook** (`src/app/api/mercadopago/webhook/route.ts`): única fuente de verdad. Valida firma
  `x-signature`, consulta el pago contra la API de MP, verifica monto == `expected_price`, corona
  dentro de una transacción con lock de fila (`config` como singleton lock) para serializar
  coronaciones concurrentes. Idempotente.
- **Rate limiting**: tabla Postgres simple (`rate_limit_log`), sin servicios externos.
- **Favicon automático**: ícono de cada tarjeta viene del favicon real del sitio de destino (vía
  el servicio público de Google), con fallback a la inicial del título si falla.

## Flujo de creación del anuncio (wizard de 3 pasos)

`src/components/FormularioRobar.tsx`, en español chileno (tú, no vos; modismos livianos como "al
tiro"):

1. **¿A dónde los mandas?** — selector de plataforma (Instagram / X / YouTube / Link externo) con
   íconos genéricos propios (NO los logos oficiales con gradiente/marca registrada, por temas de
   IP) + campo de URL. El prefijo del dominio (`instagram.com/`, etc.) es una **etiqueta fija no
   editable**, no texto dentro del input — así cambiar de plataforma solo reemplaza el prefijo y
   nunca borra lo que el usuario ya escribió, y el prefijo no se puede borrar por accidente.
2. **¿Qué quieres que diga?** — título, descripción, texto del botón (nuevo campo `textoBoton`,
   default "Ver más" si se deja vacío).
3. **Vista previa + monto** — reutiliza el mismo componente de tarjeta (`EntradaCard`) que se ve
   en el salón de la fama, con el stepper de monto, y el botón final que efectivamente publica.

## Diseño visual — historia de las iteraciones

El look pasó por varias rondas (cada una a pedido explícito del usuario):
1. Neutro (negro/blanco) → 2. Azul ("para inspirar confianza") → 3. Adaptación de un mockup HTML
propio del usuario (grid ancho de 900px, estilo tipo dashboard) → 4. Adaptación de un **segundo**
mockup HTML propio del usuario (layout angosto centrado, máx. 512px, fondo beige cálido `#e8e8e3`,
fuente Inter, paleta navy `#1a3a6b` + acento azul `#2a5fc4`) → 5. **Actual**: tarjetas del podio
con tema oro/plata/bronce y brillo animado (glow pulsante, respeta `prefers-reduced-motion`), más
texto explicativo bajo "Salón de la fama".

Importante: **nunca se clonó el diseño de lugarcito.online** (sitio de un tercero) — se rechazó
explícitamente esa solicitud por temas de propiedad intelectual. Los mockups HTML que sí se
adaptaron eran autoría propia del usuario, ya marcados como "tronito." desde el inicio.

## Archivos clave

- `src/lib/pricing.ts`, `lock.ts`, `favicon.ts`, `format.ts` — lógica pura, testeada (23 tests).
- `src/lib/config.ts`, `throne.ts`, `mercadopago.ts`, `rate-limit.ts` — lógica de negocio/DB.
- `src/db/schema.ts` — schema Drizzle (`config`, `throne_history`, `purchase_intents`,
  `rate_limit_log`).
- `src/app/api/robar`, `api/mercadopago/webhook`, `api/estado`, `api/intent/[id]` — endpoints
  públicos.
- `src/app/api/admin/*` + `src/proxy.ts` (renombrado de `middleware.ts` por deprecación en
  Next 16) — panel de admin.
- `src/components/TronoApp.tsx` — orquestador de la home (stepper, polling cada 2.5s, banner de
  destronamiento vía `localStorage` + `useSyncExternalStore`).
- `src/components/FormularioRobar.tsx` — wizard de 3 pasos.
- `src/components/EntradaCard.tsx` — tarjeta rankeada (tema oro/plata/bronce + `CardFantasma`
  para puestos vacíos decorativos cuando hay menos de 3 entradas reales).
- `src/components/SalonDeLaFama.tsx`, `Header.tsx`, `Footer.tsx`, `SandboxBanner.tsx`,
  `EstadoPago.tsx` (páginas de retorno de pago).

## Pendientes / próximos pasos

1. **Commitear y pushear** los cambios sueltos de esta sesión (tema oro/plata/bronce + texto
   explicativo) si no se hizo ya — revisar `git status` al retomar.
2. **Completar una prueba de pago end-to-end en sandbox** (bloqueado por el bug de MercadoPago
   descrito arriba). Verificar: webhook corona, aparece en salón de la fama, `/admin` muestra la
   transacción.
3. Cuando esté listo para producción real: credenciales de producción de MercadoPago (no
   `TEST-...`), `MP_ENV=production`, webhook de producción, revisar perillas desde `/admin`. Ver
   sección "Pasar a producción" en `README.md` (ya documentada en detalle).
4. Nada más quedó explícitamente pendiente de pedidos anteriores — todo lo solicitado hasta ahora
   (motor de precios, checkout, webhook, admin, bloqueo de 1h, wizard, favicon, texto del botón,
   diseño, español chileno, animación de podio) está implementado y verificado con
   `tsc`/`eslint`/`vitest`/`next build`.

## Cómo retomar

```bash
cd d:\Tronito
git status                 # ver qué queda sin commitear
npm install                # por si el lockfile cambió
npm run dev                # correr local (.env.local ya tiene DATABASE_URL de Neon)
npm run test                # 23 tests, deberían pasar todos
```

El `README.md` tiene el detalle completo de setup (Neon, MercadoPago sandbox/producción, deploy
en Vercel) por si hace falta reconfigurar algo desde cero.
