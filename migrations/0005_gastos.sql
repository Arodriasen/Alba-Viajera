-- Presupuesto y gastos. Los gastos reales van en `gastos`; lo previsto por categoría, en
-- `ajustes` (id 'presupuesto', JSON en euros). Datos de partida sacados de las conversaciones.

CREATE TABLE gastos (
  id           TEXT PRIMARY KEY NOT NULL,
  concepto     TEXT NOT NULL,
  categoria    TEXT NOT NULL,
  importe      REAL NOT NULL,
  moneda       TEXT NOT NULL,
  euros        REAL NOT NULL,
  fecha        TEXT NOT NULL,
  tax_free     INTEGER NOT NULL DEFAULT 0,
  notas        TEXT,
  actualizado  INTEGER NOT NULL,
  borrado      INTEGER NOT NULL DEFAULT 0,
  version      INTEGER NOT NULL
);
CREATE INDEX ix_gastos_version ON gastos (version);

UPDATE contador SET valor = valor + 1 WHERE id = 1;

-- Lo único ya pagado que consta en las conversaciones (junio 2026: "solo hemos pagado el avión, 2300 € en total").
INSERT INTO gastos (id, concepto, categoria, importe, moneda, euros, fecha, tax_free, notas, actualizado, borrado, version)
VALUES ('gasto-vuelos', 'Vuelos Madrid ⇄ Tokio (3 billetes)', 'vuelos', 2300, 'EUR', 2300, '2026-06-24', 0,
        'Importe que consta en las conversaciones: revisadlo con la reserva.', 1, 0, (SELECT valor FROM contador WHERE id = 1));

-- Previsto por categoría (en euros). Estimaciones de las conversaciones; se cambian desde la app.
--   vuelos 2300 (pagado) · alojamiento ~1500 (13 noches en Tokio a ~75 €, Osaka y Kioto ~60 €, ryokan)
--   transporte ~800 (JR Pass 7 días ~640 € los dos + Suica, Spacia X, Skyliner) · entradas ~400 (Disney x2 + USJ)
--   comida ~850 (18 € por adulto y día + algo para Alba) · compras 500 · seguro ~240 · eSIM ~60 · otros ~500
INSERT INTO ajustes (id, valor, actualizado, borrado, version)
VALUES ('presupuesto',
        '{"vuelos":2300,"alojamiento":1500,"transporte":800,"entradas":400,"comida":850,"compras":500,"seguro":240,"internet":60,"otros":500}',
        1, 0, (SELECT valor FROM contador WHERE id = 1));
