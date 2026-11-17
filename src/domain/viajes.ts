/**
 * Varios viajes en la misma app, independientes entre sí (TypeScript puro).
 *
 * Cada fila de cualquier tabla pertenece a un viaje según su id: `<viaje>:<resto>`. Las filas sin
 * prefijo son del primer viaje (Japón), que existía antes que esto; así no hubo que tocar ni el
 * servidor ni lo guardado en los móviles. Los ajustes de `AJUSTES_GLOBALES` no son de ningún viaje.
 */

export type ViajeId = string;

/** El viaje de Japón: sus filas no llevan prefijo. */
export const VIAJE_ORIGINAL: ViajeId = 'japon';

/** Ajustes compartidos por todos los viajes (la altura de Alba). */
export const AJUSTES_GLOBALES = ['alba'];

/** El id de una fila de ese viaje. */
export function idEn(viaje: ViajeId, base: string): string {
  if (viaje === VIAJE_ORIGINAL) return base;
  return base.startsWith(`${viaje}:`) ? base : `${viaje}:${base}`;
}

/** De qué viaje es una fila. */
export function viajeDe(id: string): ViajeId {
  const i = id.indexOf(':');
  return i < 0 ? VIAJE_ORIGINAL : id.slice(0, i);
}

/** El id sin el viaje (la fecha de un día, 'presupuesto'…). */
export function sinViaje(id: string): string {
  const i = id.indexOf(':');
  return i < 0 ? id : id.slice(i + 1);
}

export const esDelViaje = (id: string, viaje: ViajeId) => viajeDe(id) === viaje && !(viaje === VIAJE_ORIGINAL && AJUSTES_GLOBALES.includes(id));

export const nuevoViajeId = (): ViajeId => `v${Math.random().toString(36).slice(2, 9)}`;

/** Partes de la app que cada viaje enseña o no (Hoy, Viaje y Hotel están siempre). */
export type Apartado = 'reservas' | 'presupuesto' | 'tiempo' | 'album' | 'jrpass' | 'parques' | 'frases' | 'taxfree' | 'avisos';

export interface InfoApartado {
  id: Apartado;
  nombre: string;
  detalle: string;
  /** Solo tiene sentido en Japón (sus datos o servicios son de allí). */
  soloJapon?: boolean;
}

export const APARTADOS: InfoApartado[] = [
  { id: 'reservas', nombre: 'Reservas y entradas', detalle: 'Qué comprar y cuándo sale a la venta' },
  { id: 'presupuesto', nombre: 'Presupuesto', detalle: 'Lo previsto y lo gastado, en euros y en la moneda del país' },
  { id: 'tiempo', nombre: 'El tiempo', detalle: 'Previsión por ciudades y el tiempo de cada día' },
  { id: 'album', nombre: 'Foto del día y álbum', detalle: 'Una foto por día del viaje' },
  { id: 'jrpass', nombre: 'JR Pass', detalle: 'Qué días está activo y qué trayectos cubre', soloJapon: true },
  { id: 'parques', nombre: 'Parques con Alba', detalle: 'Tokyo Disney y USJ: qué puede montar, esperas en directo', soloJapon: true },
  { id: 'frases', nombre: 'Frases útiles', detalle: 'En el idioma de allí, para enseñar o escuchar' },
  { id: 'taxfree', nombre: 'Tax Free', detalle: 'Compras sin impuesto y recordatorios del aeropuerto', soloJapon: true },
  { id: 'avisos', nombre: 'Avisos', detalle: 'Terremotos, tsunamis y tifones (Agencia Meteorológica de Japón)', soloJapon: true },
];

export const TODOS_LOS_APARTADOS = APARTADOS.map((a) => a.id);
/** Lo que viene marcado al crear un viaje (en Japón, todo). */
export const apartadosPorDefecto = (pais: string): Apartado[] =>
  pais === 'JP' ? TODOS_LOS_APARTADOS : APARTADOS.filter((a) => !a.soloJapon).map((a) => a.id);
/** Los que se pueden elegir en ese país. */
export const apartadosDe = (pais: string): InfoApartado[] => APARTADOS.filter((a) => !a.soloJapon || pais === 'JP');

export interface Pais {
  /** ISO 3166-1 alfa-2. */
  codigo: string;
  nombre: string;
  moneda: string;
  /** Zona horaria principal (IANA). */
  zona: string;
}

