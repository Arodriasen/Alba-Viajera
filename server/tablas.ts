import { z } from 'zod';

/**
 * Formato de las filas en la sincronización (snake_case, fechas `AAAA-MM-DD`) más `actualizado`
 * y `borrado`. Es el mismo que guarda cada dispositivo en IndexedDB.
 */

const id = z.string().min(1).max(100);
const texto = (max: number) => z.string().max(max);
const opcional = <T extends z.ZodType>(t: T) => t.nullable().optional().transform((v) => v ?? null);
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const hora = z.string().regex(/^\d{2}:\d{2}$/);
/** Instante ISO completo (toISOString). */
const instante = z.string().regex(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/);
const comun = {
  actualizado: z.number().int().nonnegative(),
  borrado: z.union([z.boolean(), z.literal(0), z.literal(1)]).optional().transform((b) => (b ? 1 : 0)),
};

/** Una fila borrada solo necesita su id: el resto de columnas se rellenan vacías. */
const borrada = z.object({ id, actualizado: comun.actualizado, borrado: z.union([z.literal(true), z.literal(1)]) });

/**
 * Un día de un viaje. El id es la fecha, con el viaje delante salvo en el primero (`v123abc:2027-05-01`;
 * ver src/domain/viajes.ts).
 */
export const FilaDia = z.object({
  id: z.string().regex(/^([a-z0-9]{1,20}:)?\d{4}-\d{2}-\d{2}$/),
  titulo: texto(200),
  ciudad: opcional(texto(100)),
  /** Una cosa por línea. */
  plan: opcional(texto(10_000)),
  notas: opcional(texto(10_000)),
  /** Nombre de la foto del día (tabla fotos). */
  foto: opcional(texto(100)),
  /** Último tren de vuelta al hotel ("HH:MM"). */
  ultimo_tren: opcional(texto(5)),
  ...comun,
});

export const FilaAlojamiento = z.object({
  id,
  nombre: texto(200).min(1),
  ciudad: opcional(texto(100)),
  entrada: opcional(fecha),
  salida: opcional(fecha),
  direccion: opcional(texto(500)),
  direccion_ja: opcional(texto(500)),
  checkin: opcional(hora),
  checkout: opcional(hora),
  estado: z.enum(['reservado', 'pendiente', 'cancelar', 'cancelado']),
  notas: opcional(texto(10_000)),
  enlace: opcional(texto(2000)),
  ...comun,
});

export const FilaReserva = z.object({
  id,
  titulo: texto(200).min(1),
  fecha_uso: opcional(fecha),
  hora_uso: opcional(hora),
  /** Cuándo se pone a la venta (instante exacto; cada móvil lo enseña en su hora). */
  venta: opcional(instante),
  estado: z.enum(['pendiente', 'comprada', 'descartada']),
  enlace: opcional(texto(2000)),
  notas: opcional(texto(10_000)),
  ...comun,
});

export const FilaTrayecto = z.object({
  id,
  fecha: fecha,
  hora: opcional(hora),
  titulo: texto(200).min(1),
  origen: opcional(texto(300)),
  destino: opcional(texto(300)),
  /** Un paso por línea. */
  pasos: opcional(texto(10_000)),
  duracion: opcional(texto(50)),
  /** 1 = lo cubre el JR Pass, 0 = no, null = sin decir. */
  jr_pass: opcional(z.union([z.literal(0), z.literal(1)])),
  notas: opcional(texto(10_000)),
  orden: z.number().int(),
  ...comun,
});

const bandera = z.union([z.literal(0), z.literal(1)]);

/** Una atracción, show o zona de un parque (tdl, tds, usj). */
export const FilaAtraccion = z.object({
  id,
  parque: z.enum(['tdl', 'tds', 'usj']),
  nombre: texto(200).min(1),
  zona: opcional(texto(100)),
  tipo: z.enum(['atraccion', 'show', 'zona']),
  /** Altura mínima en cm; null = sin altura mínima. */
  altura_min: opcional(z.number().int().min(50).max(200)),
  cerrada: bandera,
  imprescindible: bandera,
  unica: bandera,
  notas: opcional(texto(2000)),
  hecha: bandera,
  orden: z.number().int(),
  ...comun,
});

