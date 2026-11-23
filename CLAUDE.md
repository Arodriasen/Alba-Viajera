## Alba Viajera (carpeta ViajeJapon)

PWA personal para los viajes de la familia (empezó con Japón, 11 ene – 2 feb 2027). La usan dos personas (pareja) y los
cambios se sincronizan entre los dos móviles. Código y textos en español. Estilo japonés sencillo,
siempre claro: papel `#F7F4EE`, tinta `#1F2328`, bermellón `#C73E2F`, añil `#2D4B73`; títulos Shippori
Mincho B1, textos Zen Kaku Gothic New. Que sea intuitiva y nada intrusiva.

Stack: React + Vite + TS, Cloudflare Pages + Functions + D1 + Access (todo gratis, sin tarjeta: nada de
R2 ni APIs de pago). Base copiada de Tocador web (`G:\_Source\BeautyAppWeb`): mismo motor de
sincronización, control de acceso y fotos.

- `src/domain/viaje.ts` — reglas puras (qué toca hoy, día del JR Pass, alojamiento de cada noche,
  cuenta atrás de ventas, enlaces a Google Maps). Tests en `viaje.test.ts`.
- `src/infrastructure/` — copia local en IndexedDB (`local/`), `ViajeLocal` (repositorio), `sync/MotorSync`.
- `server/` — `tablas.ts` (esquema zod de cada tabla), `sincronizacion.ts` (gana el `actualizado` mayor),
  `acceso.ts` (JWT de Access), `fotos.ts` (BLOB en D1, para la futura "foto del día").
- `migrations/0002_datos_viaje.sql` — los datos de partida del viaje (actualizado = 1: cualquier cambio
  en la app gana). Para cambiar datos ya publicados se hace desde la app, no tocando esta migración.
- `docs/export/` — export de claude.ai y los Word del viaje (fuente de los datos; no se sube a git).

Rutas: no hay cálculo de rutas propio (sería de pago); los trayectos se escriben a mano y tienen botones a
Google Maps (`dir/?api=1&travelmode=transit`) y a NAVITIME (sin enlace profundo documentado: se copia el
destino y se abre su web).

`?hoy=AAAA-MM-DD` simula un día (se guarda en sessionStorage; `?hoy=` lo quita).

Foto del día: una por día (`dias.foto` = nombre uuid.jpg), comprimida en el móvil a ≤1920 px / ~550 KB
(`src/infrastructure/fotos/FotosDelDia.ts`), BLOB en D1. Cambiarla = foto nueva + la vieja se borra del
servidor. Álbum en `/album`.

Parques con Alba: tabla `atracciones` (migración 0003, de Guia_Parques_Tematicos.docx) y altura de Alba en
`ajustes` (id `alba`). `src/domain/parques.ts`: aptitud (puede / Rider Swap / cerrada). Directo (estado,
esperas, funciones, horario de hoy y del día de la visita) desde ThemeParks.wiki en el navegador
(`src/infrastructure/parquesEnVivo.ts`, CORS abierto, sin clave), emparejado por nombre con `emparejar`.

Tiempo real: cuenta atrás al segundo hasta `SALIDA` (11 ene 20:20 Madrid), hora de Japón y "lo siguiente".
`instanteDe(fecha, hora)`: el 11 ene y antes es hora de Madrid; el resto, hora de Japón.

Estilo: color y kanji por ciudad (`src/ui/ciudades.ts`), portadas con seigaiha (`Portada`, `PortadaDia`).
Ojo: `*::before, *::after` también llevan border-box (si no, los puntos y líneas se descuadran).

Ajustes del viaje (`/ajustes`, `src/domain/config.ts`): fechas, vuelos, JR Pass, fecha y "Al entrar" de cada
parque, ciudades (kanji y color). JSON en `ajustes` (id `viaje`), leído con `leerConfig` (lo inválido = por
defecto). Las funciones del dominio reciben `config` (por defecto `CONFIG_POR_DEFECTO`); en la UI sale de
`useAlba().config`. Nada de fechas fijas en el código de la UI.

Todo se puede añadir, editar y borrar: botón `BotonAnadir` visible al final de cada lista; filas que se tocan
enteras (con flecha) para editar. Iconos: Lucide (`lucide-react`) vía `Icono`, nada dibujado a mano.
Tiempo sin segundos (`useMinuto`): la cuenta atrás no marea.

Cambios en datos de partida ya publicados: migración con `UPDATE ... WHERE actualizado = 1` (así nunca pisa
lo que hayáis editado) y `version` nueva (ver 0004).