/** Los destinos más habituales; el país se puede cambiar después y la moneda y la hora también. */
export const PAISES: Pais[] = [
  { codigo: 'JP', nombre: 'Japón', moneda: 'JPY', zona: 'Asia/Tokyo' },
  { codigo: 'ES', nombre: 'España', moneda: 'EUR', zona: 'Europe/Madrid' },
  { codigo: 'PT', nombre: 'Portugal', moneda: 'EUR', zona: 'Europe/Lisbon' },
  { codigo: 'FR', nombre: 'Francia', moneda: 'EUR', zona: 'Europe/Paris' },
  { codigo: 'IT', nombre: 'Italia', moneda: 'EUR', zona: 'Europe/Rome' },
  { codigo: 'DE', nombre: 'Alemania', moneda: 'EUR', zona: 'Europe/Berlin' },
  { codigo: 'NL', nombre: 'Países Bajos', moneda: 'EUR', zona: 'Europe/Amsterdam' },
  { codigo: 'BE', nombre: 'Bélgica', moneda: 'EUR', zona: 'Europe/Brussels' },
  { codigo: 'AT', nombre: 'Austria', moneda: 'EUR', zona: 'Europe/Vienna' },
  { codigo: 'GR', nombre: 'Grecia', moneda: 'EUR', zona: 'Europe/Athens' },
  { codigo: 'IE', nombre: 'Irlanda', moneda: 'EUR', zona: 'Europe/Dublin' },
  { codigo: 'FI', nombre: 'Finlandia', moneda: 'EUR', zona: 'Europe/Helsinki' },
  { codigo: 'GB', nombre: 'Reino Unido', moneda: 'GBP', zona: 'Europe/London' },
  { codigo: 'CH', nombre: 'Suiza', moneda: 'CHF', zona: 'Europe/Zurich' },
  { codigo: 'DK', nombre: 'Dinamarca', moneda: 'DKK', zona: 'Europe/Copenhagen' },
  { codigo: 'NO', nombre: 'Noruega', moneda: 'NOK', zona: 'Europe/Oslo' },
  { codigo: 'SE', nombre: 'Suecia', moneda: 'SEK', zona: 'Europe/Stockholm' },
  { codigo: 'IS', nombre: 'Islandia', moneda: 'ISK', zona: 'Atlantic/Reykjavik' },
  { codigo: 'PL', nombre: 'Polonia', moneda: 'PLN', zona: 'Europe/Warsaw' },
  { codigo: 'CZ', nombre: 'Chequia', moneda: 'CZK', zona: 'Europe/Prague' },
  { codigo: 'HU', nombre: 'Hungría', moneda: 'HUF', zona: 'Europe/Budapest' },
  { codigo: 'TR', nombre: 'Turquía', moneda: 'TRY', zona: 'Europe/Istanbul' },
  { codigo: 'MA', nombre: 'Marruecos', moneda: 'MAD', zona: 'Africa/Casablanca' },
  { codigo: 'EG', nombre: 'Egipto', moneda: 'EGP', zona: 'Africa/Cairo' },
  { codigo: 'US', nombre: 'Estados Unidos', moneda: 'USD', zona: 'America/New_York' },
  { codigo: 'CA', nombre: 'Canadá', moneda: 'CAD', zona: 'America/Toronto' },
  { codigo: 'MX', nombre: 'México', moneda: 'MXN', zona: 'America/Mexico_City' },
  { codigo: 'CU', nombre: 'Cuba', moneda: 'CUP', zona: 'America/Havana' },
  { codigo: 'DO', nombre: 'República Dominicana', moneda: 'DOP', zona: 'America/Santo_Domingo' },
  { codigo: 'AR', nombre: 'Argentina', moneda: 'ARS', zona: 'America/Argentina/Buenos_Aires' },
  { codigo: 'BR', nombre: 'Brasil', moneda: 'BRL', zona: 'America/Sao_Paulo' },
  { codigo: 'PE', nombre: 'Perú', moneda: 'PEN', zona: 'America/Lima' },
  { codigo: 'KR', nombre: 'Corea del Sur', moneda: 'KRW', zona: 'Asia/Seoul' },
  { codigo: 'CN', nombre: 'China', moneda: 'CNY', zona: 'Asia/Shanghai' },
  { codigo: 'TH', nombre: 'Tailandia', moneda: 'THB', zona: 'Asia/Bangkok' },
  { codigo: 'VN', nombre: 'Vietnam', moneda: 'VND', zona: 'Asia/Ho_Chi_Minh' },
  { codigo: 'SG', nombre: 'Singapur', moneda: 'SGD', zona: 'Asia/Singapore' },
  { codigo: 'ID', nombre: 'Indonesia', moneda: 'IDR', zona: 'Asia/Makassar' },
  { codigo: 'IN', nombre: 'India', moneda: 'INR', zona: 'Asia/Kolkata' },
  { codigo: 'AE', nombre: 'Emiratos Árabes', moneda: 'AED', zona: 'Asia/Dubai' },
  { codigo: 'AU', nombre: 'Australia', moneda: 'AUD', zona: 'Australia/Sydney' },
  { codigo: 'NZ', nombre: 'Nueva Zelanda', moneda: 'NZD', zona: 'Pacific/Auckland' },
];

