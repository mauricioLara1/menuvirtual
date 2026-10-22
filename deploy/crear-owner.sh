#!/usr/bin/env bash
# Uso:  ./deploy/crear-owner.sh [usuario]      (por defecto: owner)
set -euo pipefail
cd "$(dirname "$0")/.."

COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.prod"
USUARIO="${1:-owner}"

read -r -s -p "Contraseña del OWNER (mínimo 8 caracteres): " PW; echo
read -r -s -p "Repite la contraseña: " PW2; echo
[ "$PW" = "$PW2" ] || { echo "ERROR: las contraseñas no coinciden"; exit 1; }
[ "${#PW}" -ge 8 ] || { echo "ERROR: mínimo 8 caracteres"; exit 1; }

# La clave viaja por stdin (no queda en la lista de procesos) y se hashea con bcrypt
HASH=$(printf '%s' "$PW" | $COMPOSE exec -T api node -e \
  "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>require('bcrypt').hash(d,12).then(console.log))")
unset PW PW2
[ -n "$HASH" ] || { echo "ERROR: el hash salió vacío, no se creó nada"; exit 1; }

$COMPOSE exec -T db sh -c \
  'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v usuario="$0" -v hash="$1"' \
  "$USUARIO" "$HASH" <<'SQL'
INSERT INTO usuario (usuario, password_hash, rol_id, sucursal_id)
VALUES (:'usuario', :'hash', (SELECT id FROM rol WHERE nombre = 'OWNER'), NULL);
SQL

echo "Listo: usuario OWNER '$USUARIO' creado."