/** Un gasto real. `euros` = lo que costó en euros con el cambio de ese momento. */
export const FilaGasto = z.object({
  id,
  concepto: texto(300).min(1),
  /** Id de una categoría del presupuesto del viaje (las hay de serie y añadidas). */
  categoria: texto(60).min(1),
  importe: z.number().nonnegative().max(100_000_000),
  /** ISO 4217. */
  moneda: z.string().regex(/^[A-Z]{3}$/),
  euros: z.number().nonnegative().max(1_000_000),
  fecha: fecha,
  tax_free: bandera,
  notas: opcional(texto(2000)),
  /** Foto del ticket (tabla fotos). */
  foto: opcional(texto(100)),
  ...comun,
});

/** Un elemento de una lista propia del viaje (`lista` = id de la lista en los ajustes del viaje). */
export const FilaElemento = z.object({
  id,
  lista: texto(100).min(1),
  nombre: texto(300).min(1),
  hecho: bandera,
  notas: opcional(texto(5000)),
  precio_min: opcional(z.number().nonnegative().max(100_000_000)),
  precio_max: opcional(z.number().nonnegative().max(100_000_000)),
  moneda: opcional(z.string().regex(/^[A-Z]{3}$/)),
  tienda: opcional(texto(300)),
  ciudad: opcional(texto(100)),
  /** Id del gasto apuntado al comprarlo. */
  gasto: opcional(texto(100)),
  orden: z.number().int(),
  ...comun,
});

export const FilaAjuste = z.object({
  id,
  valor: texto(20_000),
  ...comun,
});

export const TABLAS = {
  dias: FilaDia,
  alojamientos: FilaAlojamiento,
  reservas: FilaReserva,
  trayectos: FilaTrayecto,
  atracciones: FilaAtraccion,
  gastos: FilaGasto,
  ajustes: FilaAjuste,
  elementos: FilaElemento,
} as const;

export type NombreTabla = keyof typeof TABLAS;
export const NOMBRES_TABLAS = Object.keys(TABLAS) as NombreTabla[];

export type Fila = Record<string, string | number | null>;

/** Columnas de datos de cada tabla (sin id ni las de sincronización), en el orden del esquema. */
export const COLUMNAS: Record<NombreTabla, string[]> = Object.fromEntries(
  NOMBRES_TABLAS.map((t) => [t, Object.keys(TABLAS[t].shape).filter((c) => !['id', 'actualizado', 'borrado'].includes(c))]),
) as Record<NombreTabla, string[]>;

/** Lo que se guarda en las columnas NOT NULL de una fila borrada. */
const VACIAS: Record<string, string | number> = {
  titulo: '',
  nombre: '',
  estado: 'pendiente',
  fecha: '2000-01-01',
  orden: 0,
  valor: '',
  parque: 'tdl',
  tipo: 'atraccion',
  cerrada: 0,
  imprescindible: 0,
  unica: 0,
  hecha: 0,
  concepto: '',
  categoria: 'otros',
  importe: 0,
  moneda: 'EUR',
  euros: 0,
  tax_free: 0,
  lista: '',
  hecho: 0,
};

/**
 * Valida una fila recibida. Las borradas pueden venir solo con id + actualizado; sus datos se
 * vacían (no hace falta guardar lo que ya no existe).
 */
export function validarFila(tabla: NombreTabla, entrada: unknown): Fila {
  const marca = borrada.safeParse(entrada);
  if (marca.success) {
    const vacia = Object.fromEntries(COLUMNAS[tabla].map((c) => [c, c in VACIAS ? VACIAS[c] : null]));
    if (tabla === 'alojamientos') vacia.estado = 'cancelado';
    return { ...vacia, id: marca.data.id, actualizado: marca.data.actualizado, borrado: 1 };
  }
  return TABLAS[tabla].parse(entrada) as Fila;
}
