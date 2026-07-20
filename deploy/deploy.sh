#!/usr/bin/env bash
# Executado na VPS pelo GitHub Actions (ver .github/workflows/deploy.yml).
# Vive em /opt/clube/deploy.sh.
#
# Recebe IMAGE_TAG e GHCR_OWNER do workflow; o resto vem de /opt/clube/.env,
# que existe SOMENTE no servidor e nunca é versionado (CPF_PEPPER e chaves
# RS256 — ver contexto.md §2).
set -euo pipefail

APP_DIR=/opt/clube
cd "$APP_DIR"

export IMAGE_TAG="${IMAGE_TAG:-latest}"
export GHCR_OWNER="${GHCR_OWNER:?GHCR_OWNER nao definido}"

echo ">> baixando imagens ${IMAGE_TAG}"
docker compose --env-file "$APP_DIR/.env" pull

# Migrations ANTES de trocar a aplicação: se a migration falhar, os
# containers antigos continuam servindo e o deploy aborta (set -e) sem
# derrubar o site.
echo ">> aplicando migrations"
docker compose --env-file "$APP_DIR/.env" run --rm --entrypoint sh api -c \
  "cd /app/packages/database && npx prisma migrate deploy"

echo ">> subindo a stack"
docker compose --env-file "$APP_DIR/.env" up -d --remove-orphans

echo ">> aguardando a API responder"
for i in $(seq 1 30); do
  if docker compose --env-file "$APP_DIR/.env" exec -T api node -e \
      "fetch('http://127.0.0.1:3333/bandeiras').then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
    echo "API respondendo"
    break
  fi
  [ "$i" = "30" ] && { echo "!! API nao respondeu — mostrando logs"; docker compose logs --tail=50 api; exit 1; }
  sleep 2
done

# Imagens antigas se acumulam rápido num disco de 34 GB.
echo ">> limpando imagens orfas"
docker image prune -f >/dev/null

echo ">> estado final"
docker compose --env-file "$APP_DIR/.env" ps
