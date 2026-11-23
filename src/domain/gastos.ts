/** Presupuesto y gastos del viaje (TypeScript puro). */

import type { Fecha } from './config';
import type { Alojamiento } from './viaje';
import { sinViaje } from './viajes';

/** Código ISO 4217 de la moneda (EUR, JPY, USD…). */
export type Moneda = string;

/** Id de una categoría del presupuesto. Las de serie se llaman como su palabra (vuelos…); las añadidas, `c-…`. */
export type Categoria = string;

/** Iconos que se pueden elegir para una categoría (la UI pone el dibujo de cada uno). */
export const ICONOS_CATEGORIA = [
  'vuelos',
  'alojamiento',
  'transporte',
  'coche',
  'gasolina',
  'entradas',
  'museo',
  'comida',
  'cafe',
  'compras',
  'regalo',
  'ropa',
  'juegos',
  'bebe',
  'salud',
  'seguro',
  'internet',
  'otros',
] as const;
export type IconoCategoria = (typeof ICONOS_CATEGORIA)[number];

export interface CategoriaPresupuesto {
  id: Categoria;
  nombre: string;
  /** Lo previsto, en euros. */
  previsto: number;
  icono: IconoCategoria;
  color: string;
}

/** Lo previsto por categoría, en el orden en que se enseñan. */
export interface Presupuesto {
  categorias: CategoriaPresupuesto[];
}

/** Las de un viaje nuevo (y las del formato antiguo, que solo guardaba los importes de estas). */
export const CATEGORIAS_DE_SERIE: CategoriaPresupuesto[] = [
  { id: 'vuelos', nombre: 'Vuelos', previsto: 0, icono: 'vuelos', color: '#2d4b73' },
  { id: 'alojamiento', nombre: 'Alojamiento', previsto: 0, icono: 'alojamiento', color: '#7a4e8c' },
  { id: 'transporte', nombre: 'Transporte', previsto: 0, icono: 'transporte', color: '#2f7f86' },
  { id: 'entradas', nombre: 'Parques y entradas', previsto: 0, icono: 'entradas', color: '#b5476b' },
  { id: 'comida', nombre: 'Comida', previsto: 0, icono: 'comida', color: '#c8641f' },
  { id: 'compras', nombre: 'Compras', previsto: 0, icono: 'compras', color: '#c73e2f' },
  { id: 'seguro', nombre: 'Seguro', previsto: 0, icono: 'seguro', color: '#4f7a4a' },
  { id: 'internet', nombre: 'Internet (eSIM)', previsto: 0, icono: 'internet', color: '#3d5a80' },
  { id: 'otros', nombre: 'Otros', previsto: 0, icono: 'otros', color: '#6b705c' },
];

export const PRESUPUESTO_VACIO: Presupuesto = { categorias: CATEGORIAS_DE_SERIE };

/** Id para una categoría añadida. */
export const nuevaCategoriaId = () => `c-${Math.random().toString(36).slice(2, 8)}`;

const COLOR = /^#[0-9a-f]{6}$/i;
const importeValido = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);

/**
 * Lee lo guardado sin fiarse. Admite el formato antiguo (`{ vuelos: 2300, … }`: solo importes de las
 * de serie) y el nuevo (`{ categorias: [...] }`).
 */
export function leerPresupuesto(json: string | undefined): Presupuesto {
  let v: Record<string, unknown> = {};
  try {
    const p = JSON.parse(json ?? '{}');
    if (p && typeof p === 'object') v = p as Record<string, unknown>;
  } catch {
    // JSON roto: las de serie a 0.
  }
  if (!Array.isArray(v.categorias)) {
    return { categorias: CATEGORIAS_DE_SERIE.map((c) => ({ ...c, previsto: importeValido(v[c.id]) })) };
  }
  const vistas = new Set<string>();
  const categorias = (v.categorias as Record<string, unknown>[]).flatMap((c): CategoriaPresupuesto[] => {
    if (!c || typeof c.id !== 'string' || !c.id || vistas.has(c.id)) return [];
    vistas.add(c.id);
    const serie = CATEGORIAS_DE_SERIE.find((s) => s.id === c.id);
    return [
      {
        id: c.id,
        nombre: typeof c.nombre === 'string' && c.nombre.trim() ? c.nombre.trim() : (serie?.nombre ?? c.id),
        previsto: importeValido(c.previsto),
        icono: ICONOS_CATEGORIA.includes(c.icono as IconoCategoria) ? (c.icono as IconoCategoria) : (serie?.icono ?? 'otros'),
        color: typeof c.color === 'string' && COLOR.test(c.color) ? c.color : (serie?.color ?? '#6b705c'),
      },
    ];
  });
  return { categorias };
}

