import { CONFIG_POR_DEFECTO, type ConfigViaje } from './config';
import { instanteEnZona } from './viajes';

/**
 * Reglas del viaje (TypeScript puro, sin navegador ni React). Las fechas de calendario van como
 * texto 'AAAA-MM-DD' (comparables como texto); los instantes, como Date.
 */

export type Fecha = string;

export interface Dia {
  fecha: Fecha;
  titulo: string;
  ciudad?: string;
  /** Una cosa por línea. */
  plan: string[];
  notas?: string;
  foto?: string;
}

export type EstadoAlojamiento = 'reservado' | 'pendiente' | 'cancelar' | 'cancelado';

export interface Alojamiento {
  id: string;
  nombre: string;
  ciudad?: string;
  /** Noche de llegada. */
  entrada?: Fecha;
  /** Día de salida (esa noche ya no se duerme aquí). */
  salida?: Fecha;
  direccion?: string;
  direccionJa?: string;
  checkin?: string;
  checkout?: string;
  estado: EstadoAlojamiento;
  notas?: string;
  enlace?: string;
}

export type EstadoReserva = 'pendiente' | 'comprada' | 'descartada';

export interface Reserva {
  id: string;
  titulo: string;
  fechaUso?: Fecha;
  horaUso?: string;
  /** Cuándo se pone a la venta. */
  venta?: Date;
  estado: EstadoReserva;
  enlace?: string;
  notas?: string;
}

export interface Trayecto {
  id: string;
  fecha: Fecha;
  hora?: string;
  titulo: string;
  origen?: string;
  destino?: string;
  pasos: string[];
  duracion?: string;
  /** true = lo cubre el JR Pass, false = no, undefined = sin decir. */
  jrPass?: boolean;
  notas?: string;
  orden: number;
}

