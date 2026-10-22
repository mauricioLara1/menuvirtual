-- 002: los nombres de categoría y de usuario solo deben ser únicos entre los activos.
-- Así, al eliminar (borrado lógico), el nombre queda libre para volver a usarse.
BEGIN;

ALTER TABLE categoria DROP CONSTRAINT IF EXISTS categoria_nombre_key;
CREATE UNIQUE INDEX categoria_nombre_activa_uq ON categoria (lower(nombre)) WHERE activo = true;

ALTER TABLE usuario DROP CONSTRAINT IF EXISTS usuario_usuario_key;
CREATE UNIQUE INDEX usuario_usuario_activo_uq ON usuario (lower(usuario)) WHERE activo = true;

COMMIT;
