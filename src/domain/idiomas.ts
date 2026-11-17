/** Idiomas para las frases útiles y ciudades de salida del viaje (TypeScript puro). */

export interface Idioma {
  /** ISO 639-1 (el que entiende el traductor). */
  codigo: string;
  nombre: string;
  /** Para la voz del móvil (BCP 47). */
  voz: string;
}

export const IDIOMAS: Idioma[] = [
  { codigo: 'es', nombre: 'Español', voz: 'es-ES' },
  { codigo: 'en', nombre: 'Inglés', voz: 'en-GB' },
  { codigo: 'fr', nombre: 'Francés', voz: 'fr-FR' },
  { codigo: 'it', nombre: 'Italiano', voz: 'it-IT' },
  { codigo: 'pt', nombre: 'Portugués', voz: 'pt-PT' },
  { codigo: 'de', nombre: 'Alemán', voz: 'de-DE' },
  { codigo: 'nl', nombre: 'Neerlandés', voz: 'nl-NL' },
  { codigo: 'ca', nombre: 'Catalán', voz: 'ca-ES' },
  { codigo: 'eu', nombre: 'Euskera', voz: 'eu-ES' },
  { codigo: 'gl', nombre: 'Gallego', voz: 'gl-ES' },
  { codigo: 'el', nombre: 'Griego', voz: 'el-GR' },
  { codigo: 'da', nombre: 'Danés', voz: 'da-DK' },
  { codigo: 'sv', nombre: 'Sueco', voz: 'sv-SE' },
  { codigo: 'no', nombre: 'Noruego', voz: 'nb-NO' },
  { codigo: 'fi', nombre: 'Finés', voz: 'fi-FI' },
  { codigo: 'is', nombre: 'Islandés', voz: 'is-IS' },
  { codigo: 'pl', nombre: 'Polaco', voz: 'pl-PL' },
  { codigo: 'cs', nombre: 'Checo', voz: 'cs-CZ' },
  { codigo: 'hu', nombre: 'Húngaro', voz: 'hu-HU' },
  { codigo: 'ru', nombre: 'Ruso', voz: 'ru-RU' },
  { codigo: 'tr', nombre: 'Turco', voz: 'tr-TR' },
  { codigo: 'ar', nombre: 'Árabe', voz: 'ar-SA' },
  { codigo: 'ja', nombre: 'Japonés', voz: 'ja-JP' },
  { codigo: 'ko', nombre: 'Coreano', voz: 'ko-KR' },
  { codigo: 'zh', nombre: 'Chino', voz: 'zh-CN' },
  { codigo: 'th', nombre: 'Tailandés', voz: 'th-TH' },
  { codigo: 'vi', nombre: 'Vietnamita', voz: 'vi-VN' },
  { codigo: 'id', nombre: 'Indonesio', voz: 'id-ID' },
  { codigo: 'hi', nombre: 'Hindi', voz: 'hi-IN' },
];

export const idiomaDe = (codigo: string): Idioma => IDIOMAS.find((i) => i.codigo === codigo) ?? { codigo, nombre: codigo, voz: codigo };
/** "japonés" (para frases como "No hablo japonés"). */
export const nombreEnFrase = (codigo: string) => idiomaDe(codigo).nombre.toLowerCase();

/** Capitales de provincia (y Ceuta y Melilla): de dónde se suele salir desde España. */
export const CAPITALES_ESPANA = [
  'A Coruña', 'Albacete', 'Alicante', 'Almería', 'Ávila', 'Badajoz', 'Barcelona', 'Bilbao', 'Burgos', 'Cáceres', 'Cádiz',
  'Castellón de la Plana', 'Ceuta', 'Ciudad Real', 'Córdoba', 'Cuenca', 'Girona', 'Granada', 'Guadalajara', 'Huelva', 'Huesca',
  'Jaén', 'Las Palmas de Gran Canaria', 'León', 'Lleida', 'Logroño', 'Lugo', 'Madrid', 'Málaga', 'Melilla', 'Murcia', 'Ourense',
  'Oviedo', 'Palencia', 'Palma', 'Pamplona', 'Pontevedra', 'Salamanca', 'San Sebastián', 'Santa Cruz de Tenerife', 'Santander',
  'Segovia', 'Sevilla', 'Soria', 'Tarragona', 'Teruel', 'Toledo', 'Valencia', 'Valladolid', 'Vitoria-Gasteiz', 'Zamora', 'Zaragoza',
];

/** Canarias va una hora por detrás de la Península. */
const CANARIAS = ['las palmas', 'santa cruz de tenerife', 'tenerife', 'gran canaria', 'lanzarote', 'fuerteventura', 'la palma', 'arrecife'];

/** La hora de casa según de dónde se sale. */
export function zonaDeSalida(pais: string, ciudad: string, zonaDelPais: string | undefined): string {
  const c = ciudad.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (pais === 'ES') return CANARIAS.some((x) => c.includes(x)) ? 'Atlantic/Canary' : 'Europe/Madrid';
  return zonaDelPais ?? 'Europe/Madrid';
}