Presupuesto (pestaña, `/gastos`): tabla `gastos` (migración 0005; cada gasto guarda `euros` con el cambio de
ese momento) y lo previsto por categoría en `ajustes` (id `presupuesto`). Cambio EUR→JPY del BCE vía
Frankfurter (`src/infrastructure/cambio.ts`, sin clave, guardado en localStorage para ir sin conexión).
Importes: `euros()`, `eurosExactos()`, `yenes()` de `src/domain/gastos.ts` (con punto de miles siempre).

Tax Free (`/taxfree`): las compras son gastos con `taxFree`; `src/domain/taxfree.ts` (10 % incluido en el precio,
plazo de 90 días hasta `config.vueltaFecha`). "En las tiendas" y "El día del vuelo" son RECORDATORIOS (viñetas), no listas para marcar.

Pruebas visuales de Claude: build aparte en `dist-claude` + `wrangler pages dev dist-claude --port 8792
--persist-to .wrangler/claude` (no tocar el 8791 ni el `dist` del usuario mientras los tenga abiertos).

Navegación: barra con solo Hoy · Viaje · Hotel (`/hotel`, icono cama) · Más (`/mas`, icono cuadrado en 4: baldosas de Reservas,
Presupuesto (Tax Free va dentro), El tiempo, Avisos; apartado propio de Parques con Alba; Álbum y Ajustes). No añadir pestañas.

Tiempo y avisos (todo desde el móvil, gratis, sin clave, CORS abierto; caché con copia en localStorage para ir sin red):
- `src/domain/clima.ts`: códigos WMO (día/noche), avisos JMA (注意報/警報/特別警報), escala shindo, prefecturas en latino.
- `src/infrastructure/clima.ts`: Open-Meteo (previsión 16 días y archivo para el "clima típico"), JMA (avisos por
  oficina/zona, tifones), P2PQuake (terremotos y tsunamis de la JMA). Cada ciudad lleva lat/lon/pref/zona en Ajustes
  (las nuevas se geolocalizan por nombre).
- UI: `ChipTiempo` en las portadas, `FranjaAvisos` en Hoy (solo si hay algo), `MiniTiempo` en el itinerario
  ("~" = típico), `/tiempo` y `/avisos` (con "qué hacer", 110/119, refugios y la app Safety tips).
- Frases útiles (src/domain/frases.ts, /frases/:categoria): las de serie son fijas; las vuestras en ajustes (id frases),
  editables. Voz con speechSynthesis (ja-JP).
- Sin notificaciones con la app cerrada (pendiente, opcional: Worker con cron + Web Push).

Ideas sin pedir aún: compras friki (lista de deseos), guías (emergencias, frases).

Antes de dar algo por terminado: `npm test`, `npm run typecheck`, `npm run lint`.

Varios viajes (noviembre 2026):
- Pantalla inicial `/` = lista de viajes ("Alba Viajera"); al abrir la app sale SIEMPRE la lista. Dentro, "Alba en {destino}"
  (`tituloDelViaje`). Hoy está en `/hoy`; el resto de rutas no cambia. Alta en `/nuevo-viaje`.
- El viaje va en el id de cada fila: `<viaje>:<resto>` (`src/domain/viajes.ts`: `idEn`, `viajeDe`, `sinViaje`). Las filas
  sin prefijo son de Japón (`VIAJE_ORIGINAL = 'japon'`): así no hubo migración ni cambios en IndexedDB. `ajustes` 'alba'
  (altura) es global. Un viaje = su fila `<viaje>:viaje` en ajustes (Japón: 'viaje'; sale aunque no exista hasta borrarse).
- `ViajeLocal(almacen, viajeId, …)` solo ve y escribe lo de su viaje; `ViajesLocal` lista, crea y borra (borra todo lo suyo y
  devuelve sus fotos para `fotos.olvidar`). En la UI, `useAlba()`: `viajeId`, `listaViajes`, `elegirViaje` (localStorage
  'viaje.actual'); `useConsulta` repite al cambiar de viaje.
- ConfigViaje tiene destino, pais (ISO), moneda (ISO 4217), zona (IANA), zonaOrigen, simbolo, color y `apartados`
  (reservas, presupuesto, tiempo, album, jrpass, parques, frases, taxfree, avisos; los 5 últimos solo en Japón). Se usa
  `tiene(config, 'x')` para enseñar o no cada cosa. Horas: `instanteEnZona` / `horaEn(d, zona)` / `RelojDestino`;
  `enJapon`/`RelojJapon` quedan para lo que solo es de Japón (parques, avisos).
- Tiempo en cualquier país: Open-Meteo con `timezone=auto` (horas con `utc_offset_seconds`), ciudades buscadas en el país
  del viaje, clima típico de las mismas fechas de los dos años anteriores (`ventanaTipica`).
- Presupuesto: categorías editables (`{ categorias: [{id, nombre, previsto, icono, color}] }`; se sigue leyendo el formato
  antiguo con solo importes). Al borrar una con gastos se elige a cuál pasan. Moneda libre por gasto; cambio del BCE por
  moneda (`cambio-eur-<moneda>` en localStorage); si el BCE no la tiene, se escribe a mano.
