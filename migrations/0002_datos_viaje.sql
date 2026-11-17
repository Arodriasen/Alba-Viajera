-- Datos de partida del viaje, sacados de Japon_Guia_Itinerario.docx, Guia_Parques_Tematicos.docx y
-- de las conversaciones con Claude (hasta el 11 nov 2026). Todo con actualizado = 1 y version = 1:
-- cualquier cambio hecho después desde la app gana siempre.

UPDATE contador SET valor = 1 WHERE id = 1;

-- ───────────────────────── Días ─────────────────────────
INSERT INTO dias (id, titulo, ciudad, plan, notas, foto, actualizado, borrado, version) VALUES
('2027-01-11', 'Vuelo a Tokio', 'Madrid', 'Vuelo Madrid → Tokio (Narita). Salida 20:20
Llegar a Barajas T4S sobre las 17:00', NULL, NULL, 1, 0, 1),
('2027-01-12', 'Llegada a Tokio', 'Tokio', 'Llegada a Narita 18:30
Check-in Hotel Tavinos Asakusa
Cenar algo cerca y a descansar', NULL, NULL, 1, 0, 1),
('2027-01-13', 'Asakusa sin prisa', 'Tokio', 'Día tranquilo por el jet lag
Paseo por el barrio y primeros supermercados
Sin agenda', 'Alternativa para el Pokémon Café si sale reserva este día (Nihonbashi, 3-4 paradas de metro).', NULL, 1, 0, 1),
('2027-01-14', 'Tokyo Disneyland', 'Tokio', 'Llegar a la puerta 8:00-8:30
Nada más entrar: Standby Pass / DPA de Pooh''s Hunny Hunt
Pooh''s Hunny Hunt + La Bella y la Bestia
It''s a Small World, Dumbo, Carrusel
Comida temprana (11:30)
Siesta: PhilharMagic o paseo por World Bazaar
Desfile Harmony in Color (~14:00)
Toontown: Monsters Inc.
Desfile nocturno Electrical Parade (~18:30)
Salir con margen antes del cierre', 'Menores de 3 años gratis. Rider Swap en las atracciones con altura mínima.', NULL, 1, 0, 1),
('2027-01-15', 'Asakusa + Ueno', 'Tokio', 'Sensō-ji temprano (antes de las 9) y calle Nakamise
Tarde en el parque Ueno: estanque Shinobazu
Ameyoko para picar algo', NULL, NULL, 1, 0, 1),
('2027-01-16', 'Shinjuku + Harajuku', 'Tokio', 'Santuario Meiji
Takeshita Street (sábado: mucha gente)
Shibuya Crossing y Hachiko si da tiempo
Mirador gratuito del Ayuntamiento de Tokio, de noche', NULL, NULL, 1, 0, 1),
('2027-01-17', 'Excursión a Nikko', 'Nikko', 'Maletas grandes en consigna del Tavinos, solo mochila
Spacia X desde Tobu Asakusa (~1h50)
Comida en Nikko
Puente Shinkyo y santuario Toshogu (con mochila de porteo)
Check-in en el Ryokan Nikko Tokanso
Onsen familiar y cena (~19:00)', 'Mirar la previsión de nieve para decidir carrito o mochila.', NULL, 1, 0, 1),
('2027-01-18', 'Vuelta de Nikko', 'Tokio', 'Mañana tranquila en Nikko
Spacia X de vuelta a Asakusa
Tarde tranquila', 'Día colchón: se puede recortar si hace falta.', NULL, 1, 0, 1),
('2027-01-19', 'Akihabara + Odaiba', 'Tokio', 'Mañana en Akihabara: videojuegos, arcades, figuras (Super Potato, Mandarake, Surugaya)
Comida (opción Pokémon Café en Nihonbashi)
Tarde en Odaiba: bahía, Rainbow Bridge y Gundam de DiverCity', NULL, NULL, 1, 0, 1),
('2027-01-20', 'Tokyo DisneySea', 'Tokio', 'Llegar a la puerta 8:00-8:30
Nada más entrar: Standby Pass de Fantasy Springs
Frozen Journey + Rapunzel''s Lantern Festival
Sindbad''s Storybook Voyage
Comida (12:15)
Siesta: Turtle Talk o góndolas venecianas
Mermaid Lagoon
Toy Story Mania y Mysterious Island
Believe! Sea of Dreams (~19:00, buscar sitio 45-60 min antes)', 'Parque grande: carrito + mochila para las escaleras.', NULL, 1, 0, 1),
('2027-01-21', 'Yanaka', 'Tokio', 'Barrio tranquilo, 15-20 min a pie del hotel
Yanaka Ginza, templos y gatos
Alternativa: jardín Hamarikyu (20 min en metro)
Preparar maletas: takkyubin para el día siguiente', NULL, NULL, 1, 0, 1),
('2027-01-22', 'Viaje a Osaka', 'Osaka', 'Activar el JR Pass (día 1)
Shinkansen Tokio → Shin-Osaka (~2h30)
Check-in Glanz Arita Nihonbashi
Tarde en Dotonbori: takoyaki, okonomiyaki, Glico', NULL, NULL, 1, 0, 1),
('2027-01-23', 'Hiroshima + Miyajima', 'Hiroshima', 'Salir temprano
Shinkansen Shin-Osaka → Hiroshima
Parque Memorial de la Paz y Genbaku Dome
Tren JR a Miyajimaguchi + ferry JR a Miyajima
Torii flotante de Itsukushima (mirar mareas)', 'Día largo: no importa forzar un poco, es especial.', NULL, 1, 0, 1),
('2027-01-24', 'Castillo de Osaka + Kaiyukan', 'Osaka', 'Castillo de Osaka y su parque por la mañana
Acuario Kaiyukan por la tarde
Kuromon Market para picar', 'Día relajado antes de USJ. Día colchón.', NULL, 1, 0, 1),
('2027-01-25', 'Universal Studios Japan', 'Osaka', 'Maletas: takkyubin o locker antes de salir
Llegar a la puerta 8:00-8:30
Nada más entrar: Area Timed Entry de Super Nintendo World en la app
Universal Wonderland: Hello Kitty''s Cupcake Dream
Siesta: shows sentados (Sing on Tour…)
Minion Park
NO LIMIT! Parade (hora en la app)
Salida hacia Kioto por la noche
Check-in Henn na Hotel Premier Kyoto', 'Con Alba: Rider Swap para que los adultos se turnen. Yoshi''s Adventure pide 92 cm.', NULL, 1, 0, 1),
('2027-01-26', 'Gion + Kiyomizu-dera', 'Kioto', 'Gion, Sannenzaka y Ninenzaka
Kiyomizu-dera (mejor mochila de porteo: cuestas y escalones)
Cena en Pontocho', NULL, NULL, 1, 0, 1),
('2027-01-27', 'Nara + Nintendo Museum', 'Kioto', 'Mañana en Nara: parque de los ciervos y Tōdai-ji
Nintendo Museum (Uji) a las 16:00
Descargar el QR del museo (desde el día anterior a las 14:00 de Japón)', 'Revisar que dé tiempo a volver de Nara a Uji antes de las 16:00.', NULL, 1, 0, 1),
('2027-01-28', 'Fushimi Inari + vuelta a Tokio', 'Tokio', 'Fushimi Inari temprano (los primeros toriis van con carrito)
Shinkansen Kioto → Tokio por la tarde (último día del JR Pass)
Check-in alojamiento de Tokio (Negishi)', NULL, NULL, 1, 0, 1),
('2027-01-29', 'Compras: Asakusa + Akihabara', 'Tokio', 'Souvenirs en Asakusa
Últimas compras en Akihabara', 'Tax Free: pasaporte en cada compra y guardar los tickets.', NULL, 1, 0, 1),
('2027-01-30', 'Shimokitazawa + Ryōgoku', 'Tokio', 'Shimokitazawa: mercadillos vintage y cafés
Ryōgoku: barrio del sumo (mirar el torneo de enero)', NULL, NULL, 1, 0, 1),
('2027-01-31', 'Yoyogi y despedida', 'Tokio', 'Paseo por el parque Yoyogi
Preparar maletas
Cena de despedida', NULL, NULL, 1, 0, 1),
('2027-02-01', 'Vuelta a casa', 'Tokio', 'Mañana tranquila por la zona
Check-out y Skyliner a Narita con margen
Tax Free en las máquinas de Aduanas ANTES de facturar
Vuelo a Madrid 22:10', NULL, NULL, 1, 0, 1),
('2027-02-02', 'Llegada a Madrid', 'Madrid', 'Llegada a Madrid 5:45
Coche de vuelta a Zaragoza', NULL, NULL, 1, 0, 1);

-- ───────────────────────── Alojamientos ─────────────────────────
INSERT INTO alojamientos (id, nombre, ciudad, entrada, salida, direccion, direccion_ja, checkin, checkout, estado, notas, enlace, actualizado, borrado, version) VALUES
('aloj-tavinos', 'Hotel Tavinos Asakusa', 'Tokio', '2027-01-12', '2027-01-22', '2-18-8 Asakusa, Taito-ku, Tokio 111-0032', '〒111-0032 東京都台東区浅草2-18-8', NULL, NULL, 'reservado',
 'Dos reservas: hasta el 17 y desde el 18 (la noche del 17 es en Nikko). Pedir que guarden las maletas grandes ese día.
4 min a pie de Asakusa (Tsukuba Express, salida A1).', NULL, 1, 0, 1),
('aloj-tokanso', 'Ryokan Nikko Tokanso', 'Nikko', '2027-01-17', '2027-01-18', '2335 Sannai, Nikko, Tochigi', '〒321-1431 栃木県日光市山内2335', NULL, NULL, 'reservado',
 'Cena incluida (~19:00). Reservar/reconfirmar el onsen familiar privado.
A ~400 m del santuario Toshogu.', NULL, 1, 0, 1),
('aloj-glanz', 'Apto. Glanz Arita Nihonbashi', 'Osaka', '2027-01-22', '2027-01-25', '2-18-17 Nipponbashi, Chuo-ku, Osaka 542-0073', '〒542-0073 大阪府大阪市中央区日本橋2-18-17', NULL, NULL, 'reservado',
 'Sin recepción. Cerca de Kuromon Market y Dotonbori.', NULL, 1, 0, 1),
('aloj-parkside', 'Oyado RAKU Daikokucho (Parkside Namba)', 'Osaka', '2027-01-22', '2027-01-25', 'Motomachi 3-chome, Naniwa-ku, Osaka', '大阪府大阪市浪速区元町 パークサイド難波', NULL, NULL, 'cancelar',
 'Reserva duplicada de Osaka: os quedáis con Glanz Arita. Cancelar antes de que acabe la cancelación gratuita.', NULL, 1, 0, 1),
('aloj-henn-na', 'Henn na Hotel Premier Kyoto Eki Hachijoguchimae', 'Kioto', '2027-01-25', '2027-01-28', '15 Higashikujo Higashisannocho, Minami-ku, Kioto 601-8004', '〒601-8004 京都府京都市南区東九条東山王町15', NULL, NULL, 'reservado',
 '2 min a pie de la salida Hachijo de la estación de Kioto. Llegada de noche tras USJ.', NULL, 1, 0, 1),
('aloj-negishi', 'Apartamento Negishi (Tokyo Bldg 302)', 'Tokio', '2027-01-28', '2027-02-01', '3-25-8 Negishi, Taito-ku, Tokio, apto. 302', '東京都台東区根岸3-25-8 東協ビル302', NULL, NULL, 'reservado',
 'Con ascensor (3.º piso). ~4 min de Uguisudani, ~10 min de Nippori (Skyliner a Narita).
Pendiente de decidir frente al APA Keisei Ueno.', NULL, 1, 0, 1),
('aloj-apa-ueno', 'APA Hotel Keisei Ueno Ekimae', 'Tokio', '2027-01-28', '2027-02-01', '2-14-26 Ueno, Taito-ku, Tokio', '東京都台東区上野2-14-26', NULL, NULL, 'pendiente',
 'Alternativa al apartamento de Negishi: delante de Keisei Ueno (Skyliner directo), pero habitación de 11 m².', NULL, 1, 0, 1);

-- ───────────────────────── Reservas y entradas ─────────────────────────
INSERT INTO reservas (id, titulo, fecha_uso, hora_uso, venta, estado, enlace, notas, actualizado, borrado, version) VALUES
('res-vuelos', 'Vuelos Madrid ⇄ Tokio', '2027-01-11', '20:20', NULL, 'comprada', NULL, 'Vuelta: 1 feb a las 22:10 desde Narita.', 1, 0, 1),
('res-seguro', 'Seguro de viaje', '2027-01-11', NULL, NULL, 'comprada', NULL, NULL, 1, 0, 1),
('res-vjw', 'Visit Japan Web', '2027-01-12', NULL, NULL, 'comprada', 'https://services.digital.go.jp/en/visit-japan-web/', 'Tener los QR a mano al aterrizar.', 1, 0, 1),
('res-disneyland', 'Entradas Tokyo Disneyland', '2027-01-14', NULL, '2026-11-14T05:00:00.000Z', 'pendiente', 'https://www.tokyodisneyresort.jp/en/ticket/', 'Salen 2 meses antes a las 14:00 de Japón. Alba (menos de 3 años) no paga.', 1, 0, 1),
('res-disneysea', 'Entradas Tokyo DisneySea', '2027-01-20', NULL, '2026-11-20T05:00:00.000Z', 'pendiente', 'https://www.tokyodisneyresort.jp/en/ticket/', 'Salen 2 meses antes a las 14:00 de Japón.', 1, 0, 1),
('res-usj', 'Studio Pass USJ', '2027-01-25', NULL, '2026-11-25T03:00:00.000Z', 'pendiente', 'https://www.usj.co.jp/web/en/us', 'Fecha de venta estimada (hacia el 25 nov): confirmar en la web oficial. Sin Express Pass.', 1, 0, 1),
('res-pokemon-cafe', 'Pokémon Café (Nihonbashi)', '2027-01-19', NULL, '2026-12-01T09:00:00.000Z', 'pendiente', 'https://www.pokemoncenter-online.com/cafe/', 'Fecha estimada: sueltan el mes entero de golpe a las 18:00 de Japón. Mejor día: 19 (o 13).', 1, 0, 1),
('res-spacia-ida', 'Spacia X Asakusa → Nikko', '2027-01-17', NULL, '2026-12-17T00:00:00.000Z', 'pendiente', 'https://www.tobu.co.jp/en/', 'Salen un mes antes a las 9:00 de Japón. No lo cubre el JR Pass. Mirar compartimento privado.', 1, 0, 1),
('res-spacia-vuelta', 'Spacia X Nikko → Asakusa', '2027-01-18', NULL, '2026-12-18T00:00:00.000Z', 'pendiente', 'https://www.tobu.co.jp/en/', 'Ojo: algunos servicios del lunes van con el Spacia antiguo.', 1, 0, 1),
('res-onsen', 'Onsen familiar del ryokan', '2027-01-17', NULL, NULL, 'pendiente', NULL, 'Reconfirmar la franja con el ryokan unos días antes.', 1, 0, 1),
('res-jrpass', 'JR Pass 7 días', '2027-01-22', NULL, NULL, 'pendiente', 'https://japanrailpass.net/en/', 'Comprar en diciembre. Del 22 al 28 de enero.', 1, 0, 1),
('res-esim', 'eSIM (Nomad)', '2027-01-12', NULL, NULL, 'pendiente', 'https://www.getnomad.app/', 'Una ilimitada 21 días (~49 $) y otra pequeña 5 GB (~10 $).', 1, 0, 1),
('res-kaiyukan', 'Kaiyukan', '2027-01-24', NULL, NULL, 'pendiente', 'https://www.kaiyukan.com/language/eng/', 'Entrada online con fecha y hora. Mirar que no sea día de cierre.', 1, 0, 1),
('res-nintendo-museum', 'Nintendo Museum', '2027-01-27', '16:00', NULL, 'comprada', 'https://museum.nintendo.com/', 'El QR sale el día anterior a las 14:00 de Japón (26 ene).', 1, 0, 1),
('res-snw', 'Super Nintendo World (Area Timed Entry)', '2027-01-25', '09:00', NULL, 'pendiente', NULL, 'Gratis en la app de USJ nada más entrar al parque. Probar con los dos móviles.', 1, 0, 1),
('res-fantasy-springs', 'Standby Pass Fantasy Springs', '2027-01-20', '09:00', NULL, 'pendiente', NULL, 'En la app de Tokyo Disney Resort nada más entrar.', 1, 0, 1);

-- ───────────────────────── Trayectos ─────────────────────────
-- Orientativos: revisarlos con Google Maps o NAVITIME antes de cada día.
INSERT INTO trayectos (id, fecha, hora, titulo, origen, destino, pasos, duracion, jr_pass, notas, orden, actualizado, borrado, version) VALUES
('tr-narita-tavinos', '2027-01-12', '19:00', 'Narita → Hotel Tavinos', 'Narita International Airport', 'Hotel Tavinos Asakusa, Tokyo', 'Keisei Access Express directo hasta Asakusa (Suica)
A pie hasta el hotel', '~1h15', 0, 'Llegáis cansados: si hay mucha cola, valorar el autobús Limousine o un taxi grande con sillita.', 1, 1, 0, 1),
('tr-disneyland', '2027-01-14', '07:30', 'Hotel → Tokyo Disneyland', 'Hotel Tavinos Asakusa, Tokyo', 'Tokyo Disneyland', 'Metro hasta la estación de Tokio
JR Keiyō hasta Maihama (~15 min)
A pie hasta la entrada', '~50 min', 0, 'El andén de la Keiyō está lejos dentro de la estación de Tokio (10-15 min andando).', 1, 1, 0, 1),
('tr-nikko-ida', '2027-01-17', NULL, 'Asakusa → Nikko', 'Tobu Asakusa Station', 'Tobu-Nikko Station', 'A pie hasta Tobu Asakusa (no es la del metro)
Spacia X hasta Tobu Nikko
Bus o taxi hasta el ryokan (preguntar si recogen en la estación)', '~1h50', 0, 'Billete Spacia X reservado. El JR Pass todavía no está activo.', 1, 1, 0, 1),
('tr-nikko-vuelta', '2027-01-18', NULL, 'Nikko → Asakusa', 'Tobu-Nikko Station', 'Hotel Tavinos Asakusa, Tokyo', 'Bus o taxi hasta Tobu Nikko
Spacia X hasta Tobu Asakusa
A pie al hotel', '~2h', 0, NULL, 1, 1, 0, 1),
('tr-disneysea', '2027-01-20', '07:30', 'Hotel → Tokyo DisneySea', 'Hotel Tavinos Asakusa, Tokyo', 'Tokyo DisneySea', 'Metro hasta la estación de Tokio
JR Keiyō hasta Maihama
Disney Resort Line hasta Tokyo DisneySea Station', '~1h', 0, NULL, 1, 1, 0, 1),
('tr-osaka', '2027-01-22', NULL, 'Tokio → Osaka', 'Tokyo Station', 'Shin-Osaka Station', 'Activar el JR Pass y reservar asientos
Shinkansen Tokio → Shin-Osaka
Metro Midōsuji hasta Namba y a pie al apartamento', '~2h30 + 20 min', 1, 'Maletas grandes por takkyubin: viajar solo con mochila.', 1, 1, 0, 1),
('tr-hiroshima', '2027-01-23', '07:30', 'Osaka → Hiroshima → Miyajima', 'Shin-Osaka Station', 'Hiroshima Peace Memorial Park', 'Shinkansen Shin-Osaka → Hiroshima (~1h30)
Tranvía o bus al Parque de la Paz
JR Sanyō Hiroshima → Miyajimaguchi (~30 min)
Ferry JR a Miyajima (10 min)', 'Día completo', 1, 'El ferry JR entra en el JR Pass. Mirar la tabla de mareas.', 1, 1, 0, 1),
('tr-usj', '2027-01-25', '07:45', 'Apartamento → USJ', 'Osaka Namba Station', 'Universal Studios Japan', 'A pie hasta Osaka-Namba
Línea Hanshin Namba hasta Nishikujō
JR Yumesaki hasta Universal City', '~35 min', 0, 'El tramo Hanshin no lo cubre el JR Pass (Suica).', 1, 1, 0, 1),
('tr-usj-kioto', '2027-01-25', '19:00', 'USJ → Kioto (noche)', 'Universal City Station', 'Henn na Hotel Premier Kyoto Eki Hachijoguchimae', 'JR Yumesaki hasta Nishikujō
JR Loop hasta Osaka
JR Kioto rápido especial hasta Kioto (~30 min)
Salida Hachijo, 2 min al hotel', '~1h10', 1, 'Maletas: locker o envío previo con takkyubin.', 2, 1, 0, 1),
('tr-nara', '2027-01-27', '08:00', 'Kioto → Nara', 'Kyoto Station', 'Nara Park', 'JR Nara hasta Nara (~45 min)
A pie o bus hasta el parque', '~1h', 1, 'Usar la línea JR (la Kintetsu no entra en el pase).', 1, 1, 0, 1),
('tr-nintendo-museum', '2027-01-27', '14:30', 'Nara → Nintendo Museum', 'Nara Station', 'Nintendo Museum, Uji', 'Mirar la ruta ese día (el museo está junto a la estación Ogura de Kintetsu)', NULL, NULL, 'Entrada a las 16:00: salir de Nara con margen.', 2, 1, 0, 1),
('tr-vuelta-tokio', '2027-01-28', NULL, 'Kioto → Tokio', 'Kyoto Station', 'Uguisudani Station', 'Shinkansen Kioto → Tokio (~2h15)
JR Yamanote hasta Uguisudani
A pie al apartamento (~4 min)', '~2h45', 1, 'Último día del JR Pass.', 1, 1, 0, 1),
('tr-narita-vuelta', '2027-02-01', '18:00', 'Apartamento → Narita', 'Nippori Station', 'Narita International Airport', 'A pie hasta Nippori (~10 min)
Keisei Skyliner hasta Narita (~40 min)', '~1h', 0, 'Llegar con margen: Tax Free en las máquinas de Aduanas antes de facturar.', 1, 1, 0, 1);
