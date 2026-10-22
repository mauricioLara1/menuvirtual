#!/bin/bash
set -euo pipefail

PSQL=(psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB")

echo ">> Creando tablas"
"${PSQL[@]}" -f /app-db/schema.sql

echo ">> Aplicando migraciones"
for f in /app-db/migraciones/*.sql; do
  echo "   $f"
  "${PSQL[@]}" -f "$f"
done

echo ">> Roles de la aplicación"
"${PSQL[@]}" <<'SQL'
INSERT INTO rol (nombre, descripcion) VALUES ('OWNER', 'Superusuario'), ('ADMIN', 'Admin de sucursal');
SQL

echo ">> Usuario limitado de la API"
"${PSQL[@]}" -v app_user="$APP_DB_USER" -v app_pass="$APP_DB_PASSWORD" -v db_name="$POSTGRES_DB" <<'SQL'
CREATE USER :"app_user" WITH PASSWORD :'app_pass';
GRANT CONNECT ON DATABASE :"db_name" TO :"app_user";
GRANT USAGE ON SCHEMA public TO :"app_user";
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO :"app_user";
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO :"app_user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :"app_user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO :"app_user";
REVOKE UPDATE, DELETE ON auditoria FROM :"app_user";
SQL

echo ">> Base de datos lista"
