ALTER TABLE categoria ADD COLUMN orden INT NOT NULL DEFAULT 0;

UPDATE categoria SET orden = 1 WHERE nombre = 'Entradas';
UPDATE categoria SET orden = 2 WHERE nombre = 'Platos fuertes';
UPDATE categoria SET orden = 3 WHERE nombre = 'Postres';
UPDATE categoria SET orden = 4 WHERE nombre = 'Bebidas';
