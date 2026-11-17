-- Apartados propios de cada viaje: listas con precio (equipaje, compras, recados…). Las listas se
-- definen en los ajustes del viaje (`listas`); aquí van sus elementos. El id lleva el viaje delante
-- salvo en Japón, como el resto de tablas (ver src/domain/viajes.ts).

CREATE TABLE elementos (
  id           TEXT PRIMARY KEY NOT NULL,
  lista        TEXT NOT NULL,
  nombre       TEXT NOT NULL,
  hecho        INTEGER NOT NULL DEFAULT 0,
  notas        TEXT,
  precio_min   REAL,
  precio_max   REAL,
  moneda       TEXT,
  tienda       TEXT,
  ciudad       TEXT,
  gasto        TEXT,
  orden        INTEGER NOT NULL DEFAULT 0,
  actualizado  INTEGER NOT NULL,
  borrado      INTEGER NOT NULL DEFAULT 0,
  version      INTEGER NOT NULL
);
CREATE INDEX ix_elementos_version ON elementos (version);
