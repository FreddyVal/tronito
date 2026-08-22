# Tronito

Subasta de publicidad tipo "rey de la colina": existe un único puesto #1 (el trono). Quien paga
el precio vigente aparece arriba; cualquiera puede robárselo pagando el nuevo precio. El precio
sube cada vez que alguien toma el #1 y decae con el tiempo hacia un piso, hasta que alguien lo
vuelve a tomar.

Ver el detalle completo de la mecánica en [`/terminos`](src/app/terminos/page.tsx).

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind v4)
- **Postgres** en [Neon](https://neon.tech), vía `@neondatabase/serverless` + **Drizzle ORM**
- **MercadoPago** (Checkout Pro / Preferences API), SDK oficial `mercadopago`
- Deploy en **Vercel**

## Arquitectura (resumen)

- `src/lib/pricing.ts` — motor de precios. Función pura: recibe la config, el último pago
  (monto + fecha) y "ahora", y devuelve el precio vigente. Se usa tanto en el servidor (fuente
  de verdad) como en el cliente (para animar el número bajando entre polls).
- `src/db/schema.ts` — schema Drizzle: `config` (perillas, fila única), `throne_history` (cada
  toma exitosa del trono = salón de la fama), `purchase_intents` (un intento por cada preferencia
  de MercadoPago creada), `rate_limit_log`.
- `src/app/api/robar/route.ts` — crea el intento de pago y la preferencia de MercadoPago con el
  precio calculado **en el servidor** en ese instante.
- `src/app/api/mercadopago/webhook/route.ts` — única fuente de verdad. Valida la firma, consulta
  el pago contra la API de MercadoPago, y corona al nuevo rey dentro de una transacción con
  `SELECT ... FOR UPDATE` (lock de la fila de `config`) para serializar coronaciones concurrentes.
  Idempotente: una notificación repetida no duplica la coronación.
- `src/app/api/estado/route.ts` — estado público (config, rey actual, precio vigente, salón de la
  fama), consultado por polling cada 2.5s desde el cliente (no hay SSE de larga duración: no
  encaja bien con funciones serverless en Vercel).
- `src/app/admin` + `src/proxy.ts` — panel de admin protegido con HTTP Basic Auth
  (`ADMIN_USER`/`ADMIN_PASSWORD`), perillas editables en vivo, moderación, kill switch.

## Configurar y correr en local

### 1. Base de datos (Neon)

1. Crea un proyecto en [neon.tech](https://neon.tech).
2. Copia la **connection string con pooler** (la que trae `-pooler` en el host).
3. Cópiala en `DATABASE_URL` en tu `.env.local`.

```bash
cp .env.example .env.local
```

### 2. Aplicar el schema

```bash
npm install
npm run db:migrate
```

Esto crea las tablas `config`, `throne_history`, `purchase_intents`, `rate_limit_log`. La fila de
`config` con los valores por defecto se crea sola en el primer request (lazy-init).

Si más adelante cambias `src/db/schema.ts`, corre `npm run db:generate` para generar una nueva
migración y `npm run db:migrate` para aplicarla. `npm run db:studio` abre un explorador visual de
la DB.

### 3. MercadoPago (sandbox)

1. Crea una app en el [panel de desarrolladores de MercadoPago](https://www.mercadopago.cl/developers/panel/app).
2. En **Credenciales de prueba**, copia el **Access Token** de test (`TEST-...`) a
   `MP_ACCESS_TOKEN`.
3. En **Webhooks**, configura la URL `https://TU-DOMINIO-PUBLICO/api/mercadopago/webhook` y copia
   la **Firma secreta** a `MP_WEBHOOK_SECRET`.
4. Crea uno o dos [usuarios de prueba](https://www.mercadopago.cl/developers/es/docs/checkout-pro/additional-content/your-integrations/test/accounts)
   (uno "vendedor", uno "comprador") para probar pagos de punta a punta con tarjetas de prueba.

**Importante:** el webhook necesita una URL pública para que los servidores de MercadoPago te
avisen del pago — `localhost` no sirve. Para probar en local, expón tu `npm run dev` con un túnel
(ej. `npx untun@latest tunnel http://localhost:3000`, `ngrok http 3000`, o Cloudflare Tunnel), y
usa esa URL pública tanto en `NEXT_PUBLIC_SITE_URL` como en la configuración del webhook en
MercadoPago.

`MP_ENV="sandbox"` (default) hace que el checkout use `sandbox_init_point` y muestra un banner
"MODO SANDBOX" en el sitio.

### 4. Panel de admin

Define `ADMIN_USER` y `ADMIN_PASSWORD` en `.env.local`. `/admin` y `/api/admin/*` piden Basic Auth
con esas credenciales (ver `src/proxy.ts`).

### 5. Correr

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). El panel de admin está en `/admin`.

### Tests

```bash
npm run test
```

Cubre el motor de precios (`src/lib/pricing.test.ts`): tablero vacío, ventana protegida,
decaimiento lineal y exponencial, piso por porcentaje vs. absoluto; y el bloqueo de 1 hora
(`src/lib/lock.test.ts`).

## Pasar a producción

1. **Neon**: usa la misma DB o crea una de producción; corre `npm run db:migrate` contra ella
   (con `DATABASE_URL` apuntando a producción).
2. **MercadoPago**: activa tu cuenta para producción y reemplaza `MP_ACCESS_TOKEN` y
   `MP_WEBHOOK_SECRET` por las credenciales **de producción** (no las `TEST-...`). Configura el
   webhook de producción en el panel de MercadoPago apuntando a
   `https://tu-dominio-real.com/api/mercadopago/webhook`.
3. Set `MP_ENV="production"` — esto quita el banner de sandbox y usa `init_point` (no
   `sandbox_init_point`) en el checkout.
4. `NEXT_PUBLIC_SITE_URL="https://tu-dominio-real.com"` (sin slash final).
5. Define `ADMIN_USER`/`ADMIN_PASSWORD` con credenciales reales (no las de desarrollo).
6. Revisa las perillas de precio desde `/admin` antes de anunciar el lanzamiento.
7. Verifica que `/terminos` tenga la información de contacto correcta.

### Variables de entorno en Vercel

Configura las mismas variables de `.env.example` en **Project Settings → Environment Variables**.
Puedes usar **Preview** para sandbox y **Production** para las credenciales reales de MercadoPago,
si quieres mantener ambos modos disponibles según el ambiente de deploy.

## Notas de diseño / decisiones

- **El precio nunca se guarda mutado por un cron.** Se guarda `(monto_pagado, paid_at)` de la
  última coronación y el precio vigente se calcula como función del tiempo transcurrido en cada
  lectura (`src/lib/pricing.ts`). Así nunca se desincroniza entre instancias serverless.
- **El webhook es la única fuente de verdad.** El precio que el cliente ve nunca se usa para
  procesar el pago: el servidor recalcula el precio al crear la preferencia, y el webhook vuelve a
  verificar el monto aprobado contra `purchase_intents.expected_price` antes de coronar.
- **Rate limiting** en `POST /api/robar` es una tabla Postgres simple (`rate_limit_log`), sin
  dependencias externas — suficiente para un límite básico por IP.
- **Moderación**: ocultar la entrada que es rey actual deja el trono "vacante" en la vista
  pública, pero el precio vigente sigue calculándose sobre el último pago real (el precio refleja
  plata efectivamente pagada, no la visibilidad del anuncio).
- **Notificación de destronamiento**: no hay cuentas de usuario. El navegador guarda en
  `localStorage` el id de la fila de `throne_history` que generó al pagar, y lo compara contra el
  rey actual en cada poll para mostrar el banner "te bajaron del #1".
- **Bloqueo de 1 hora (perilla `bloqueoUnaHoraActivo`, default `false`)**: distinto de la ventana
  protegida (esa solo evita que el precio baje; el trono sigue siendo robable en cualquier
  momento). Con el bloqueo activo, nadie puede **iniciar una compra** del #1 durante la hora
  siguiente a cada coronación (`src/lib/lock.ts`, aplicado en `POST /api/robar`). Deliberadamente
  **no** se aplica en el webhook: la regla de "un pago aprobado siempre corona, sin reembolsos" se
  mantiene intacta como única fuente de verdad — si alguien alcanzó a crear un intento justo antes
  de que el bloqueo se activara y su pago se aprueba después, igual lo corona (caso límite muy
  poco frecuente en la práctica, dado que bloquear la creación de nuevos intentos ya cubre el caso
  general).
