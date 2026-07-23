-- Galeria de até 3 fotos no perfil (o limite é validado na API).
ALTER TABLE "profiles" ADD COLUMN "photos" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Perfis existentes: a foto atual passa a ser o primeiro item da galeria.
UPDATE "profiles" SET "photos" = ARRAY["photoUrl"] WHERE "photoUrl" IS NOT NULL;

-- Descrição passa de 1000 para 600 caracteres (spec do cliente). O TRIM
-- evita que a alteração falhe caso já exista bio mais longa.
UPDATE "profiles" SET "bio" = LEFT("bio", 600) WHERE LENGTH("bio") > 600;
ALTER TABLE "profiles" ALTER COLUMN "bio" TYPE VARCHAR(600);
