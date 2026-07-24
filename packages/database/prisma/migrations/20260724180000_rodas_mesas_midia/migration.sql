-- Roda: gif em loop + até 3 links de música; Mesa: descrição + organizador
-- (criador). Ver docs/contexto.md § "4ª página de interação: Rodas".

ALTER TABLE "rodas"
  ADD COLUMN "gifUrl" TEXT,
  ADD COLUMN "musicUrls" TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE "mesas"
  ADD COLUMN "description" VARCHAR(100),
  ADD COLUMN "creatorId" TEXT;

ALTER TABLE "mesas"
  ADD CONSTRAINT "mesas_creatorId_fkey"
  FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
