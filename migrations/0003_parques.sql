-- Parques con Alba: atracciones de Tokyo Disneyland (tdl), Tokyo DisneySea (tds) y USJ (usj), sacadas de
-- Guia_Parques_Tematicos.docx. altura_min en cm (NULL = sin altura mínima). Todo con actualizado = 1.
-- Las filas llevan una versión nueva para que los móviles que ya sincronizaron también las reciban.

CREATE TABLE atracciones (
  id              TEXT PRIMARY KEY NOT NULL,
  parque          TEXT NOT NULL,
  nombre          TEXT NOT NULL,
  zona            TEXT,
  tipo            TEXT NOT NULL,
  altura_min      INTEGER,
  cerrada         INTEGER NOT NULL DEFAULT 0,
  imprescindible  INTEGER NOT NULL DEFAULT 0,
  unica           INTEGER NOT NULL DEFAULT 0,
  notas           TEXT,
  hecha           INTEGER NOT NULL DEFAULT 0,
  orden           INTEGER NOT NULL,
  actualizado     INTEGER NOT NULL,
  borrado         INTEGER NOT NULL DEFAULT 0,
  version         INTEGER NOT NULL
);
CREATE INDEX ix_atracciones_version ON atracciones (version);

UPDATE contador SET valor = valor + 1 WHERE id = 1;

