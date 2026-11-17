-- Completa el trayecto Nara → Nintendo Museum (estaba sin pasos). Solo si nadie lo ha tocado aún
-- desde la app (actualizado = 1): un cambio vuestro nunca se pisa.

UPDATE contador SET valor = valor + 1 WHERE id = 1;

UPDATE trayectos SET
  pasos = 'A pie hasta la estación Kintetsu-Nara
Kintetsu hacia Kioto (en Yamato-Saidaiji, cambiar al tren que pare en Ogura si hace falta)
Bajar en Ogura (Kintetsu)
A pie unos 5 min hasta el museo',
  duracion = '~45 min',
  jr_pass = 0,
  notas = 'Entrada a las 16:00: salir de Nara hacia las 14:30. Kintetsu no entra en el JR Pass (Suica). Mirar la ruta exacta ese día.',
  actualizado = 2,
  version = (SELECT valor FROM contador WHERE id = 1)
WHERE id = 'tr-nintendo-museum' AND actualizado = 1;