export interface Gasto {
  id: string;
  concepto: string;
  categoria: Categoria;
  /** En la moneda en que se pagó. */
  importe: number;
  moneda: Moneda;
  /** Lo que costó en euros, con el cambio del momento (así el total no baila con el cambio). */
  euros: number;
  fecha: Fecha;
  /** Compra con Tax Free (para el trámite del aeropuerto). */
  taxFree: boolean;
  notas?: string;
  /** Foto del ticket (nombre en la tabla de fotos). */
  foto?: string;
}

/** Pasa un importe a euros con el cambio "1 € = N (moneda)". */
export function aEuros(importe: number, moneda: Moneda, porEuro: number): number {
  return moneda === 'EUR' ? importe : importe / porEuro;
}

/** Lo contrario: de euros a la moneda con el cambio "1 € = N (moneda)". */
export function deEuros(euros: number, moneda: Moneda, porEuro: number): number {
  return moneda === 'EUR' ? euros : euros * porEuro;
}

/** Redondea a una o dos cifras significativas "de precio" (873 → 900, 1.758 → 1.800). */
function redondoDePrecio(n: number): number {
  if (n <= 0) return 0;
  const paso = 10 ** Math.max(0, Math.floor(Math.log10(n)) - 1);
  return Math.round(n / paso) * paso;
}

/** Importes para tocar de un golpe en el conversor, en la moneda que se escribe. */
export function importesRapidos(moneda: Moneda, porEuro: number | undefined): number[] {
  if (moneda === 'EUR') return [5, 10, 20, 50, 100];
  if (moneda === 'JPY') return [500, 1000, 3000, 5000, 10000];
  if (!porEuro || porEuro <= 0) return [];
  return [...new Set([5, 10, 20, 50, 100].map((e) => redondoDePrecio(e * porEuro)))];
}

export interface ResumenCategoria {
  categoria: CategoriaPresupuesto;
  previsto: number;
  gastado: number;
  gastos: Gasto[];
}

export interface Resumen {
  previsto: number;
  gastado: number;
  /** Previsto − gastado (negativo = os habéis pasado). */
  queda: number;
  categorias: ResumenCategoria[];
}

/** Para gastos de una categoría que ya no existe (borrada en el otro móvil, por ejemplo). */
const huerfana = (id: string): CategoriaPresupuesto => ({ id, nombre: id.startsWith('c-') ? 'Sin categoría' : id, previsto: 0, icono: 'otros', color: '#6b705c' });

export function resumir(gastos: Gasto[], presupuesto: Presupuesto): Resumen {
  const ids = new Set(presupuesto.categorias.map((c) => c.id));
  const sueltas = [...new Set(gastos.map((g) => g.categoria).filter((c) => !ids.has(c)))].map(huerfana);
  const categorias = [...presupuesto.categorias, ...sueltas].map((categoria) => {
    const suyos = gastos
      .filter((g) => g.categoria === categoria.id)
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || a.concepto.localeCompare(b.concepto));
    return { categoria, previsto: categoria.previsto, gastado: suyos.reduce((s, g) => s + g.euros, 0), gastos: suyos };
  });
  const previsto = categorias.reduce((s, c) => s + c.previsto, 0);
  const gastado = categorias.reduce((s, c) => s + c.gastado, 0);
  return { previsto, gastado, queda: previsto - gastado, categorias };
}

/** Lo gastado cada día (para "hoy llevamos…"). */
export function gastadoEl(gastos: Gasto[], f: Fecha): number {
  return gastos.filter((g) => g.fecha === f).reduce((s, g) => s + g.euros, 0);
}

// useGrouping 'always': en español Intl no pone el punto de miles a los números de 4 cifras ("2400").
const entero = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, useGrouping: 'always' });
const decimales = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' });

/** "1.250 €" (redondeado, para totales). */
export const euros = (n: number) => `${entero.format(Math.round(n))} €`;
/** "18,05 €" (con céntimos, para cada gasto). */
export const eurosExactos = (n: number) => `${decimales.format(n)} €`;
/** "¥2.400" */
export const yenes = (n: number) => `¥${entero.format(Math.round(n))}`;

/** Monedas sin céntimos de uso corriente. */
const SIN_DECIMALES = new Set(['JPY', 'KRW', 'ISK', 'HUF', 'CLP', 'COP', 'IDR', 'VND']);