INSERT INTO atracciones (id, parque, nombre, zona, tipo, altura_min, cerrada, imprescindible, unica, notas, hecha, orden, actualizado, borrado, version)
SELECT v.column1, v.column2, v.column3, v.column4, v.column5, v.column6, v.column7, v.column8, v.column9, v.column10, 0, v.column11, 1, 0, (SELECT valor FROM contador WHERE id = 1)
FROM (VALUES
  -- ───── Tokyo Disneyland ─────
  ('tdl-pooh', 'tdl', 'Pooh''s Hunny Hunt', 'Fantasyland', 'atraccion', NULL, 0, 1, 1, 'Sin raíles (trackless). Standby Pass / DPA nada más entrar.', 1),
  ('tdl-bella', 'tdl', 'Enchanted Tale of Beauty and the Beast', 'Fantasyland', 'atraccion', NULL, 0, 1, 1, 'Reciente (2020) y espectacular.', 2),
  ('tdl-small-world', 'tdl', 'It''s a Small World', 'Fantasyland', 'atraccion', NULL, 0, 1, 0, 'De noche es precioso.', 3),
  ('tdl-philharmagic', 'tdl', 'Mickey''s PhilharMagic', 'Fantasyland', 'show', NULL, 0, 1, 0, '4D sentados: buen momento para descansar.', 4),
  ('tdl-dumbo', 'tdl', 'Dumbo the Flying Elephant', 'Fantasyland', 'atraccion', NULL, 0, 0, 0, NULL, 5),
  ('tdl-carrusel', 'tdl', 'Castle Carrousel', 'Fantasyland', 'atraccion', NULL, 0, 0, 0, NULL, 6),
  ('tdl-alicia', 'tdl', 'Alice''s Tea Party', 'Fantasyland', 'atraccion', NULL, 0, 0, 0, NULL, 7),
  ('tdl-pinocho', 'tdl', 'Pinocchio''s Daring Journey', 'Fantasyland', 'atraccion', NULL, 0, 0, 0, NULL, 8),
  ('tdl-blancanieves', 'tdl', 'Snow White''s Adventures', 'Fantasyland', 'atraccion', NULL, 0, 0, 0, NULL, 9),
  ('tdl-peter-pan', 'tdl', 'Peter Pan''s Flight', 'Fantasyland', 'atraccion', NULL, 1, 0, 0, 'Cerrada en vuestras fechas según la guía.', 10),
  ('tdl-mansion', 'tdl', 'Haunted Mansion', 'Fantasyland', 'atraccion', NULL, 1, 0, 0, 'Cerrada en vuestras fechas según la guía.', 11),
  ('tdl-tren', 'tdl', 'Western River Railroad', 'Adventureland', 'atraccion', NULL, 0, 1, 0, 'Vuelta en tren: pausa con ella en brazos.', 12),
  ('tdl-piratas', 'tdl', 'Pirates of the Caribbean', 'Adventureland', 'atraccion', NULL, 0, 0, 0, NULL, 13),
  ('tdl-tiki', 'tdl', 'The Enchanted Tiki Room: Stitch Presents', 'Adventureland', 'show', NULL, 0, 0, 0, NULL, 14),
  ('tdl-jungla', 'tdl', 'Jungle Cruise', 'Adventureland', 'atraccion', NULL, 1, 0, 0, 'Cerrada en vuestras fechas según la guía.', 15),
  ('tdl-barco', 'tdl', 'Mark Twain Riverboat', 'Westernland', 'atraccion', NULL, 0, 0, 0, NULL, 16),
  ('tdl-big-thunder', 'tdl', 'Big Thunder Mountain', 'Westernland', 'atraccion', 102, 0, 0, 0, NULL, 17),
  ('tdl-splash', 'tdl', 'Splash Mountain', 'Critter Country', 'atraccion', 90, 1, 0, 0, 'Cerrada en vuestras fechas según la guía.', 18),
  ('tdl-monsters', 'tdl', 'Monsters, Inc. Ride & Go Seek!', 'Tomorrowland', 'atraccion', NULL, 0, 0, 0, NULL, 19),
  ('tdl-baymax', 'tdl', 'The Happy Ride with Baymax', 'Tomorrowland', 'atraccion', 81, 0, 0, 1, 'Movimientos bruscos y mucha cola.', 20),
  ('tdl-star-tours', 'tdl', 'Star Tours', 'Tomorrowland', 'atraccion', 102, 1, 0, 0, 'Cerrada en vuestras fechas según la guía.', 21),
  ('tdl-roger', 'tdl', 'Roger Rabbit''s Car Toon Spin', 'Toontown', 'atraccion', NULL, 0, 0, 0, '¿Cerrada en vuestras fechas? Confirmar en el calendario oficial.', 22),
  ('tdl-gadget', 'tdl', 'Gadget''s Go Coaster', 'Toontown', 'atraccion', 90, 0, 0, 0, NULL, 23),
  ('tdl-toontown', 'tdl', 'Casas de personajes', 'Toontown', 'zona', NULL, 0, 0, 0, NULL, 24),
  ('tdl-desfile-dia', 'tdl', 'Disney Harmony in Color (desfile)', 'World Bazaar', 'show', NULL, 0, 1, 0, '~14:00. Buscar sitio 20-30 min antes; laterales de World Bazaar.', 25),
  ('tdl-desfile-noche', 'tdl', 'Electrical Parade Dreamlights', 'Recorrido del desfile', 'show', NULL, 0, 1, 0, '~18:30 (con la puesta de sol).', 26),
  ('tdl-fuegos', 'tdl', 'Reach for the Stars (castillo y fuegos)', 'Castillo', 'show', NULL, 0, 0, 0, '~20:00. Si está agotada, salir antes.', 27),

  -- ───── Tokyo DisneySea ─────
  ('tds-frozen', 'tds', 'Anna and Elsa''s Frozen Journey', 'Fantasy Springs', 'atraccion', NULL, 0, 1, 1, 'Standby Pass de Fantasy Springs nada más entrar.', 1),
  ('tds-rapunzel', 'tds', 'Rapunzel''s Lantern Festival', 'Fantasy Springs', 'atraccion', NULL, 0, 1, 1, NULL, 2),
  ('tds-tinker-bell', 'tds', 'Fairy Tinker Bell''s Busy Buggies', 'Fantasy Springs', 'atraccion', NULL, 0, 0, 1, 'Mirar el cartel de altura en la entrada.', 3),
  ('tds-peter-pan', 'tds', 'Peter Pan''s Never Land Adventure', 'Fantasy Springs', 'atraccion', 100, 0, 0, 1, NULL, 4),
  ('tds-sindbad', 'tds', 'Sindbad''s Storybook Voyage', 'Arabian Coast', 'atraccion', NULL, 0, 1, 1, 'En barca, tranquila.', 5),
  ('tds-carrusel', 'tds', 'Caravan Carousel', 'Arabian Coast', 'atraccion', NULL, 0, 0, 0, NULL, 6),
  ('tds-sirenita', 'tds', 'Mermaid Lagoon', 'Mermaid Lagoon', 'zona', NULL, 0, 1, 1, 'Zona cubierta: ideal si hace frío.', 7),
  ('tds-flounder', 'tds', 'Flounder''s Flying Fish Coaster', 'Mermaid Lagoon', 'atraccion', 90, 0, 0, 0, NULL, 8),
  ('tds-medusas', 'tds', 'Jumpin'' Jellyfish', 'Mermaid Lagoon', 'atraccion', 90, 0, 0, 0, NULL, 9),
  ('tds-globos', 'tds', 'Blowfish Balloon Race', 'Mermaid Lagoon', 'atraccion', 102, 0, 0, 0, 'Altura según vuestra guía: confirmar en la entrada.', 10),
  ('tds-teatro-sirenita', 'tds', 'Mermaid Lagoon Theater', 'Mermaid Lagoon', 'show', NULL, 1, 0, 0, '¿Cerrado en vuestras fechas? Confirmar.', 11),
  ('tds-toy-story', 'tds', 'Toy Story Mania!', 'American Waterfront', 'atraccion', NULL, 0, 1, 0, NULL, 12),
  ('tds-turtle-talk', 'tds', 'Turtle Talk', 'American Waterfront', 'show', NULL, 0, 0, 0, 'Sentados, interior: buena pausa.', 13),
  ('tds-vapor', 'tds', 'DisneySea Transit Steamer Line', 'American Waterfront', 'atraccion', NULL, 0, 0, 0, NULL, 14),
  ('tds-coches', 'tds', 'Big City Vehicles', 'American Waterfront', 'atraccion', NULL, 0, 0, 0, NULL, 15),
  ('tds-tren', 'tds', 'DisneySea Electric Railway', 'American Waterfront', 'atraccion', NULL, 1, 0, 0, 'Cerrada en vuestras fechas según la guía.', 16),
  ('tds-torre', 'tds', 'Tower of Terror', 'American Waterfront', 'atraccion', 102, 0, 0, 0, NULL, 17),
  ('tds-gondolas', 'tds', 'Venetian Gondolas', 'Mediterranean Harbor', 'atraccion', NULL, 0, 0, 0, 'Ritmo pausado: siesta.', 18),
  ('tds-fortaleza', 'tds', 'Fortress Explorations', 'Mediterranean Harbor', 'zona', NULL, 0, 0, 0, NULL, 19),
  ('tds-soaring', 'tds', 'Soaring: Fantastic Flight', 'Mediterranean Harbor', 'atraccion', 102, 0, 0, 0, NULL, 20),
  ('tds-20000', 'tds', '20,000 Leagues Under the Sea', 'Mysterious Island', 'atraccion', NULL, 0, 0, 0, NULL, 21),
  ('tds-centro-tierra', 'tds', 'Journey to the Center of the Earth', 'Mysterious Island', 'atraccion', 117, 1, 0, 0, 'Cerrada en vuestras fechas según la guía.', 22),
  ('tds-nemo', 'tds', 'Nemo & Friends SeaRider', 'Port Discovery', 'atraccion', 90, 0, 0, 0, NULL, 23),
  ('tds-indiana', 'tds', 'Indiana Jones Adventure', 'Lost River Delta', 'atraccion', 117, 0, 0, 0, NULL, 24),
  ('tds-raging', 'tds', 'Raging Spirits', 'Lost River Delta', 'atraccion', 117, 0, 0, 0, NULL, 25),
  ('tds-believe', 'tds', 'Believe! Sea of Dreams', 'Mediterranean Harbor', 'show', NULL, 0, 1, 1, '~19:00, una función. Buscar sitio 45-60 min antes.', 26),

  -- ───── Universal Studios Japan ─────
  ('usj-hello-kitty', 'usj', 'Hello Kitty''s Cupcake Dream', 'Universal Wonderland', 'atraccion', NULL, 0, 1, 0, 'La atracción «segura» del día para Alba.', 1),
  ('usj-snoopy', 'usj', 'The Flying Snoopy', 'Universal Wonderland', 'atraccion', 92, 0, 0, 0, 'Cierra en teoría el 26 de enero.', 2),
  ('usj-curious-george', 'usj', 'Playing with Curious George', 'Universal Wonderland', 'show', NULL, 0, 0, 0, NULL, 3),
  ('usj-big-bird', 'usj', 'Big Bird''s Big Top Circus', 'Universal Wonderland', 'show', NULL, 0, 0, 0, NULL, 4),
  ('usj-snw', 'usj', 'Super Nintendo World (pasear)', 'Super Nintendo World', 'zona', NULL, 0, 1, 1, 'Area Timed Entry gratis en la app nada más entrar. Power-Up Band, castillo de Bowser. De noche es muy bonita.', 5),
  ('usj-yoshi', 'usj', 'Yoshi''s Adventure', 'Super Nintendo World', 'atraccion', 92, 0, 1, 1, 'Medir a Alba en la entrada por si llega.', 6),
  ('usj-mario-kart', 'usj', 'Mario Kart: Koopa''s Challenge', 'Super Nintendo World', 'atraccion', 102, 0, 1, 1, '102 cm o más.', 7),
  ('usj-dk', 'usj', 'Mine-Cart Madness (Donkey Kong)', 'Super Nintendo World', 'atraccion', 102, 0, 0, 1, '102 cm o más.', 8),
  ('usj-minion-park', 'usj', 'Minion Park (pasear)', 'Minion Park', 'zona', NULL, 0, 1, 0, 'Personajes y fotos.', 9),
  ('usj-freeze-ray', 'usj', 'Freeze Ray Sliders', 'Minion Park', 'atraccion', 92, 0, 0, 0, NULL, 10),
  ('usj-minion-mayhem', 'usj', 'Despicable Me Minion Mayhem', 'Minion Park', 'atraccion', 102, 0, 0, 0, '102 cm o más.', 11),
  ('usj-villain-con', 'usj', 'Villain-Con Minion Blast', 'Minion Park', 'atraccion', 102, 0, 0, 1, 'Altura sin confirmar: mirar en la entrada.', 12),
  ('usj-sing', 'usj', 'SING on Tour', 'Hollywood', 'show', NULL, 0, 0, 0, 'Sentados: buen momento para la siesta.', 13),
  ('usj-conan', 'usj', 'Detective Conan 4-D Live Show', 'Hollywood', 'show', NULL, 0, 0, 1, NULL, 14),
  ('usj-hollywood-dream', 'usj', 'Hollywood Dream - The Ride', 'Hollywood', 'atraccion', 102, 1, 0, 0, 'Cerrada en vuestras fechas según la guía.', 15),
  ('usj-space-fantasy', 'usj', 'Space Fantasy - The Ride', 'Hollywood', 'atraccion', 102, 0, 0, 0, '102 cm o más.', 16),
  ('usj-harry-potter', 'usj', 'Harry Potter and the Forbidden Journey', 'Wizarding World of Harry Potter', 'atraccion', 122, 0, 0, 0, NULL, 17),
  ('usj-jurassic', 'usj', 'Jurassic Park - The Ride', 'Jurassic Park', 'atraccion', 107, 0, 0, 0, 'En teoría reabre el 22 de enero.', 18),
  ('usj-jaws', 'usj', 'JAWS', 'Amity Village', 'atraccion', 102, 0, 0, 0, 'Desde las 18:00, versión con menos luz y más niebla.', 19),
  ('usj-parade', 'usj', 'NO LIMIT! Parade', 'Recorrido del desfile', 'show', NULL, 0, 1, 0, 'Hora exacta en la app ese día. Sitio 15-20 min antes.', 20),
  ('usj-sesame-4d', 'usj', 'Sesame Street 4-D Movie Magic', 'Hollywood', 'show', NULL, 1, 0, 0, 'Cerrada según la guía.', 21),
  ('usj-shrek-4d', 'usj', 'Shrek''s 4-D Adventure', 'Hollywood', 'show', NULL, 1, 0, 0, 'Cerrada según la guía.', 22)
) AS v;

-- Altura de Alba (se cambia desde la app; la guía preveía 86-88 cm en enero).
INSERT INTO ajustes (id, valor, actualizado, borrado, version)
VALUES ('alba', '{"altura":87}', 1, 0, (SELECT valor FROM contador WHERE id = 1));
