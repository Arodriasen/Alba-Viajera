import { CONFIG_POR_DEFECTO, type CiudadConfig, type ConfigViaje } from '@/domain/config';

/** Ciudad con su kanji y color (y su posición, si se conoce). */
export type Ciudad = CiudadConfig;

/** Colores para elegir en Ajustes (y para las ciudades nuevas sin color). */
export const PALETA = ['#2d4b73', '#4f7a4a', '#c8641f', '#7a4e8c', '#2f7f86', '#8c6a43', '#b5476b', '#c73e2f', '#3d5a80', '#6b705c'];

const VIAJANDO: Ciudad = { nombre: 'De viaje', kanji: '旅', color: '#c73e2f' };

/** Otras formas de escribir la misma ciudad. */
const ALIAS: Record<string, string[]> = { tokio: ['tokyo'], kioto: ['kyoto'], hiroshima: ['miyajima'] };

const normalizar = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/** Siempre el mismo color para el mismo nombre. */
function colorAutomatico(nombre: string): string {
  let h = 0;
  for (const ch of normalizar(nombre)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETA[h % PALETA.length];
}

/** `simbolo`: lo que llevan las ciudades que no están en la lista (en Japón, 旅). */
/** `origen`: la ciudad de salida (los días allí salen como "de viaje", sin color de ciudad). */
export function ciudad(nombre: string | undefined, lista: CiudadConfig[] = CONFIG_POR_DEFECTO.ciudades, simbolo = '旅', origen = 'Madrid'): Ciudad {
  if (!nombre?.trim()) return { ...VIAJANDO, kanji: simbolo };
  const n = normalizar(nombre);
  const encontrada = lista.find((c) => {
    const clave = normalizar(c.nombre);
    return n.includes(clave) || (ALIAS[clave] ?? []).some((a) => n.includes(a));
  });
  if (encontrada) return encontrada;
  const o = normalizar(origen);
  if ((o && n.includes(o)) || n.includes('espana')) return { ...VIAJANDO, nombre, kanji: simbolo };
  return { nombre, kanji: simbolo, color: colorAutomatico(nombre) };
}

/** Los ajustes con esa ciudad añadida (color de la paleta), o undefined si ya estaba o está vacía. */
export function conCiudad(config: ConfigViaje, nombre: string | undefined): ConfigViaje | undefined {
  const n = nombre?.trim();
  if (!n) return undefined;
  if (config.ciudades.some((c) => normalizar(c.nombre) === normalizar(n))) return undefined;
  const simbolo = config.pais === 'JP' ? '旅' : config.simbolo;
  return { ...config, ciudades: [...config.ciudades, { nombre: n, kanji: simbolo, color: PALETA[config.ciudades.length % PALETA.length] }] };
}
