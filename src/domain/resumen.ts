/** El resumen de un viaje ya hecho (TypeScript puro): lo que se enseña en Hoy al volver. */

import { tiene, type ConfigViaje } from './config';
import { resumir, type Gasto, type Presupuesto } from './gastos';
import { parquesDe } from './parques';
import { alojamientoDeLaNoche, ciudadDelDia, diasEntre, fechasDelViaje, type Alojamiento, type Dia, type Fecha, type Reserva, type Trayecto } from './viaje';

export interface CiudadResumen {
  nombre: string;
  noches: number;
  /** Días en los que se estuvo allí (por el día o por el hotel). */
  dias: number;
}

export interface ResumenViaje {
  dias: number;
  noches: number;
  ciudades: CiudadResumen[];
  hoteles: number;
  trayectos: number;
  /** Trayectos marcados como cubiertos por el JR Pass. */
  trayectosJr: number;
  entradas: number;
  parques: string[];
  fotos: { fecha: Fecha; foto: string }[];
  /** En euros; undefined si el viaje no lleva presupuesto. */
  gastado?: number;
  previsto?: number;
  gastos: number;
  /** La categoría en la que más se gastó. */
  masGasto?: { nombre: string; euros: number };
}

export interface DatosResumen {
  config: ConfigViaje;
  dias: Dia[];
  alojamientos: Alojamiento[];
  trayectos: Trayecto[];
  reservas: Reserva[];
  gastos: Gasto[];
  presupuesto: Presupuesto;
}

export function resumenDelViaje(d: DatosResumen): ResumenViaje {
  const { config } = d;
  const fechas = fechasDelViaje(config);
  const porFecha = new Map(d.dias.map((x) => [x.fecha, x]));
  const vivos = d.alojamientos.filter((a) => a.estado !== 'cancelado' && a.estado !== 'cancelar');

  // Ciudades en el orden en que se visitaron: días por la ciudad del día y noches por el hotel.
  const ciudades = new Map<string, CiudadResumen>();
  const de = (nombre: string) => {
    let c = ciudades.get(nombre);
    if (!c) ciudades.set(nombre, (c = { nombre, noches: 0, dias: 0 }));
    return c;
  };
  let noches = 0;
  for (const f of fechas) {
    const ciudad = ciudadDelDia(f, porFecha.get(f), vivos);
    if (ciudad) de(ciudad).dias++;
    const hotel = alojamientoDeLaNoche(vivos, f);
    if (hotel) {
      noches++;
      if (hotel.ciudad) de(hotel.ciudad).noches++;
    }
  }

  const conPresupuesto = tiene(config, 'presupuesto');
  const r = resumir(d.gastos, d.presupuesto);
  const top = [...r.categorias].sort((a, b) => b.gastado - a.gastado)[0];
  const dentro = (f: Fecha) => f >= config.inicio && f <= config.fin;

  return {
    dias: diasEntre(config.inicio, config.fin) + 1,
    noches,
    ciudades: [...ciudades.values()],
    hoteles: vivos.filter((a) => a.entrada && dentro(a.entrada)).length,
    trayectos: d.trayectos.filter((t) => dentro(t.fecha)).length,
    trayectosJr: tiene(config, 'jrpass') ? d.trayectos.filter((t) => t.jrPass && dentro(t.fecha)).length : 0,
    entradas: tiene(config, 'reservas') ? d.reservas.filter((x) => x.estado === 'comprada').length : 0,
    parques: tiene(config, 'parques') ? parquesDe(config).filter((p) => dentro(p.fecha)).map((p) => p.nombre) : [],
    fotos: tiene(config, 'album') ? fechas.flatMap((f) => (porFecha.get(f)?.foto ? [{ fecha: f, foto: porFecha.get(f)!.foto! }] : [])) : [],
    ...(conPresupuesto ? { gastado: r.gastado, previsto: r.previsto } : {}),
    gastos: d.gastos.length,
    masGasto: conPresupuesto && top && top.gastado > 0 ? { nombre: top.categoria.nombre, euros: top.gastado } : undefined,
  };
}