- Datos relacionados: la ciudad de un día sale del hotel de esa noche si no tiene (`ciudadDelDia`); una ciudad escrita en un
  hotel, un día o un elemento se añade sola a las del viaje (`CampoCiudad` + `useGuardarCiudad`, `conCiudad`).
- Apartados vuestros (listas con precio): definidas en `config.listas` ({id, nombre, icono, color}); elementos en la tabla
  `elementos` (migración 0006; IndexedDB v4, que al subir de versión vuelve a pedir todo con `sync.desde` = 0). Rutas
  `/lista/:id`, `/lista/:lista/nuevo`, `/elemento/:id`; baldosa en Más. "Comprado: apuntar el gasto" abre `/gasto/nuevo`
  rellenado (`?concepto&importe&moneda&categoria&elemento`) y al guardar deja el elemento hecho y enlazado (`gasto`).
- Fechas: siempre `CampoFecha` (se escribe dd/mm/aaaa con las barras solas, o calendario del sistema con su botón vía
  `showPicker`); nada de `<input type="date">` a la vista. Categorías del presupuesto ordenables con flechas.
- Guardar sin botón: `useGuardadoSolo` (formulario.tsx; a los 700 ms de dejar de escribir y al salir). Lo usan los apartados
  vuestros en Ajustes (`ListasDelViaje`) y el modo «Organizar» de El viaje (`DiaOrganizar`: título, ciudad y plan de cada
  día ahí mismo). Hoteles → itinerario: `hotelesDelDia` / `textoSinPlan` («Llegada a…», «Noche en…») en los días sin plan;
  al guardar un hotel fuera de las fechas del viaje se ofrece ampliarlas (`fechasParaIncluir`).
- Salida e idiomas por viaje: `config.salida` {pais, ciudad} (capitales de provincia o la que se escriba; Canarias →
  Atlantic/Canary) decide `zonaOrigen`. Frases en cualquier viaje: `idiomaOrigen` (por defecto es) → `idiomaDestino`
  (por defecto el del país). Las de serie (es/ja) se traducen una vez con Workers AI (m2m100, binding `AI` en
  wrangler.toml, `/api/traducir`, server/traducir.ts) y se guardan en ajustes `<viaje>:frases-serie`; en las vuestras hay
  botón «Traducir». Mientras suena una frase el botón late y cambia a «parar» (`useVoz`).
- Sugerencias hotel ⇄ El viaje (pastillas `.sugerencia`, nada de avisos): al meter un hotel sin fechas, `nochesSinHotel` /
  `nochesParaHotel` (noches sin hotel por ciudad de los días); en un día con hotel, `SugerenciaHotel` propone su ciudad y
  «Llegada a…» como título. Desplegables de ciudades = pastillas (`ChipsCiudades`, `SugerirCiudades`, `ciudadesPais.ts`).

Conversor (`/conversor`, `ConversorPage.tsx`): moneda del viaje ⇄ €, con el cambio del día (editable a mano), importes
rápidos (`importesRapidos`), cuánto devolvería el Tax Free y "Apuntarlo como gasto" (`/gasto/nuevo?importe=&moneda=`).
Solo se entra desde Presupuesto (el usuario no lo quiere en Más ni en Hoy). No sale si la moneda es EUR. Cambio: Frankfurter v2 (`/v2/rates`, sin caché del navegador); el cambio sigue al que llegue salvo que se escriba a mano.

Foto del ticket: `gastos.foto` (migración 0007), misma tabla `fotos` que la del día (`fotos.nueva(blob)` devuelve el
nombre). La foto elegida se queda en el formulario hasta Guardar; al cambiarla, quitarla o borrar el gasto se `olvidar`
la anterior. Borrar un viaje también se lleva las de los tickets.

Exportar a Excel (Ajustes del viaje, tarjeta "Exportar a Excel"): `src/domain/exportar.ts` arma las hojas (Resumen,
Itinerario con todos los días y el hotel de cada noche, Hoteles, Trayectos, Reservas, Gastos, Presupuesto con total y una
hoja por lista propia; solo los apartados que tiene el viaje). `src/infrastructure/excel.ts` las escribe con
`write-excel-file` (import dinámico: chunk aparte) y comparte el archivo (hoja de compartir del móvil) o lo descarga.
Exporta lo guardado, no lo que se esté editando en el formulario. Importar: NO hecho (no pedido).

Resumen del viaje (Hoy cuando `fase` = después, `ResumenViaje.tsx`, `src/domain/resumen.ts`): cifras (noches, ciudades,
hoteles, trayectos/JR, entradas, fotos), lo gastado y la categoría con más gasto, tira de fotos del día, ciudades con
noches y días (hoteles cancelados no cuentan), parques y "Exportar a Excel".

