-- Precio de cada hotel (opcional), en su moneda, y si ya está pagado. Pagado = cuenta como gasto en el
-- presupuesto (fila de gastos con id `hotel-<id del hotel>`); sin pagar = "por pagar en el hotel".
ALTER TABLE alojamientos ADD COLUMN precio REAL;
ALTER TABLE alojamientos ADD COLUMN moneda TEXT;
ALTER TABLE alojamientos ADD COLUMN pagado INTEGER;
