/**
 * Notas de Japón que salen solas en Hoy el día que sirven (no hay apartado propio): el día antes y el día
 * de cambiar de hotel, y el de llegar / primer día de trenes (Suica). Las de serie se pueden cambiar.
 */

import type { ConfigViaje } from './config';
import { hotelesDelDia, instanteDe, sumarDias, type Alojamiento, type Dia, type Fecha, type HotelesDelDia, type Trayecto } from './viaje';

export type TipoConsejo = 'cambioHotel' | 'suica';
export type Consejos = Record<TipoConsejo, string[]>;

export const TITULO_CONSEJO: Record<TipoConsejo, string> = {
  cambioHotel: 'Al cambiar de hotel',
  suica: 'Suica y trenes',
};

export const CONSEJOS_DE_SERIE: Consejos = {
  cambioHotel: [
    'Envío de maletas (宅急便, takkyūbin): se pide en recepción el día antes y llegan al siguiente hotel en 1 día. Así vais ligeros con Alba.',
    'Consignas de la estación (コインロッカー): las grandes se llenan pronto; mejor por la mañana.',
    'Con el carrito, buscad el cartel de ascensor (エレベーター): en estaciones grandes no todas las salidas tienen.',
    'Revisad que no quede nada en la caja fuerte ni cargadores enchufados.',
  ],
  suica: [
    'En el iPhone: Cartera → + → Tarjeta de transporte → Suica. Cada adulto, la suya (no se puede pasar dos veces con la misma).',
    'Se recarga desde la Cartera. Si vuestra Visa la rechaza, probad otra tarjeta (Mastercard o Amex) o en efectivo en las máquinas de la estación o en un konbini.',
    'Alba (menos de 6 años) viaja gratis con vosotros en tren y metro. Solo paga billete de niño si ocupa un asiento reservado propio.',
    'El JR Pass no vale en el metro de Tokio ni en las líneas privadas: ahí, Suica.',
  ],
};

/** Lo guardado (ajustes, id `consejos`) sin fiarse; lo que falte o esté vacío = el de serie. */
export function leerConsejos(json: string | undefined): Consejos {
  let v: Record<string, unknown> = {};
  try {
    const p = JSON.parse(json ?? '{}');
    if (p && typeof p === 'object' && !Array.isArray(p)) v = p as Record<string, unknown>;
  } catch {
    // Roto: los de serie.
  }
  const lista = (t: TipoConsejo) => {
    const x = v[t];
    if (!Array.isArray(x)) return CONSEJOS_DE_SERIE[t];
    return x.filter((l): l is string => typeof l === 'string' && l.trim() !== '').map((l) => l.trim().slice(0, 500));
  };
  return { cambioHotel: lista('cambioHotel'), suica: lista('suica') };
}

/** Día en que se deja un hotel y se llega a otro (undefined si no lo es). */
export function cambioDeHotel(alojamientos: Alojamiento[], f: Fecha): Required<Pick<HotelesDelDia, 'llegada' | 'salida'>> | undefined {
  const h = hotelesDelDia(alojamientos, f);
  return h.llegada && h.salida ? { llegada: h.llegada, salida: h.salida } : undefined;
}

/**
 * Días de la Suica: el de llegar al primer hotel y el primero con trayectos (si es otro). Solo en Japón.
 */
export function diasSuica(c: ConfigViaje, alojamientos: Alojamiento[], trayectos: Trayecto[]): Fecha[] {
  if (c.pais !== 'JP') return [];
  const llegada = alojamientos
    .filter((a) => a.estado !== 'cancelado' && a.estado !== 'cancelar' && a.entrada && a.entrada >= c.inicio)
    .map((a) => a.entrada!)
    .sort()[0];
  const tren = trayectos.map((t) => t.fecha).filter((f) => f >= c.inicio && f <= c.fin).sort()[0];
  return [...new Set([llegada, tren].filter((f): f is Fecha => Boolean(f)))].sort();
}

export interface UltimoTren {
  cuando: Date;
  hora: string;
  /** Menos de una hora. */
  urgente: boolean;
}

/** Antes de las 5:00 es de madrugada: el tren sale ya al día siguiente. */
const instanteUltimoTren = (d: Dia, c: ConfigViaje) => instanteDe(d.ultimoTren! < '05:00' ? sumarDias(d.fecha, 1) : d.fecha, d.ultimoTren!, c);

/**
 * El último tren que toca vigilar ahora: desde 3 h antes hasta que sale. Se mira el de hoy y el de ayer
 * (un último tren de las 0:20 de ayer es ya de esta madrugada).
 */
export function ultimoTrenPendiente(dias: (Dia | undefined)[], ahora: Date, c: ConfigViaje): UltimoTren | undefined {
  const t = ahora.getTime();
  return dias
    .filter((d): d is Dia => Boolean(d?.ultimoTren && /^\d{2}:\d{2}$/.test(d.ultimoTren)))
    .map((d) => ({ cuando: instanteUltimoTren(d, c), hora: d.ultimoTren! }))
    .filter((x) => x.cuando.getTime() > t && x.cuando.getTime() - t <= 3 * 3600_000)
    .sort((a, b) => a.cuando.getTime() - b.cuando.getTime())
    .map((x) => ({ ...x, urgente: x.cuando.getTime() - t <= 3600_000 }))[0];
}

/** Si la facturación online del vuelo ya está abierta (desde N horas antes hasta que sale). */
export function facturacionAbierta(tramo: 'ida' | 'vuelta', ahora: Date, c: ConfigViaje): boolean {
  const sale = tramo === 'ida' ? instanteDe(c.inicio, c.horaSalida, c) : instanteDe(c.vueltaFecha, c.horaVuelta, c);
  const abre = sale.getTime() - c.vuelos.facturacionHoras * 3600_000;
  return ahora.getTime() >= abre && ahora.getTime() <= sale.getTime();
}