export function aFecha(d: Date): Fecha {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Mediodía de esa fecha en hora local: así los cambios de horario no la mueven de día. */
export function deFecha(f: Fecha): Date {
  const [y, m, d] = f.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function sumarDias(f: Fecha, n: number): Fecha {
  const d = deFecha(f);
  d.setDate(d.getDate() + n);
  return aFecha(d);
}

export function diasEntre(desde: Fecha, hasta: Fecha): number {
  return Math.round((deFecha(hasta).getTime() - deFecha(desde).getTime()) / 86_400_000);
}

/** Todas las fechas del viaje, de la salida a la llegada. */
export function fechasDelViaje(c: ConfigViaje = CONFIG_POR_DEFECTO): Fecha[] {
  const total = Math.max(0, diasEntre(c.inicio, c.fin));
  return Array.from({ length: total + 1 }, (_, i) => sumarDias(c.inicio, i));
}

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function diaSemana(f: Fecha): string {
  return DIAS_SEMANA[deFecha(f).getDay()];
}

/** "jueves 14 de enero" */
export function fechaLarga(f: Fecha): string {
  const d = deFecha(f);
  return `${diaSemana(f)} ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

/** "14 ene" */
export function fechaCorta(f: Fecha): string {
  const d = deFecha(f);
  return `${d.getDate()} ${MESES_CORTOS[d.getMonth()]}`;
}

export type Fase = { tipo: 'antes'; faltan: number } | { tipo: 'durante'; dia: number; total: number } | { tipo: 'despues' };

export function fase(hoy: Fecha, c: ConfigViaje = CONFIG_POR_DEFECTO): Fase {
  if (hoy < c.inicio) return { tipo: 'antes', faltan: diasEntre(hoy, c.inicio) };
  if (hoy > c.fin) return { tipo: 'despues' };
  return { tipo: 'durante', dia: diasEntre(c.inicio, hoy) + 1, total: diasEntre(c.inicio, c.fin) + 1 };
}

/** Día del JR Pass (1..N) o undefined si ese día no está activo. */
export function diaJrPass(f: Fecha, c: ConfigViaje = CONFIG_POR_DEFECTO): number | undefined {
  const n = diasEntre(c.jrPass.inicio, f) + 1;
  return n >= 1 && n <= c.jrPass.dias ? n : undefined;
}

const PRIORIDAD: Record<EstadoAlojamiento, number> = { reservado: 0, pendiente: 1, cancelar: 2, cancelado: 3 };

/**
 * Dónde se duerme la noche de esa fecha. Si hay varios, primero el reservado y, entre iguales, la
 * estancia más corta (el ryokan de Nikko "dentro" de las noches del Tavinos).
 */
export function alojamientoDeLaNoche(alojamientos: Alojamiento[], f: Fecha): Alojamiento | undefined {
  const noches = (a: Alojamiento) => diasEntre(a.entrada!, a.salida!);
  return alojamientos
    .filter((a) => a.estado !== 'cancelado' && a.estado !== 'cancelar' && a.entrada && a.salida && a.entrada <= f && f < a.salida)
    .sort((a, b) => PRIORIDAD[a.estado] - PRIORIDAD[b.estado] || noches(a) - noches(b))[0];
}

/**
 * La ciudad de un día: la que tenga escrita o, si no, la del hotel de esa noche (o la de la noche
 * anterior, para el día que se deja el último). Así un viaje nuevo se organiza solo al meter los hoteles.
 */
export function ciudadDelDia(fecha: Fecha, dia: Pick<Dia, 'ciudad'> | undefined, alojamientos: Alojamiento[]): string | undefined {
  if (dia?.ciudad?.trim()) return dia.ciudad;
  return alojamientoDeLaNoche(alojamientos, fecha)?.ciudad ?? alojamientoDeLaNoche(alojamientos, sumarDias(fecha, -1))?.ciudad;
}

export interface HotelesDelDia {
  /** Se llega a este hotel ese día. */
  llegada?: Alojamiento;
  /** Se deja este hotel ese día (y no se duerme en él). */
  salida?: Alojamiento;
  /** Donde se duerme esa noche. */
  noche?: Alojamiento;
}

export function hotelesDelDia(alojamientos: Alojamiento[], f: Fecha): HotelesDelDia {
  const noche = alojamientoDeLaNoche(alojamientos, f);
  const anterior = alojamientoDeLaNoche(alojamientos, sumarDias(f, -1));
  return {
    noche,
    llegada: noche && noche.id !== anterior?.id ? noche : undefined,
    salida: anterior && anterior.id !== noche?.id ? anterior : undefined,
  };
}

/** Lo que se enseña en un día sin plan: "Llegada a…", "Salida de…" o "Noche en…". */
export function textoSinPlan(h: HotelesDelDia): string | undefined {
  if (h.llegada && h.salida) return `${h.salida.nombre} → ${h.llegada.nombre}`;
  if (h.llegada) return `Llegada a ${h.llegada.nombre}`;
  if (h.salida) return `Salida de ${h.salida.nombre}`;
  if (h.noche) return `Noche en ${h.noche.nombre}`;
  return undefined;
}

/** Si el hotel cae fuera de las fechas del viaje, las fechas que lo incluyen (o undefined si ya cabe). */
export function fechasParaIncluir(c: ConfigViaje, a: Pick<Alojamiento, 'entrada' | 'salida'>): Pick<ConfigViaje, 'inicio' | 'fin' | 'vueltaFecha'> | undefined {
  const inicio = a.entrada && a.entrada < c.inicio ? a.entrada : c.inicio;
  const fin = a.salida && a.salida > c.fin ? a.salida : c.fin;
  if (inicio === c.inicio && fin === c.fin) return undefined;
  return { inicio, fin, vueltaFecha: a.salida && a.salida > c.vueltaFecha ? a.salida : c.vueltaFecha };
}

export interface NochesSinHotel {
  /** La ciudad de esos días en El viaje (si la tienen). */
  ciudad?: string;
  /** Primera noche. */
  entrada: Fecha;
  /** Día de salida (la mañana después de la última noche). */
  salida: Fecha;
}

const igual = (a?: string, b?: string) => (a ?? '').trim().toLowerCase() === (b ?? '').trim().toLowerCase();

/**
 * Las noches del viaje que aún no tienen hotel, juntas por ciudad (la escrita en cada día). No cuenta
 * la última (se vuelve a casa) ni los días en la ciudad de salida.
 */
export function nochesSinHotel(c: ConfigViaje, dias: Pick<Dia, 'fecha' | 'ciudad'>[], alojamientos: Alojamiento[]): NochesSinHotel[] {
  const ciudadDe = new Map(dias.map((d) => [d.fecha, d.ciudad?.trim() || undefined]));
  const bloques: NochesSinHotel[] = [];
  for (const f of fechasDelViaje(c).slice(0, -1)) {
    const ciudad = ciudadDe.get(f);
    if (alojamientoDeLaNoche(alojamientos, f) || (ciudad && igual(ciudad, c.salida.ciudad))) continue;
    const ultimo = bloques.at(-1);
    if (ultimo && ultimo.salida === f && igual(ultimo.ciudad, ciudad)) ultimo.salida = sumarDias(f, 1);
    else bloques.push({ ciudad, entrada: f, salida: sumarDias(f, 1) });
  }
  return bloques;
}

/** Las de esa ciudad si la hay (o todas si no se ha escrito ninguna). */
export const nochesParaHotel = (bloques: NochesSinHotel[], ciudad?: string) => (ciudad?.trim() ? bloques.filter((b) => igual(b.ciudad, ciudad)) : bloques);

export function ordenarAlojamientos(alojamientos: Alojamiento[]): Alojamiento[] {
  return [...alojamientos].sort(
    (a, b) => (a.entrada ?? '9').localeCompare(b.entrada ?? '9') || PRIORIDAD[a.estado] - PRIORIDAD[b.estado] || a.nombre.localeCompare(b.nombre),
  );
}

/** Reservas que hay que comprar: primero las que tienen fecha de venta (por fecha), después el resto por fecha de uso. */
export function porComprar(reservas: Reserva[]): Reserva[] {
  return reservas
    .filter((r) => r.estado === 'pendiente')
    .sort((a, b) => {
      if (a.venta && b.venta) return a.venta.getTime() - b.venta.getTime();
      if (a.venta) return -1;
      if (b.venta) return 1;
      return (a.fechaUso ?? '9').localeCompare(b.fechaUso ?? '9');
    });
}

export function ordenarReservas(reservas: Reserva[]): Reserva[] {
  return [...reservas].sort(
    (a, b) => (a.fechaUso ?? '9').localeCompare(b.fechaUso ?? '9') || (a.horaUso ?? '99').localeCompare(b.horaUso ?? '99') || a.titulo.localeCompare(b.titulo),
  );
}

export function delDia<T extends { fechaUso?: Fecha }>(cosas: T[], f: Fecha): T[] {
  return cosas.filter((c) => c.fechaUso === f);
}

export function trayectosDelDia(trayectos: Trayecto[], f: Fecha): Trayecto[] {
  return trayectos
    .filter((t) => t.fecha === f)
    .sort((a, b) => a.orden - b.orden || (a.hora ?? '99').localeCompare(b.hora ?? '99'));
}

export type CuentaAtras =
  | { tipo: 'yaALaVenta' }
  | { tipo: 'pronto'; texto: string; urgente: boolean };

/** "en 3 días", "en 5 h", "en 20 min"; urgente si queda menos de un día. */
export function cuentaAtras(venta: Date, ahora: Date): CuentaAtras {
  const ms = venta.getTime() - ahora.getTime();
  if (ms <= 0) return { tipo: 'yaALaVenta' };
  const min = Math.ceil(ms / 60_000);
  if (min < 60) return { tipo: 'pronto', texto: `en ${min} min`, urgente: true };
  const h = Math.floor(min / 60);
  if (h < 24) return { tipo: 'pronto', texto: `en ${h} h`, urgente: true };
  const d = Math.floor(h / 24);
  return { tipo: 'pronto', texto: d === 1 ? 'mañana' : `en ${d} días`, urgente: false };
}

/** Salida del vuelo de ida (hora de casa). */
export function salida(c: ConfigViaje = CONFIG_POR_DEFECTO): Date {
  return instanteDe(c.inicio, c.horaSalida, c);
}

/**
 * El instante de una hora del viaje. Lo del día de salida (y antes) es hora de casa; el resto, hora
 * del destino. Así la cuenta atrás es exacta aunque el móvil siga en hora española.
 */
export function instanteDe(f: Fecha, hora: string, c: ConfigViaje = CONFIG_POR_DEFECTO): Date {
  return instanteEnZona(f, hora, f <= c.inicio ? c.zonaOrigen : c.zona);
}

export interface Desglose {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
}

export function desglose(ms: number): Desglose {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { dias: Math.floor(s / 86_400), horas: Math.floor((s % 86_400) / 3600), minutos: Math.floor((s % 3600) / 60), segundos: s % 60 };
}

const dos = (n: number) => String(n).padStart(2, '0');

/** "3 d 04 h", "2 h 05 min", "4 min", "menos de 1 min" (sin segundos: no marea). */
export function restante(ms: number): string {
  const d = desglose(ms);
  if (d.dias > 0) return `${d.dias} d ${dos(d.horas)} h`;
  if (d.horas > 0) return `${d.horas} h ${dos(d.minutos)} min`;
  if (d.minutos > 0) return `${d.minutos} min`;
  return 'menos de 1 min';
}

export interface Proximo {
  titulo: string;
  cuando: Date;
  tipo: 'reserva' | 'trayecto';
}

/** Lo siguiente con hora (reservas no descartadas y trayectos), en las próximas 24 horas. */
export function proximoConHora(reservas: Reserva[], trayectos: Trayecto[], ahora: Date, c: ConfigViaje = CONFIG_POR_DEFECTO): Proximo | undefined {
  const candidatos: Proximo[] = [
    ...reservas
      .filter((r) => r.estado !== 'descartada' && r.fechaUso && r.horaUso)
      .map((r) => ({ titulo: r.titulo, cuando: instanteDe(r.fechaUso!, r.horaUso!, c), tipo: 'reserva' as const })),
    ...trayectos.filter((t) => t.hora).map((t) => ({ titulo: t.titulo, cuando: instanteDe(t.fecha, t.hora!, c), tipo: 'trayecto' as const })),
  ];
  const limite = ahora.getTime() + 24 * 3600_000;
  return candidatos
    .filter((c) => c.cuando.getTime() > ahora.getTime() && c.cuando.getTime() <= limite)
    .sort((a, b) => a.cuando.getTime() - b.cuando.getTime())[0];
}

/** Ruta en transporte público en Google Maps. Sin origen, sale de donde esté el móvil. */
export function enlaceGoogleMaps(destino: string, origen?: string): string {
  const q = new URLSearchParams({ api: '1', destination: destino, travelmode: 'transit' });
  if (origen) q.set('origin', origen);
  return `https://www.google.com/maps/dir/?${q}`;
}

/** Un sitio en Google Maps (sin ruta). */
export function enlaceLugar(lugar: string): string {
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query: lugar })}`;
}

/** NAVITIME no tiene enlaces de ruta documentados: se abre su buscador (y la app, si está instalada). */
export const ENLACE_NAVITIME = 'https://japantravel.navitime.com/es/';
