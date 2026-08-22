CREATE TABLE "config" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"precio_inicial" integer DEFAULT 2000 NOT NULL,
	"piso_minimo_absoluto" integer DEFAULT 2000 NOT NULL,
	"piso_porcentaje_bp" integer DEFAULT 2000 NOT NULL,
	"porcentaje_incremento_bp" integer DEFAULT 500 NOT NULL,
	"monto_incremento_minimo" integer DEFAULT 500 NOT NULL,
	"duracion_ventana_protegida_min" integer DEFAULT 30 NOT NULL,
	"tiempo_para_llegar_al_piso_horas" integer DEFAULT 12 NOT NULL,
	"curva_decaimiento" varchar(20) DEFAULT 'exponencial' NOT NULL,
	"subasta_pausada" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_intents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expected_price" integer NOT NULL,
	"titulo" varchar(120) NOT NULL,
	"descripcion" varchar(500) NOT NULL,
	"url" text NOT NULL,
	"imagen_url" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"mp_preference_id" varchar(64),
	"mp_payment_id" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "rate_limit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip_hash" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "throne_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titulo" varchar(120) NOT NULL,
	"descripcion" varchar(500) NOT NULL,
	"url" text NOT NULL,
	"imagen_url" text,
	"monto_pagado" integer NOT NULL,
	"mp_payment_id" varchar(64) NOT NULL,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"oculto" boolean DEFAULT false NOT NULL,
	CONSTRAINT "throne_history_mp_payment_id_unique" UNIQUE("mp_payment_id")
);
--> statement-breakpoint
CREATE INDEX "rate_limit_log_ip_hash_created_at_idx" ON "rate_limit_log" USING btree ("ip_hash","created_at");--> statement-breakpoint
CREATE INDEX "throne_history_paid_at_idx" ON "throne_history" USING btree ("paid_at");--> statement-breakpoint
CREATE INDEX "throne_history_monto_pagado_idx" ON "throne_history" USING btree ("monto_pagado");