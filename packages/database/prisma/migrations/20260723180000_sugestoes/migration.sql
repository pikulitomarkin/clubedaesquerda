-- CreateTable
CREATE TABLE "sugestoes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sugiro" VARCHAR(1000) NOT NULL,
    "porque" VARCHAR(1000),
    "respondidaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sugestoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sugestoes_userId_idx" ON "sugestoes"("userId");

-- CreateIndex
CREATE INDEX "sugestoes_createdAt_idx" ON "sugestoes"("createdAt");

-- AddForeignKey
ALTER TABLE "sugestoes" ADD CONSTRAINT "sugestoes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
