import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  varchar,
  index,
} from "drizzle-orm/pg-core";

/**
 * Fila única (id fijo = 1). El motor de precios lee estas perillas en cada
 * cálculo — nunca hardcodeadas, para que el panel de admin las cambie en vivo
 * sin redeploy.
 */
export const config = pgTable("config", {
  id: integer("id").primaryKey().default(1),

  precioInicial: integer("precio_inicial").notNull().default(2000),
  pisoMinimoAbsoluto: integer("piso_minimo_absoluto").notNull().default(2000),
  pisoPorcentajeBp: integer("piso_porcentaje_bp").notNull().default(2000), // basis points (2000 = 20.00%)
  porcentajeIncrementoBp: integer("porcentaje_incremento_bp").notNull().default(500), // 500 = 5.00%
  montoIncrementoMinimo: integer("monto_incremento_minimo").notNull().default(500),
  duracionVentanaProtegidaMin: integer("duracion_ventana_protegida_min").notNull().default(30),
  tiempoParaLlegarAlPisoHoras: integer("tiempo_para_llegar_al_piso_horas").notNull().default(12),
  curvaDecaimiento: varchar("curva_decaimiento", { length: 20 }).notNull().default("exponencial"), // "exponencial" | "lineal"
  subastaPausada: boolean("subasta_pausada").notNull().default(false),
  // Bloqueo duro: mientras esté activo, nadie puede robar el #1 durante 1h
  // tras cada coronación (a diferencia de la ventana protegida, que solo
  // evita que el precio baje pero no bloquea la compra). Duración fija en
  // código (1h); solo el on/off es configurable, según lo pedido.
  bloqueoUnaHoraActivo: boolean("bloqueo_una_hora_activo").notNull().default(false),

  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Cada fila = una toma exitosa del trono. Esta tabla ES el salón de la fama
 * (ordenar por montoPagado desc) y también determina quién es el rey actual
 * (fila no oculta con paidAt más reciente).
 */
export const throneHistory = pgTable(
  "throne_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    titulo: varchar("titulo", { length: 120 }).notNull(),
    descripcion: varchar("descripcion", { length: 500 }).notNull(),
    url: text("url").notNull(),
    imagenUrl: text("imagen_url"),

    montoPagado: integer("monto_pagado").notNull(),
    mpPaymentId: varchar("mp_payment_id", { length: 64 }).notNull().unique(),

    paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
    oculto: boolean("oculto").notNull().default(false),
  },
  (table) => [
    index("throne_history_paid_at_idx").on(table.paidAt),
    index("throne_history_monto_pagado_idx").on(table.montoPagado),
  ],
);

/**
 * Un intent por cada preferencia de MercadoPago creada. external_reference
 * en la preferencia apunta a intent.id. El webhook es la única fuente de
 * verdad que transiciona status pending -> approved/rejected/expired.
 */
export const purchaseIntents = pgTable("purchase_intents", {
  id: uuid("id").primaryKey().defaultRandom(),

  expectedPrice: integer("expected_price").notNull(),
  titulo: varchar("titulo", { length: 120 }).notNull(),
  descripcion: varchar("descripcion", { length: 500 }).notNull(),
  url: text("url").notNull(),
  imagenUrl: text("imagen_url"),

  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending | approved | rejected | expired

  mpPreferenceId: varchar("mp_preference_id", { length: 64 }),
  mpPaymentId: varchar("mp_payment_id", { length: 64 }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

/**
 * Rate limiting básico: se cuentan filas recientes por ip_hash. Se podan
 * oportunistamente filas viejas en cada insert, sin necesidad de un cron.
 */
export const rateLimitLog = pgTable(
  "rate_limit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ipHash: varchar("ip_hash", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("rate_limit_log_ip_hash_created_at_idx").on(table.ipHash, table.createdAt)],
);
