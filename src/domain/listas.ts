/**
 * Apartados propios de un viaje: listas con precio (equipaje, compras, recados…). Cada lista se
 * define en los ajustes del viaje; sus elementos van en la tabla `elementos` (TypeScript puro).
 */

import { ICONOS_CATEGORIA } from './gastos';

export const ICONOS_LISTA = [...ICONOS_CATEGORIA, 'equipaje', 'lista'] as const;
export type IconoLista = (typeof ICONOS_LISTA)[number];

export interface Lista {
  id: string;
  nombre: string;
  icono: IconoLista;
  color: string;
}

export interface Elemento {
  id: string;
  lista: string;
  nombre: string;
  hecho: boolean;
  notas?: string;
  /** Precio orientativo (mín. y máx.) en `moneda`. */
  precioMin?: number;
  precioMax?: number;
  moneda?: string;
  tienda?: string;
  ciudad?: string;
  /** El gasto apuntado al comprarlo. */
  gasto?: string;
  orden: number;
}

export const nuevaListaId = () => `l-${Math.random().toString(36).slice(2, 8)}`;

const COLOR = /^#[0-9a-f]{6}$/i;

/** Lee las listas guardadas en los ajustes sin fiarse de ellas. */
export function leerListas(v: unknown): Lista[] {
  if (!Array.isArray(v)) return [];
  const vistas = new Set<string>();
  return (v as Record<string, unknown>[]).flatMap((l): Lista[] => {
    if (!l || typeof l.id !== 'string' || !l.id || vistas.has(l.id) || typeof l.nombre !== 'string' || !l.nombre.trim()) return [];
    vistas.add(l.id);
    return [
      {
        id: l.id,
        nombre: l.nombre.trim(),
        icono: ICONOS_LISTA.includes(l.icono as IconoLista) ? (l.icono as IconoLista) : 'lista',
        color: typeof l.color === 'string' && COLOR.test(l.color) ? l.color : '#2d4b73',
      },
    ];
  });
}

/** Pendientes primero (por orden), luego los hechos. */
export function ordenarElementos(elementos: Elemento[]): Elemento[] {
  return [...elementos].sort((a, b) => Number(a.hecho) - Number(b.hecho) || a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es'));
}

export interface ResumenLista {
  total: number;
  hechos: number;
  /** Lo que costaría lo pendiente, por moneda: [mínimo, máximo]. Sin máximo, cuenta el mínimo (y al revés). */
  pendientePorMoneda: Record<string, [number, number]>;
}

export function resumirLista(elementos: Elemento[], monedaPorDefecto: string): ResumenLista {
  const pendientePorMoneda: Record<string, [number, number]> = {};
  for (const e of elementos) {
    if (e.hecho || (e.precioMin === undefined && e.precioMax === undefined)) continue;
    const m = e.moneda ?? monedaPorDefecto;
    const min = e.precioMin ?? e.precioMax!;
    const max = e.precioMax ?? e.precioMin!;
    const [a, b] = pendientePorMoneda[m] ?? [0, 0];
    pendientePorMoneda[m] = [a + min, b + max];
  }
  return { total: elementos.length, hechos: elementos.filter((e) => e.hecho).length, pendientePorMoneda };
}

/** El importe con el que se propone apuntar el gasto al comprarlo (el mínimo, que suele ser lo buscado). */
export const precioPropuesto = (e: Elemento) => e.precioMin ?? e.precioMax;
