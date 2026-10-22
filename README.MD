# Menú virtual

Aplicación web de menú digital para restaurantes con una o varias sucursales. El cliente final ve el menú desde el celular, sin cuenta. El personal administra productos, fotos y descuentos con usuario y contraseña.

## Qué incluye

- **Menú público** por sucursal (`/menu/<id>`): categorías ordenadas, foto, descripción, precio y descuentos vigentes.
- **Panel de administración** (`/admin`): productos (agregar, modificar, quitar), fotos y descuentos de la sucursal del usuario.
- **Panel del dueño (OWNER)**: además, sucursales, categorías, usuarios y auditoría (quién hizo qué y cuándo).

| Acción | ADMIN | OWNER |
|---|---|---|
| Ver el menú público | público | público |
| Productos, fotos y descuentos | solo de su sucursal | de cualquier sucursal |
| Sucursales y categorías | no | sí |
| Usuarios y auditoría | no | sí |
| Cambiar su propia contraseña | sí | sí |

## Uso diario

Para abreviar los comandos, define esto una vez por sesión de terminal:

```bash
C="docker compose -f docker-compose.prod.yml --env-file .env.prod"
```

```bash
$C ps                  # estado de los servicios
$C logs api --tail 50  # últimos mensajes de la API (errores, etc.)
$C restart api         # reiniciar solo la API
$C down                # apagar (los datos se conservan)
$C up -d               # volver a encender
```

**Nunca uses `down -v`** en un servidor con datos reales: la opción `-v` borra los volúmenes, es decir, la base de datos y las fotos.

## Actualizar a una versión nueva

1. Haz una copia de seguridad (sección siguiente).
2. Descarga y reconstruye:

```bash
   git pull
   $C up -d --build
```

3. **Migraciones de base de datos.** La instalación inicial aplica `db/migraciones/*.sql` una sola vez. Si la versión nueva trae archivos de migración nuevos, se aplican a mano, uno por uno y en orden, solo los que aún no se hayan aplicado:

```bash
   $C exec -T db sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < db/migraciones/NNN_nombre.sql
```

## Copias de seguridad

Hay dos cosas que respaldar: la base de datos y las fotos. Conviene hacerlo a diario (por ejemplo con `cron`) y guardar las copias **fuera del servidor**.

```bash
# Base de datos (incluye "DROP ... IF EXISTS" para poder restaurar encima)
$C exec -T db sh -c 'pg_dump --clean --if-exists -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > "respaldo-bd-$(date +%F).sql.gz"

# Fotos
docker run --rm -v menu-virtual-prod_uploads:/datos:ro -v "$PWD":/respaldo alpine tar czf "/respaldo/respaldo-fotos-$(date +%F).tar.gz" -C /datos .
```

**Restaurar** (reemplaza los datos actuales por los de la copia):

```bash
gunzip -c respaldo-bd-AAAA-MM-DD.sql.gz | $C exec -T db sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
docker run --rm -v menu-virtual-prod_uploads:/datos -v "$PWD":/respaldo alpine sh -c 'cd /datos && tar xzf /respaldo/respaldo-fotos-AAAA-MM-DD.tar.gz'
```

## Seguridad

- Las contraseñas se guardan con **bcrypt**; nunca en texto plano.
- La sesión viaja en una cookie `httpOnly`, `SameSite=Strict` y `secure` (HTTPS). Por eso la app y la API deben vivir bajo el mismo dominio, como lo deja Caddy.
- En cada petición se vuelve a consultar el usuario: si se desactiva o cambia de rol, el efecto es inmediato.
- Los permisos por sucursal se validan **en el servidor**, no solo en la pantalla.
- El login limita los intentos fallidos (10 cada 15 minutos por IP).
- La API se conecta con un usuario de base de datos limitado: puede leer y escribir filas, pero no modificar la estructura ni borrar la auditoría.
- La base de datos y la API no se publican a internet.
- Las fotos se re-procesan (se convierten a WebP y se redimensionan), lo que descarta archivos que no sean imágenes.

## Limitaciones conocidas

- "Cerrar sesión" borra la cookie del navegador, pero un token ya emitido sigue siendo válido hasta 8 horas si alguien lo hubiera copiado. Desactivar al usuario sí corta el acceso al instante.
- El límite de intentos de login vive en memoria: se reinicia cuando se reinicia la API.
- Un usuario o una categoría eliminados siguen ocupando su nombre (el borrado es lógico).
- Los mensajes de validación de productos, categorías y sucursales están en inglés.
- Las migraciones nuevas no se aplican solas en instalaciones existentes (ver "Actualizar").

## Problemas frecuentes

- **No consigue el certificado HTTPS:** revisa que el dominio apunte a la IP del servidor y que los puertos 80 y 443 estén abiertos. Los detalles aparecen en `$C logs web`.
- **El login "no se queda":** la cookie es `secure`, así que en un servidor real hay que entrar por `https://`. (Solo en `localhost` funciona sobre `http`.)
- **"port is already allocated" al levantar:** otro programa usa el puerto 80 o 443. Detenlo o cambia `HTTP_PORT` y `HTTPS_PORT` en `.env.prod`.
- **Olvidé la contraseña del OWNER:** crea otro owner con `./deploy/crear-owner.sh recuperacion`, entra con él y, desde *Usuarios*, elimina o edita el anterior.

## Desarrollo local

Requisitos: Node 24, Docker.

```bash
cp .env.example .env        # y rellena las claves
docker compose up -d        # base de datos de desarrollo (puerto 5433) y pgAdmin (5050)

cd backend && npm install && npm run dev     # API en http://localhost:3000
cd frontend && npm install && npm run dev    # app en http://localhost:5173
```

El servidor de desarrollo de Vite reenvía `/api` y `/uploads` a la API, igual que Caddy en producción. La primera vez hay que crear las tablas y el usuario limitado de la API en la base de desarrollo; los pasos están en `docs/`. Para revisar tipos: `npm run typecheck` en `backend/`.
