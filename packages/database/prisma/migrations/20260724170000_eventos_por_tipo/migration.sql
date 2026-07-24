-- Campos específicos por tipo de evento (Presencial/Online/Clube/Análise) +
-- estado explícito de recorrência (RecurrenceMode), ver docs/contexto.md
-- § "3ª página de interação: Eventos".

CREATE TYPE "RecurrenceMode" AS ENUM ('UNICO', 'RECORRENTE', 'PERMANENTE');
CREATE TYPE "ClubeTipo" AS ENUM ('LIVRO', 'CINE', 'TEATRO', 'NOVELA', 'TEXTO', 'VIDEO');

ALTER TABLE "eventos"
  ADD COLUMN "organizerName" TEXT,
  ADD COLUMN "coverImageUrl" TEXT,
  ADD COLUMN "locationName" TEXT,
  ADD COLUMN "locationUrl" TEXT,
  ADD COLUMN "isFree" BOOLEAN,
  ADD COLUMN "ticketUrl" TEXT,
  ADD COLUMN "clubeTipo" "ClubeTipo",
  ADD COLUMN "obraNome" TEXT,
  ADD COLUMN "dayOfWeek" INTEGER,
  ADD COLUMN "recurrenceMode" "RecurrenceMode" NOT NULL DEFAULT 'UNICO',
  ADD COLUMN "recurrenceText" TEXT;

-- Backfill dos eventos já existentes (criados antes deste campo existir),
-- a partir da regra antiga (recurrenceFrequency/recurrenceUntil).
UPDATE "eventos"
SET "recurrenceMode" = CASE
  WHEN "recurrenceFrequency" IS NULL THEN 'UNICO'
  WHEN "recurrenceUntil" IS NULL THEN 'PERMANENTE'
  ELSE 'RECORRENTE'
END::"RecurrenceMode";