/** Idioma principal de cada país (para las frases). */
const IDIOMA_PAIS: Record<string, string> = {
  JP: 'ja', ES: 'es', PT: 'pt', FR: 'fr', IT: 'it', DE: 'de', NL: 'nl', BE: 'fr', AT: 'de', GR: 'el', IE: 'en', FI: 'fi', GB: 'en',
  CH: 'de', DK: 'da', NO: 'no', SE: 'sv', IS: 'is', PL: 'pl', CZ: 'cs', HU: 'hu', TR: 'tr', MA: 'ar', EG: 'ar', US: 'en', CA: 'en',
  MX: 'es', CU: 'es', DO: 'es', AR: 'es', BR: 'pt', PE: 'es', KR: 'ko', CN: 'zh', TH: 'th', VN: 'vi', SG: 'en', ID: 'id', IN: 'hi',
  AE: 'ar', AU: 'en', NZ: 'en',
};
export const idiomaDelPais = (codigo: string) => IDIOMA_PAIS[codigo] ?? 'en';

/** La capital (para elegir de dónde se sale fuera de España). */
const CAPITAL: Record<string, string> = {
  JP: 'Tokio', ES: 'Madrid', PT: 'Lisboa', FR: 'París', IT: 'Roma', DE: 'Berlín', NL: 'Ámsterdam', BE: 'Bruselas', AT: 'Viena',
  GR: 'Atenas', IE: 'Dublín', FI: 'Helsinki', GB: 'Londres', CH: 'Berna', DK: 'Copenhague', NO: 'Oslo', SE: 'Estocolmo',
  IS: 'Reikiavik', PL: 'Varsovia', CZ: 'Praga', HU: 'Budapest', TR: 'Ankara', MA: 'Rabat', EG: 'El Cairo', US: 'Washington',
  CA: 'Ottawa', MX: 'Ciudad de México', CU: 'La Habana', DO: 'Santo Domingo', AR: 'Buenos Aires', BR: 'Brasilia', PE: 'Lima',
  KR: 'Seúl', CN: 'Pekín', TH: 'Bangkok', VN: 'Hanói', SG: 'Singapur', ID: 'Yakarta', IN: 'Nueva Delhi', AE: 'Abu Dabi',
  AU: 'Canberra', NZ: 'Wellington',
};
export const capitalDe = (codigo: string) => CAPITAL[codigo];

export const paisDe = (codigo: string): Pais | undefined => PAISES.find((p) => p.codigo === codigo);

/** La bandera del país como emoji ("JP" → 🇯🇵). */
export function bandera(codigo: string): string {
  if (!/^[A-Z]{2}$/.test(codigo)) return '✈️';
  return String.fromCodePoint(...[...codigo].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/** "Alba en Japón". */
export const tituloDelViaje = (destino: string) => `Alba en ${destino.trim() || 'su viaje'}`;

/**
 * Minutos que esa zona va por delante de UTC en ese instante (cuenta el horario de verano).
 */
export function desfaseMinutos(zona: string, instante: Date): number {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: zona,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(instante)
      .map((p) => [p.type, p.value]),
  );
  const comoUtc = Date.UTC(+partes.year, +partes.month - 1, +partes.day, +partes.hour, +partes.minute, +partes.second);
  return Math.round((comoUtc - Math.floor(instante.getTime() / 1000) * 1000) / 60_000);
}

/** El instante de una fecha y hora de reloj en esa zona ('2027-01-14', '09:00', 'Asia/Tokyo'). */
export function instanteEnZona(fecha: string, hora: string, zona: string): Date {
  const comoUtc = new Date(`${fecha}T${hora}:00Z`).getTime();
  // Dos pasadas: la primera aproxima; la segunda corrige si justo cambia la hora (verano/invierno).
  let t = comoUtc - desfaseMinutos(zona, new Date(comoUtc)) * 60_000;
  t = comoUtc - desfaseMinutos(zona, new Date(t)) * 60_000;
  return new Date(t);
}

/** ¿Es una zona horaria que el navegador conoce? */
export function zonaValida(zona: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zona });
    return true;
  } catch {
    return false;
  }
}
