/**
 * Exportar un viaje a hojas de cálculo (TypeScript puro: qué hojas, columnas y filas). El paso a .xlsx va
 * en infraestructura. Solo salen los apartados que tiene el viaje.
 */

import { tiene, type ConfigViaje } from './config';
import { resumir, type Gasto, type Presupuesto } from './gastos';
import type { Elemento } from './listas';
import { tituloDelViaje } from './viajes';
import { alojamientoDeLaNoche, diasEntre, fechasDelViaje, type Alojamiento, type Dia, type Fecha, type Reserva, type Trayecto } from './viaje';

export type TipoColumna = 'texto' | 'numero' | 'euros' | 'fecha' | 'largo';
export interface Columna {
  titulo: string;
  tipo: TipoColumna;
  /** Ancho en caracteres. */
  ancho: number;
}
/** Una celda: texto, número o fecha (AAAA-MM-DD en columnas de tipo fecha); null = vacía. */
export type Celda = string | number | null;
export interface Hoja {
  nombre: string;
  columnas: Columna[];
  filas: Celda[][];
  /** Última fila en negrita (totales). */
  conTotal?: boolean;
}

export interface DatosViaje {
  config: ConfigViaje;
  dias: Dia[];
  alojamientos: Alojamiento[];
  trayectos: Trayecto[];
  reservas: Reserva[];
  gastos: Gasto[];
  presupuesto: Presupuesto;
  elementos: Elemento[];
}

const c = (titulo: string, tipo: TipoColumna = 'texto', ancho = 16): Columna => ({ titulo, tipo, ancho });
const v = (t: string | undefined | null) => (t && t.trim() ? t.trim() : null);
const siNo = (b: boolean | undefined) => (b === undefined ? null : b ? 'Sí' : 'No');

const ESTADO_HOTEL: Record<Alojamiento['estado'], string> = { reservado: 'Reservado', pendiente: 'Por decidir', cancelar: 'Cancelar', cancelado: 'Cancelado' };
const ESTADO_RESERVA: Record<Reserva['estado'], string> = { pendiente: 'Pendiente', comprada: 'Comprada', descartada: 'Descartada' };

/** Excel no admite en el nombre de una hoja : \ / ? * [ ] ni más de 31 caracteres; y no pueden repetirse. */
export function nombreDeHoja(nombre: string, usados: Set<string>): string {
  const base = (nombre.replace(/[:\\/?*[\]]/g, ' ').replace(/\s+/g, ' ').trim() || 'Hoja').slice(0, 31);
  let n = base;
  for (let i = 2; usados.has(n.toLowerCase()); i++) n = `${base.slice(0, 31 - String(i).length - 1)} ${i}`;
  usados.add(n.toLowerCase());
  return n;
}