Mapa del día: probado y QUITADO (17 nov 2026) a petición del usuario: muchas líneas del plan no son sitios. No volver a proponerlo.

Vuelos: `config.vuelos.{ida,vuelta}` = número, aerolínea, terminal (opcional, vacío por defecto: no inventar). En Ajustes →
Vuelos. `TarjetaVuelo` en Hoy antes de salir (solo si hay datos), el día de la ida y el de la vuelta, y en DiaPage esos
días; "Estado" = búsqueda de Google del número (`enlaceEstadoVuelo`), "estar en el aeropuerto" = 3 h antes.

Notas de Japón (sin apartado propio; salen solas en Hoy, `src/domain/consejos.ts`):
- Último tren al hotel: `dias.ultimo_tren` (migración 0008), en "Editar el día". En Hoy desde 3 h antes (`ultimoTrenPendiente`,
  mira hoy y ayer; antes de las 5:00 = madrugada del día siguiente), en rojo la última hora.
- Cambio de hotel (`cambioDeHotel`: se deja uno y se llega a otro): tarjeta el día antes y el mismo día.
- Suica (`diasSuica`, solo país JP): el día de llegar al primer hotel y el primer día con trayectos. El usuario tiene iPhone.
- Textos de serie en `CONSEJOS_DE_SERIE`, editables (`/consejos/:tipo`, ajustes id `consejos`; lista vacía = no sale).
Vuelos: `config.vuelos.facturacionHoras` (24 por defecto). La tarjeta del vuelo sale en Hoy solo desde que abre la
facturación online (`facturacionAbierta`) y el día del vuelo; ya no durante toda la cuenta atrás.

Cerrar sesión: icono (LogOut) a la derecha del punto de sincronización en la lista de viajes (`Cabecera despues=`).
`cerrarSesion()` (src/infrastructure/api.ts): pide `/api/sesion` (devuelve `${ACCESS_TEAM_DOMAIN}/cdn-cgi/access/logout`),
borra la cookie de la app con `/cdn-cgi/access/logout` y navega a la salida general del equipo, para que al volver pida
el código. Como la PWA sale de la caché del service worker, Access no salta solo: "entrar" (IndicadorSync, sesión caducada)
lleva a `/api/entrar` (no cacheado → Access pide el código → redirige a /). IndexedDB se queda. Uso previsto: renovar la sesión (dura 1 mes) el
9-10 de enero, antes del viaje.

Precio de los hoteles (migración 0009: `alojamientos.precio`, `moneda`, `pagado`): en el formulario del hotel, precio de toda la
estancia en la moneda del viaje o en € + «Ya está pagado». Pagado = gasto enlazado con id fijo `hotel-<id del hotel>`
(`idGastoDeHotel`/`hotelDelGasto`/`gastoDelHotel` en src/domain/gastos.ts; mismo id en los dos móviles, así no se duplica):
se crea, se actualiza (conserva fecha, categoría, notas, ticket y sus euros si el importe no cambia) o se quita al guardar,
cancelar o borrar el hotel (`useGastoDelHotel` en AlojamientosPage). Sin pagar = «Por pagar en los hoteles» en Presupuesto
(`hotelesPorPagar`, con el cambio de hoy) y en la ficha del hotel con botón «Pagado». El gasto de un hotel no se borra ni se
le cambia nombre/precio desde el gasto (se hace en el hotel). Cancelado = no cuenta.
Enlazar gastos de hotel ya apuntados a mano: en el formulario del hotel (si aún no tiene su gasto), pastillas con los gastos
sueltos de la categoría Alojamiento; al tocar uno se rellenan precio/moneda/pagado y al guardar pasa a ser `hotel-<id>`
(conserva día, notas, ticket y euros) y el suelto se borra (`useGastoDelHotel(..., enlazar)`).

Diario (migración 0010, tabla `diario`: id = fecha como en `dias`, `texto`; IndexedDB v5 → vuelve a pedir todo): un texto
compartido por día, en tabla aparte para no pisar el plan del día. `TarjetaDiario` (src/ui/componentes/Diario.tsx; guarda solo
lo tecleado, a los 700 ms, con «Listo» y al salir; texto vacío = se borra): en cada día de hoy hacia atrás (`sePuedeEscribir`)
y en Hoy durante el viaje desde las 18:00 el de hoy, y hasta las 12:00 el de ayer si estaba sin escribir al abrir
(`diarioEnHoy`, src/domain/diario.ts). Lectura: `/diario` (DiarioPage, con la foto del día), enlace en el Álbum y en el resumen
del viaje (solo si hay algo). Excel: hoja «Diario». La foto sigue siendo la del día (una). Nada nuevo en la barra ni en Más.
