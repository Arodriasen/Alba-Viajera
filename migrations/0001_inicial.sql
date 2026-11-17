-- Columnas de sincronización en todas las tablas:
--   actualizado  momento del cambio en el dispositivo (ms desde 1970); gana el más reciente
--   borrado      1 = eliminado (se conserva la fila para que el borrado llegue al otro móvil)
--   version      número que asigna el servidor; cada dispositivo pide "lo que haya después de N"
-- Sin claves foráneas: las filas llegan en cualquier orden y los borrados son marcas.

CREATE TABLE contador (
  id     INTEGER PRIMARY KEY CHECK (id = 1),
  valor  INTEGER NOT NULL
);
INSERT INTO contador (id, valor) VALUES (1, 0);

-- Un día del viaje; el id es la fecha (AAAA-MM-DD).
CREATE TABLE dias (
  id           TEXT PRIMARY KEY NOT NULL,
  titulo       TEXT NOT NULL,
  ciudad       TEXT,
  plan         TEXT,
  notas        TEXT,
  foto         TEXT,
  actualizado  INTEGER NOT NULL,
  borrado      INTEGER NOT NULL DEFAULT 0,
  version      INTEGER NOT NULL
);
CREATE INDEX ix_dias_version ON dias (version);

CREATE TABLE alojamientos (
  id            TEXT PRIMARY KEY NOT NULL,
  nombre        TEXT NOT NULL,
  ciudad        TEXT,
  entrada       TEXT,
  salida        TEXT,
  direccion     TEXT,
  direccion_ja  TEXT,
  checkin       TEXT,
  checkout      TEXT,
  estado        TEXT NOT NULL,
  notas         TEXT,
  enlace        TEXT,
  actualizado   INTEGER NOT NULL,
  borrado       INTEGER NOT NULL DEFAULT 0,
  version       INTEGER NOT NULL
);
CREATE INDEX ix_alojamientos_version ON alojamientos (version);

CREATE TABLE reservas (
  id           TEXT PRIMARY KEY NOT NULL,
  titulo       TEXT NOT NULL,
  fecha_uso    TEXT,
  hora_uso     TEXT,
  venta        TEXT,
  estado       TEXT NOT NULL,
  enlace       TEXT,
  notas        TEXT,
  actualizado  INTEGER NOT NULL,
  borrado      INTEGER NOT NULL DEFAULT 0,
  version      INTEGER NOT NULL
);
CREATE INDEX ix_reservas_version ON reservas (version);

CREATE TABLE trayectos (
  id           TEXT PRIMARY KEY NOT NULL,
  fecha        TEXT NOT NULL,
  hora         TEXT,
  titulo       TEXT NOT NULL,
  origen       TEXT,
  destino      TEXT,
  pasos        TEXT,
  duracion     TEXT,
  jr_pass      INTEGER,
  notas        TEXT,
  orden        INTEGER NOT NULL,
  actualizado  INTEGER NOT NULL,
  borrado      INTEGER NOT NULL DEFAULT 0,
  version      INTEGER NOT NULL
);
CREATE INDEX ix_trayectos_version ON trayectos (version);

CREATE TABLE ajustes (
  id           TEXT PRIMARY KEY NOT NULL,
  valor        TEXT NOT NULL,
  actualizado  INTEGER NOT NULL,
  borrado      INTEGER NOT NULL DEFAULT 0,
  version      INTEGER NOT NULL
);
CREATE INDEX ix_ajustes_version ON ajustes (version);

-- Fotos del día, comprimidas en el móvil. No van en la sincronización: se suben y bajan por nombre.
CREATE TABLE fotos (
  nombre  TEXT PRIMARY KEY NOT NULL,
  tipo    TEXT NOT NULL,
  datos   BLOB NOT NULL,
  creada  INTEGER NOT NULL
);