export function hojasDelViaje(d: DatosViaje): Hoja[] {
  const { config } = d;
  const hojas: Hoja[] = [];
  const nombreCategoria = new Map(d.presupuesto.categorias.map((x) => [x.id, x.nombre]));
  const conPresupuesto = tiene(config, 'presupuesto');
  const r = resumir(d.gastos, d.presupuesto);

  // Resumen
  const resumen: Celda[][] = [
    ['Viaje', tituloDelViaje(config.destino)],
    ['Salida', textoFecha(config.inicio)],
    ['Vuelta a casa', textoFecha(config.fin)],
    ['Días', diasEntre(config.inicio, config.fin) + 1],
    ['Hoteles', d.alojamientos.filter((a) => a.estado !== 'cancelado').length],
    ['Ciudades', config.ciudades.map((x) => x.nombre).join(', ') || null],
  ];
  for (const [tramo, titulo, fecha, hora] of [
    ['ida', 'Vuelo de ida', config.inicio, config.horaSalida],
    ['vuelta', 'Vuelo de vuelta', config.vueltaFecha, config.horaVuelta],
  ] as const) {
    const x = config.vuelos[tramo];
    resumen.push([titulo, [`${textoFecha(fecha)} ${hora}`, x.numero.toUpperCase(), x.aerolinea, x.terminal].filter(Boolean).join(' · ')]);
  }
  if (conPresupuesto) resumen.push(['Previsto (€)', round2(r.previsto)], ['Gastado (€)', round2(r.gastado)], ['Queda (€)', round2(r.queda)]);
  // Columna de valores mixta (texto y cifras): las fechas van ya escritas.
  hojas.push({ nombre: 'Resumen', columnas: [c('', 'texto', 18), c('', 'texto', 40)], filas: resumen });

  // Itinerario: todos los días del viaje, aunque no tengan plan.
  const porFecha = new Map(d.dias.map((x) => [x.fecha, x]));
  const fechas = [...new Set([...fechasDelViaje(config), ...d.dias.map((x) => x.fecha)])].sort();
  hojas.push({
    nombre: 'Itinerario',
    columnas: [c('Día', 'fecha', 12), c('Ciudad', 'texto', 14), c('Título', 'texto', 30), c('Plan', 'largo', 60), c('Hotel esa noche', 'texto', 28), c('Notas', 'largo', 40)],
    filas: fechas.map((f) => {
      const dia = porFecha.get(f);
      return [f, v(dia?.ciudad), v(dia?.titulo), dia?.plan.length ? dia.plan.join('\n') : null, alojamientoDeLaNoche(d.alojamientos, f)?.nombre ?? null, v(dia?.notas)];
    }),
  });

  hojas.push({
    nombre: 'Hoteles',
    columnas: [
      c('Nombre', 'texto', 30),
      c('Ciudad', 'texto', 14),
      c('Entrada', 'fecha', 12),
      c('Salida', 'fecha', 12),
      c('Noches', 'numero', 8),
      c('Check-in', 'texto', 9),
      c('Check-out', 'texto', 9),
      c('Estado', 'texto', 12),
      c('Dirección', 'largo', 36),
      c('Dirección (local)', 'largo', 30),
      c('Enlace', 'texto', 30),
      c('Notas', 'largo', 36),
    ],
    filas: [...d.alojamientos]
      .sort((a, b) => (a.entrada ?? '9').localeCompare(b.entrada ?? '9'))
      .map((a) => [
        a.nombre,
        v(a.ciudad),
        a.entrada ?? null,
        a.salida ?? null,
        a.entrada && a.salida ? diasEntre(a.entrada, a.salida) : null,
        v(a.checkin),
        v(a.checkout),
        ESTADO_HOTEL[a.estado],
        v(a.direccion),
        v(a.direccionJa),
        v(a.enlace),
        v(a.notas),
      ]),
  });

  if (d.trayectos.length) {
    hojas.push({
      nombre: 'Trayectos',
      columnas: [c('Día', 'fecha', 12), c('Hora', 'texto', 7), c('Trayecto', 'texto', 28), c('Desde', 'texto', 20), c('Hasta', 'texto', 20), c('Pasos', 'largo', 50), c('Duración', 'texto', 10), ...(tiene(config, 'jrpass') ? [c('JR Pass', 'texto', 8)] : []), c('Notas', 'largo', 36)],
      filas: [...d.trayectos]
        .sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.hora ?? '').localeCompare(b.hora ?? '') || a.orden - b.orden)
        .map((t) => [
          t.fecha,
          v(t.hora),
          t.titulo,
          v(t.origen),
          v(t.destino),
          t.pasos.length ? t.pasos.join('\n') : null,
          v(t.duracion),
          ...(tiene(config, 'jrpass') ? [siNo(t.jrPass)] : []),
          v(t.notas),
        ]),
    });
  }

  if (tiene(config, 'reservas')) {
    hojas.push({
      nombre: 'Reservas',
      columnas: [c('Reserva', 'texto', 32), c('Día', 'fecha', 12), c('Hora', 'texto', 7), c('Estado', 'texto', 12), c('Sale a la venta', 'texto', 17), c('Enlace', 'texto', 30), c('Notas', 'largo', 40)],
      filas: [...d.reservas]
        .sort((a, b) => (a.fechaUso ?? '9').localeCompare(b.fechaUso ?? '9') || a.titulo.localeCompare(b.titulo))
        .map((x) => [x.titulo, x.fechaUso ?? null, v(x.horaUso), ESTADO_RESERVA[x.estado], x.venta ? textoFechaHora(x.venta) : null, v(x.enlace), v(x.notas)]),
    });
  }

  if (conPresupuesto) {
    hojas.push({
      nombre: 'Gastos',
      columnas: [c('Día', 'fecha', 12), c('Concepto', 'texto', 32), c('Categoría', 'texto', 18), c('Importe', 'numero', 11), c('Moneda', 'texto', 8), c('Euros', 'euros', 11), ...(tiene(config, 'taxfree') ? [c('Tax Free', 'texto', 8)] : []), c('Ticket', 'texto', 7), c('Notas', 'largo', 36)],
      filas: [...d.gastos]
        .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.concepto.localeCompare(b.concepto))
        .map((g) => [
          g.fecha,
          g.concepto,
          nombreCategoria.get(g.categoria) ?? 'Sin categoría',
          g.importe,
          g.moneda,
          Math.round(g.euros * 100) / 100,
          ...(tiene(config, 'taxfree') ? [g.taxFree ? 'Sí' : null] : []),
          g.foto ? 'Sí' : null,
          v(g.notas),
        ]),
    });
    hojas.push({
      nombre: 'Presupuesto',
      columnas: [c('Categoría', 'texto', 24), c('Previsto', 'euros', 12), c('Gastado', 'euros', 12), c('Diferencia', 'euros', 12), c('Gastos', 'numero', 8)],
      filas: [
        ...r.categorias.map((x) => [x.categoria.nombre, x.previsto, round2(x.gastado), round2(x.previsto - x.gastado), x.gastos.length]),
        ['Total', r.previsto, round2(r.gastado), round2(r.queda), d.gastos.length],
      ],
      conTotal: true,
    });
  }

  for (const lista of config.listas) {
    const suyos = d.elementos.filter((e) => e.lista === lista.id).sort((a, b) => a.orden - b.orden);
    hojas.push({
      nombre: lista.nombre,
      columnas: [c('Qué', 'texto', 30), c('Hecho', 'texto', 7), c('Precio mín.', 'numero', 11), c('Precio máx.', 'numero', 11), c('Moneda', 'texto', 8), c('Tienda', 'texto', 20), c('Ciudad', 'texto', 14), c('Notas', 'largo', 36)],
      filas: suyos.map((e) => [e.nombre, e.hecho ? 'Sí' : 'No', e.precioMin ?? null, e.precioMax ?? null, e.precioMin !== undefined || e.precioMax !== undefined ? (e.moneda ?? config.moneda) : null, v(e.tienda), v(e.ciudad), v(e.notas)]),
    });
  }

  const usados = new Set<string>();
  return hojas.map((h) => ({ ...h, nombre: nombreDeHoja(h.nombre, usados) }));
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const dos = (n: number) => String(n).padStart(2, '0');
/** "11/01/2027" */
function textoFecha(f: Fecha): string {
  const [y, m, d] = f.split('-');
  return `${d}/${m}/${y}`;
}
function textoFechaHora(d: Date): string {
  return `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()} ${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

/** "alba-en-japon-2026-11-17.xlsx" */
export function nombreDeArchivo(destino: string, hoy: Fecha): string {
  const base = tituloDelViaje(destino)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base || 'viaje'}-${hoy}.xlsx`;
}

/** Fecha AAAA-MM-DD → Date a medianoche UTC (Excel guarda fechas sin zona). */
export function fechaParaExcel(f: string): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(f);
  return m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : undefined;
}
