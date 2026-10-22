## Cómo está hecho

```
Navegador --HTTPS--> Caddy --/api y /uploads--> API (Express) --> PostgreSQL
                       |
                       +-- archivos de la app (React)
```

- **Frontend:** React + Vite + TypeScript.
- **Backend:** Node.js + Express + TypeScript, con SQL directo (sin ORM).
- **Base de datos:** PostgreSQL 17.
- **Servidor web:** Caddy (HTTPS automático con Let's Encrypt).
- **Empaque:** Docker Compose. Solo Caddy se publica a internet; la API y la base de datos quedan en la red interna.

## Requisitos del servidor

- Linux con **Docker** y **Docker Compose v2**.
- Un **dominio** (por ejemplo `menu.minegocio.com`) apuntando a la IP del servidor.
- Puertos **80 y 443** abiertos (Caddy los usa para obtener y renovar el certificado).

## Instalación

Los comandos se ejecutan desde la carpeta del proyecto.

**1. Descargar el proyecto**

```bash
git clone <URL-DEL-REPOSITORIO> menu-virtual
cd menu-virtual
```

**2. Configurar.** Se copia la plantilla y se rellena con claves aleatorias (los comandos no las muestran en pantalla). Cambia `menu.minegocio.com` por tu dominio:

```bash
cp .env.prod.example .env.prod
sed -i "s|^SITE_ADDRESS=.*|SITE_ADDRESS=menu.minegocio.com|; s|^HTTP_PORT=.*|HTTP_PORT=80|; s|^HTTPS_PORT=.*|HTTPS_PORT=443|" .env.prod
sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=$(openssl rand -hex 16)|" .env.prod
sed -i "s|^APP_DB_PASSWORD=.*|APP_DB_PASSWORD=$(openssl rand -hex 16)|" .env.prod
sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -hex 32)|" .env.prod
chmod 600 .env.prod
```

`.env.prod` contiene las claves del sistema: **no se sube a Git** y conviene guardar una copia en un lugar seguro (si se pierde `JWT_SECRET` solo se cierran las sesiones, pero si se pierden las claves de la base de datos hay que reinstalar).

**3. Levantar.** La primera vez construye las imágenes y la base de datos se instala sola (tablas, roles y un usuario de la API con permisos limitados):

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
```

Los tres servicios deben aparecer en ejecución, con `db` y `api` en `healthy`.

**4. Crear el primer OWNER.** Pide la contraseña (mínimo 8 caracteres) y no la guarda en ningún archivo:

```bash
./deploy/crear-owner.sh
```

**5. Entrar.** Abre `https://tu-dominio/login`, entra como `owner` y crea, en este orden: una **sucursal**, las **categorías** (con su orden en el menú) y los **productos**. El menú público queda en `https://tu-dominio/menu/1` (el número es el id de la sucursal; la página de inicio lista todas).

> La instalación nace **vacía** a propósito: no incluye datos de demostración.


## Estructura del proyecto

```
backend/                API (Express + TypeScript) y su Dockerfile
  src/routes            URLs -> controladores
  src/controllers       reciben la petición y responden
  src/schemas           validación de datos de entrada (zod)
  src/repositories      el único lugar con SQL
  src/middlewares       sesión, roles, límite de intentos
frontend/               app React, Dockerfile y Caddyfile
db/                     schema.sql, migraciones/ y seed.sql (datos de demostración, solo desarrollo)
deploy/                 instalación de la base de datos y script del primer owner
docker-compose.yml      desarrollo (base de datos y pgAdmin)
docker-compose.prod.yml producción (base de datos, API y Caddy)
```
