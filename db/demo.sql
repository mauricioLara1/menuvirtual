-- Datos de demostración: restaurante ficticio con cocina vallecaucana.
-- Cargar SOLO sobre una instalación vacía.
BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM sucursal) OR EXISTS (SELECT 1 FROM categoria) THEN
    RAISE EXCEPTION 'La base ya tiene datos. Carga la demo solo sobre una instalación vacía.';
  END IF;
END $$;

INSERT INTO sucursal (nombre, direccion) VALUES
  ('Sucursal Centro', 'Carrera 5 # 11-30, Cali'),
  ('Sucursal Norte',  'Avenida 6 Norte # 24-15, Cali');

INSERT INTO categoria (nombre, orden) VALUES
  ('Entradas', 1), ('Platos fuertes', 2), ('Bebidas', 3), ('Postres', 4);

INSERT INTO producto (nombre, descripcion, precio, categoria_id, sucursal_id)
SELECT v.nombre, v.descripcion, v.precio, c.id, s.id
FROM (VALUES
  ('Sucursal Centro', 'Entradas',       'Empanadas vallecaucanas x3', 'Rellenas de carne y papa, con ají de la casa', 9000),
  ('Sucursal Centro', 'Entradas',       'Aborrajados x2',             'Plátano maduro relleno de queso, fritos y dorados', 10000),
  ('Sucursal Centro', 'Entradas',       'Marranitas con hogao',       'Plátano verde aplastado con chicharrón y hogao', 12000),
  ('Sucursal Centro', 'Platos fuertes', 'Sancocho de gallina',        'Con plátano, yuca, mazorca y arroz blanco', 26000),
  ('Sucursal Centro', 'Platos fuertes', 'Arroz atollado',             'Arroz caldoso con cerdo, pollo y papa', 24000),
  ('Sucursal Centro', 'Platos fuertes', 'Chuleta valluna',            'Cerdo apanado con arroz, ensalada y papa criolla', 28000),
  ('Sucursal Centro', 'Platos fuertes', 'Sobrebarriga criolla',       'Cocida y dorada, con salsa criolla, papa y yuca', 29000),
  ('Sucursal Centro', 'Platos fuertes', 'Pechuga a la plancha',       'Con ensalada fresca y papas', 25000),
  ('Sucursal Centro', 'Platos fuertes', 'Mojarra frita',              'Con patacón, arroz de coco y ensalada', 32000),
  ('Sucursal Centro', 'Bebidas',        'Lulada',                     'Lulo y limón macerados con hielo, la bebida típica de Cali', 8000),
  ('Sucursal Centro', 'Bebidas',        'Champús',                    'Maíz, lulo, piña y panela, servido frío', 8000),
  ('Sucursal Centro', 'Bebidas',        'Jugo de lulo',               'En agua o en leche', 7500),
  ('Sucursal Centro', 'Bebidas',        'Limonada de coco',           'Cremosa, con coco y hielo', 9000),
  ('Sucursal Centro', 'Postres',        'Cholado',                    'Hielo raspado con frutas, leche condensada y jarabe', 12000),
  ('Sucursal Centro', 'Postres',        'Manjar blanco',              'Dulce de leche del Valle, con galletas', 8000),
  ('Sucursal Centro', 'Postres',        'Brownie con helado',         'Con helado de vainilla', 12000),
  ('Sucursal Norte',  'Entradas',       'Empanadas vallecaucanas x3', 'Rellenas de carne y papa, con ají de la casa', 9500),
  ('Sucursal Norte',  'Entradas',       'Aborrajados x2',             'Plátano maduro relleno de queso, fritos y dorados', 10500),
  ('Sucursal Norte',  'Platos fuertes', 'Sancocho de gallina',        'Con plátano, yuca, mazorca y arroz blanco', 27000),
  ('Sucursal Norte',  'Platos fuertes', 'Chuleta valluna',            'Cerdo apanado con arroz, ensalada y papa criolla', 29000),
  ('Sucursal Norte',  'Platos fuertes', 'Pechuga a la plancha',       'Con ensalada fresca y papas', 26000),
  ('Sucursal Norte',  'Bebidas',        'Lulada',                     'Lulo y limón macerados con hielo, la bebida típica de Cali', 8500),
  ('Sucursal Norte',  'Bebidas',        'Jugo de lulo',               'En agua o en leche', 8000),
  ('Sucursal Norte',  'Postres',        'Cholado',                    'Hielo raspado con frutas, leche condensada y jarabe', 12500),
  ('Sucursal Norte',  'Postres',        'Manjar blanco',              'Dulce de leche del Valle, con galletas', 8500)
) AS v(sucursal, categoria, nombre, descripcion, precio)
JOIN sucursal s ON s.nombre = v.sucursal AND s.activo
JOIN categoria c ON c.nombre = v.categoria AND c.activo;

-- Descuentos vigentes desde ayer y por un año, para que la demo siempre los muestre.
INSERT INTO descuento (sucursal_id, nombre, tipo, valor, fecha_inicio, fecha_fin)
SELECT s.id, v.nombre, v.tipo, v.valor, h.hoy - 1, h.hoy + 365
FROM (VALUES
  ('Sucursal Centro', 'Almuerzo del Valle', 'PORCENTAJE', 15),
  ('Sucursal Centro', 'Refresca tu tarde',  'VALOR_FIJO', 2000),
  ('Sucursal Norte',  'Dulce tarde',        'PORCENTAJE', 10)
) AS v(sucursal, nombre, tipo, valor)
JOIN sucursal s ON s.nombre = v.sucursal
CROSS JOIN (SELECT (now() AT TIME ZONE 'America/Bogota')::date AS hoy) h;

INSERT INTO descuento_producto (descuento_id, producto_id)
SELECT d.id, p.id
FROM (VALUES
  ('Almuerzo del Valle', 'Sucursal Centro', 'Sancocho de gallina'),
  ('Almuerzo del Valle', 'Sucursal Centro', 'Arroz atollado'),
  ('Almuerzo del Valle', 'Sucursal Centro', 'Chuleta valluna'),
  ('Refresca tu tarde',  'Sucursal Centro', 'Lulada'),
  ('Refresca tu tarde',  'Sucursal Centro', 'Champús'),
  ('Dulce tarde',        'Sucursal Norte',  'Cholado'),
  ('Dulce tarde',        'Sucursal Norte',  'Manjar blanco')
) AS v(descuento, sucursal, producto)
JOIN sucursal s ON s.nombre = v.sucursal
JOIN descuento d ON d.nombre = v.descuento AND d.sucursal_id = s.id
JOIN producto p ON p.nombre = v.producto AND p.sucursal_id = s.id;

COMMIT;
