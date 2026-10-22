# Arquitectura y decisiones

## Piezas

- **frontend/**: app React (Vite). Se compila a archivos estáticos que sirve Caddy.
- **backend/**: API Express + TypeScript. Habla con PostgreSQL con SQL directo (`pg`), sin ORM.
- **db/**: `schema.sql` (estado inicial) y `migraciones/` (cambios posteriores).
- **deploy/**: instalación automática de la base de datos y script del primer owner.

## Capas de la API (backend/src)

| Carpeta | Responsabilidad |
|---|---|
| `routes/` | Define la URL y qué middlewares la protegen (`requireAuth`, `requireRol`). |
| `controllers/` | Lee la petición, llama a los repositorios y responde. |
| `schemas/` | Validación de la entrada con zod. |
| `repositories/` | El único lugar con SQL, siempre parametrizado (`$1`, `$2`...). |
| `middlewares/` | Sesión, roles y límite de intentos de login. |
| `utils/` | Errores HTTP, token JWT, permisos por sucursal, auditoría. |
| `config/` | Variables de entorno, conexión a la base, carpeta de fotos, fecha de hoy. |

Las escrituras que se auditan usan `conTransaccion`: el cambio y su registro de auditoría se guardan juntos o no se guarda ninguno.

## Sesión y permisos

- Login con usuario y contraseña (bcrypt). La sesión es un JWT en la cookie `sesion`: `httpOnly`, `SameSite=Strict`, 8 horas, `secure` en producción.
- El token solo lleva el id. El rol y la sucursal se leen de la base **en cada petición**, así que desactivar a un usuario, su rol o su sucursal surte efecto al instante.
- 401 = sin sesión. 403 = con sesión pero sin permiso.
- Login: máximo 10 intentos fallidos por IP cada 15 minutos (en memoria). En producción la API confía en un proxy (`trust proxy`), que es Caddy.
- ADMIN solo trabaja con su sucursal. OWNER con cualquiera (al crear, debe indicar `sucursal_id`). Sucursales, categorías, usuarios y auditoría solo los modifica el OWNER. Todo se valida en el servidor.

## Base de datos

- Tablas: `sucursal`, `rol`, `usuario`, `categoria`, `producto`, `descuento`, `descuento_producto`, `auditoria`.
- **Borrado lógico**: "eliminar" pone `activo = false`. Los nombres de categoría y de usuario son únicos solo entre los activos (migración 002).
- Dinero en `NUMERIC` (se lee como número con `::float8`). Fechas de descuento en `DATE` (se leen como texto con `::text`).
- "Hoy" se calcula en la zona horaria de Bogotá (`HOY_SQL` en `config/fechas.ts`).
- Dos usuarios de base de datos: el dueño (crea y cambia la estructura) y `menu_app`, con el que se conecta la API. `menu_app` lee y escribe datos, pero no puede modificar la estructura ni borrar o editar la auditoría (lo fija `deploy/db-init/01-init.sh`).

## Descuentos

Cada producto aplica el **mejor** descuento vigente (el que deja el precio final más bajo); no se suman. El precio final se calcula en la consulta SQL y nunca se guarda.

## Fotos

`POST /api/productos/:id/imagen`: multer en memoria (máximo 5 MB; jpg, png o webp), luego sharp rota según la cámara, limita a 800 px y convierte a WebP. Se guarda con nombre UUID en `uploads/`, se sirve en `/uploads` y la foto anterior se borra.

## Migraciones

- Instalación nueva: se aplican `schema.sql` y todas las migraciones, en orden, automáticamente.
- Instalación existente: las migraciones nuevas se aplican a mano (README, sección "Actualizar").
- **Nunca se edita una migración ya aplicada**: se crea una nueva con el siguiente número.

## Frontend

React + Vite, `react-router-dom` para las rutas, `@tanstack/react-query` para los datos del servidor, `react-hook-form` para los formularios, `axios` (cliente en `src/api/cliente.ts`) y CSS plano en `src/index.css`. Las rutas del panel se protegen con `RutaProtegida` (por rol) y `RequiereSucursal` (cuando la pantalla necesita una sucursal).

## Despliegue

`docker-compose.prod.yml` levanta tres servicios: `db` (PostgreSQL 17, se inicializa con `deploy/db-init`), `api` (imagen multi-etapa, usuario sin privilegios) y `web` (Caddy con el frontend compilado; reenvía `/api` y `/uploads` a la API). Solo `web` publica puertos. Volúmenes: `pgdata`, `uploads`, `caddy_data`, `caddy_config`.

## Cómo agregar una función

1. Esquema zod en `schemas/`.
2. Función con su SQL en `repositories/`.
3. Controlador en `controllers/`.
4. Ruta en `routes/`, con `requireAuth` y, si hace falta, `requireRol`.
5. Si escribe datos, registrar la auditoría dentro de la misma transacción.
6. Si cambia la base de datos, una migración nueva en `db/migraciones/`.
7. Función de cliente en `frontend/src/api/` y la página que la usa.

## Pendientes conocidos

- Cerrar sesión solo borra la cookie: un token ya emitido sigue valiendo hasta 8 horas.
- El límite de intentos de login se reinicia con la API.
- Los mensajes de validación de productos, categorías, sucursales y login están en inglés.
- `imagen_url` acepta cualquier texto de hasta 300 caracteres (debería limitarse a las fotos que sube la propia app).
- Contraseña mínima de 5 caracteres (se recomienda 8).
- Caddy no envía cabecera CSP.
- HTTPS con dominio real y la instalación en una máquina limpia siguen sin probarse.
