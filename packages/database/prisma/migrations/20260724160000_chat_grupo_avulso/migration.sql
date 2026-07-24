-- "Roda de Conversa" avulsa: grupo de chat criado direto da página de
-- chat, sem vínculo com uma Roda/comunidade.
ALTER TABLE "chats" ADD COLUMN "name" TEXT;
ALTER TABLE "chats" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "chats" ADD COLUMN "creatorId" TEXT;

ALTER TABLE "chats" ADD CONSTRAINT "chats_creatorId_fkey"
  FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