/** Símbolo corto de una moneda ("€", "¥", "$", "£"…; si no tiene, el código). */
export function simboloMoneda(moneda: Moneda): string {
  try {
    const p = new Intl.NumberFormat('es-ES', { style: 'currency', currency: moneda, currencyDisplay: 'narrowSymbol' }).formatToParts(0);
    return p.find((x) => x.type === 'currency')?.value ?? moneda;
  } catch {
    return moneda;
  }
}

/** Un importe en su moneda: "18,05 €", "¥2.400", "12,50 $". */
export function enMoneda(n: number, moneda: Moneda): string {
  if (moneda === 'EUR') return eurosExactos(n);
  if (moneda === 'JPY') return yenes(n);
  const fmt = SIN_DECIMALES.has(moneda) ? entero : decimales;
  return `${fmt.format(SIN_DECIMALES.has(moneda) ? Math.round(n) : n)} ${simboloMoneda(moneda)}`;
}

export const importeEnSuMoneda = (g: Pick<Gasto, 'importe' | 'moneda'>) => enMoneda(g.importe, g.moneda);

// ── Precio de los hoteles ────────────────────────────────────────────────────────────────────────
// Un hotel con precio y pagado cuenta como un gasto más del presupuesto: la fila `hotel-<id>` de
// gastos (el mismo id en los dos móviles, así nunca sale dos veces). Sin pagar, sale "por pagar".

const PREFIJO_HOTEL = 'hotel-';

/** Id del gasto que lleva el precio de un hotel pagado. */
export const idGastoDeHotel = (alojamientoId: string) => `${PREFIJO_HOTEL}${sinViaje(alojamientoId)}`;
/** El id del hotel de un gasto que viene de un hotel (o undefined si es un gasto normal). */
export const hotelDelGasto = (gastoId: string) => (sinViaje(gastoId).startsWith(PREFIJO_HOTEL) ? sinViaje(gastoId).slice(PREFIJO_HOTEL.length) : undefined);

/** Un hotel con precio que no está cancelado (los cancelados no cuentan). */
export const hotelConPrecio = (a: Alojamiento) => a.estado !== 'cancelado' && (a.precio ?? 0) > 0;

/**
 * El gasto de un hotel pagado (o undefined si no debe haberlo: sin precio, sin pagar o cancelado). Conserva
 * del gasto que ya hubiera la fecha, la categoría, las notas, el Tax Free y la foto; y sus euros si el
 * importe no ha cambiado (así no baila con el cambio del día).
 */
export function gastoDelHotel(
  a: Alojamiento,
  o: { existente?: Gasto; porEuro: number; hoy: Fecha; categorias: Categoria[] },
): Gasto | undefined {
  if (!hotelConPrecio(a) || !a.pagado) return undefined;
  const moneda = a.moneda ?? 'EUR';
  const importe = a.precio!;
  const e = o.existente;
  const mismo = e && e.importe === importe && e.moneda === moneda;
  const cat = o.categorias.includes('alojamiento') ? 'alojamiento' : o.categorias.includes('otros') ? 'otros' : (o.categorias[0] ?? 'otros');
  return {
    id: idGastoDeHotel(a.id),
    concepto: a.nombre.trim(),
    categoria: e?.categoria ?? cat,
    importe,
    moneda,
    euros: mismo ? e.euros : aEuros(importe, moneda, o.porEuro),
    fecha: e?.fecha ?? o.hoy,
    taxFree: e?.taxFree ?? false,
    notas: e?.notas,
    foto: e?.foto,
  };
}

export interface HotelPorPagar {
  alojamiento: Alojamiento;
  importe: number;
  moneda: Moneda;
  /** Con el cambio de hoy (undefined si no hay cambio para esa moneda). */
  euros?: number;
}

/** Los hoteles con precio que aún se pagan allí, por fecha de llegada. */
export function hotelesPorPagar(alojamientos: Alojamiento[], porEuro: (m: Moneda) => number | undefined): HotelPorPagar[] {
  return alojamientos
    .filter((a) => hotelConPrecio(a) && !a.pagado)
    .sort((a, b) => (a.entrada ?? '9').localeCompare(b.entrada ?? '9'))
    .map((a) => {
      const moneda = a.moneda ?? 'EUR';
      const c = moneda === 'EUR' ? 1 : porEuro(moneda);
      return { alojamiento: a, importe: a.precio!, moneda, euros: c && c > 0 ? aEuros(a.precio!, moneda, c) : undefined };
    });
}
