-- Diario del viaje: un texto compartido por día (lo escriben los dos; gana el último guardado). El id es
-- la fecha, con el viaje delante salvo en Japón, como en `dias`. Va en tabla aparte para que escribir el
-- diario no pise lo que el otro móvil cambie en el plan del día.
CREATE TABLE diario (
  id           TEXT PRIMARY KEY NOT NULL,
  texto        TEXT NOT NULL,
  actualizado  INTEGER NOT NULL,
  borrado      INTEGER NOT NULL DEFAULT 0,
  version      INTEGER NOT NULL
);
CREATE INDEX ix_diario_version ON diario (version);
