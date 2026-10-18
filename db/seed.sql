INSERT INTO rol (nombre, descripcion) VALUES
  ('OWNER', 'Superusuario'),
  ('ADMIN', 'Admin de sucursal');

INSERT INTO sucursal (nombre, direccion) VALUES
  ('Sucursal Centro', 'Calle 10 # 5-20');

INSERT INTO categoria (nombre) VALUES
  ('Entradas'), ('Platos fuertes'), ('Bebidas'), ('Postres');

INSERT INTO producto (nombre, descripcion, precio, categoria_id, sucursal_id) VALUES
  ('Empanadas x3',         'Empanadas de carne con ají casero',  9000,  (SELECT id FROM categoria WHERE nombre='Entradas'),       (SELECT id FROM sucursal LIMIT 1)),
  ('Patacones',            'Con hogao y queso',                  11000, (SELECT id FROM categoria WHERE nombre='Entradas'),       (SELECT id FROM sucursal LIMIT 1)),
  ('Bandeja paisa',        'Fríjoles, arroz, chicharrón, huevo', 32000, (SELECT id FROM categoria WHERE nombre='Platos fuertes'), (SELECT id FROM sucursal LIMIT 1)),
  ('Pechuga a la plancha', 'Con ensalada y papas',               26000, (SELECT id FROM categoria WHERE nombre='Platos fuertes'), (SELECT id FROM sucursal LIMIT 1)),
  ('Limonada natural',     'Jarra personal',                     7000,  (SELECT id FROM categoria WHERE nombre='Bebidas'),        (SELECT id FROM sucursal LIMIT 1)),
  ('Jugo de mora',         'En agua o en leche',                 8000,  (SELECT id FROM categoria WHERE nombre='Bebidas'),        (SELECT id FROM sucursal LIMIT 1)),
  ('Brownie',              'Con helado de vainilla',             12000, (SELECT id FROM categoria WHERE nombre='Postres'),        (SELECT id FROM sucursal LIMIT 1)),
  ('Flan de caramelo',     'Casero',                             9000,  (SELECT id FROM categoria WHERE nombre='Postres'),        (SELECT id FROM sucursal LIMIT 1));
