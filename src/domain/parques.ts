/** Parques con Alba: qué puede hacer según su altura (TypeScript puro). */

import { CONFIG_POR_DEFECTO, type ConfigViaje, type Fecha, type IdParque } from './config';

export type { IdParque };
export type TipoAtraccion = 'atraccion' | 'show' | 'zona';

export interface Atraccion {
  id: string;
  parque: IdParque;
  nombre: string;
  zona?: string;
  tipo: TipoAtraccion;
  /** cm; undefined = sin altura mínima. */
  alturaMin?: number;
  cerrada: boolean;
  imprescindible: boolean;
  unica: boolean;
  notas?: string;
  hecha: boolean;
  orden: number;
}

export interface Parque {
  id: IdParque;
  nombre: string;
  kanji: string;
  color: string;
  /** De Ajustes del viaje. */
  fecha: Fecha;
  /** Lo primero que hay que hacer al entrar (de Ajustes del viaje). */
  primero: string;
}

/** Lo fijo de cada parque; la fecha y el consejo de "Al entrar" se editan en Ajustes del viaje. */
const FIJOS: Omit<Parque, 'fecha' | 'primero'>[] = [
  { id: 'tdl', nombre: 'Tokyo Disneyland', kanji: '夢', color: '#b5476b' },
  { id: 'tds', nombre: 'Tokyo DisneySea', kanji: '海', color: '#1f6f8b' },
  { id: 'usj', nombre: 'Universal Studios Japan', kanji: '遊', color: '#2f4fa8' },
];

export function parquesDe(c: ConfigViaje = CONFIG_POR_DEFECTO): Parque[] {
  return FIJOS.map((p) => ({ ...p, ...c.parques[p.id] }));
}
export const parqueDelDia = (f: Fecha, c: ConfigViaje = CONFIG_POR_DEFECTO) => parquesDe(c).find((p) => p.fecha === f);
export const parque = (id: string, c: ConfigViaje = CONFIG_POR_DEFECTO) => parquesDe(c).find((p) => p.id === id);

export type Aptitud = 'puede' | 'swap' | 'cerrada';

/**
 * 'puede' si Alba llega (o no hay altura mínima), 'swap' si no llega (los adultos se turnan con
 * Rider Swap), 'cerrada' si está cerrada esas fechas.
 */
export function aptitud(a: Atraccion, alturaAlba: number): Aptitud {
  if (a.cerrada) return 'cerrada';
  if (a.alturaMin !== undefined && alturaAlba < a.alturaMin) return 'swap';
  return 'puede';
}

/** Las de un parque, primero las imprescindibles y luego por el orden de la guía. */
export function delParque(atracciones: Atraccion[], id: IdParque): Atraccion[] {
  return atracciones
    .filter((a) => a.parque === id)
    .sort((a, b) => Number(b.imprescindible) - Number(a.imprescindible) || a.orden - b.orden);
}

export function resumen(atracciones: Atraccion[], alturaAlba: number) {
  const abiertas = atracciones.filter((a) => !a.cerrada);
  return {
    abiertas: abiertas.length,
    puede: abiertas.filter((a) => aptitud(a, alturaAlba) === 'puede').length,
    hechas: abiertas.filter((a) => a.hecha).length,
  };
}

export const ALTURA_ALBA_POR_DEFECTO = 87;

// ───── Datos en directo (estado, esperas, shows, horario) ─────

export type EstadoVivo = 'abierta' | 'cerrada' | 'parada' | 'obras';

export interface EntidadEnVivo {
  nombre: string;
  tipo: 'atraccion' | 'show' | 'otro';
  estado: EstadoVivo;
  /** Minutos de espera, si los dan. */
  espera?: number;
  /** Próximas funciones de hoy (instantes). */
  funciones: Date[];
}

export interface Horario {
  abre: Date;
  cierra: Date;
}

export interface ParqueEnVivo {
  actualizado: Date;
  /** Horario de hoy en Japón (si abre hoy). */
  hoy?: Horario;
  /** Horario del día de nuestra visita (si ya está publicado). */
  diaVisita?: Horario;
  entidades: EntidadEnVivo[];
}

const limpiar = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\([^)]*\)/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const STOP = new Set(['the', 'a', 'of', 'and', 'ride', 's']);
const palabras = (t: string) => new Set(limpiar(t).split(' ').filter((w) => w && !STOP.has(w)));

/** La entidad en directo que corresponde a una atracción de nuestra lista (por nombre). */
export function emparejar<T extends { nombre: string }>(nombre: string, entidades: T[]): T | undefined {
  const n = limpiar(nombre);
  if (!n) return undefined;
  const exacta = entidades.find((e) => limpiar(e.nombre) === n);
  if (exacta) return exacta;
  const contiene = entidades.find((e) => {
    const m = limpiar(e.nombre);
    return m.includes(n) || n.includes(m);
  });
  if (contiene) return contiene;
  // Por palabras en común (Jaccard), para variantes como "Despicable Me: Minion Mayhem".
  const a = palabras(nombre);
  let mejor: { e: T; p: number } | undefined;
  for (const e of entidades) {
    const b = palabras(e.nombre);
    const comunes = [...a].filter((w) => b.has(w)).length;
    const p = comunes / new Set([...a, ...b]).size;
    if (p >= 0.6 && (!mejor || p > mejor.p)) mejor = { e, p };
  }
  return mejor?.e;
}
