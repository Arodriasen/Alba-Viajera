/**
 * Datos del viaje que se pueden cambiar desde la app (Ajustes del viaje) y se comparten entre los
 * dos móviles. Se guardan como JSON en `ajustes` (id 'viaje'); lo que falte sale de los valores por defecto.
 */

import { leerListas, type Lista } from './listas';
import { IDIOMAS } from './idiomas';
import { apartadosPorDefecto, idiomaDelPais, TODOS_LOS_APARTADOS, zonaValida, type Apartado } from './viajes';

export type Fecha = string;
export type IdParque = 'tdl' | 'tds' | 'usj';

export interface CiudadConfig {
  nombre: string;
  kanji: string;
  color: string;
  /** Dónde está (para el tiempo). Si falta, se busca por el nombre. */
  lat?: number;
  lon?: number;
  /** Prefectura en japonés (para saber si un terremoto se ha notado allí). */
  pref?: string;
  /** Zona de la JMA para sus avisos (class10, p. ej. 130010 = Tokio). */
  zona?: string;
}

export interface ParqueConfig {
  fecha: Fecha;
  /** Lo primero que hay que hacer al entrar. */
  primero: string;
}

export interface InfoVuelo {
  /** "IB 6801" */
  numero: string;
  aerolinea: string;
  terminal: string;
}
export const VUELO_VACIO: InfoVuelo = { numero: '', aerolinea: '', terminal: '' };

export interface ConfigViaje {
  /** "Japón", "Roma"… (la app dice "Alba en …"). */
  destino: string;
  /** País (ISO alfa-2): decide qué apartados se pueden elegir y dónde se buscan las ciudades. */
  pais: string;
  /** Moneda del destino (ISO 4217); los totales van siempre en euros. */
  moneda: string;
  /** Hora del destino (IANA). */
  zona: string;
  /** Hora de casa: la del vuelo de ida (sale del país y la ciudad de salida). */
  zonaOrigen: string;
  /** De dónde se sale (y adonde se vuelve). */
  salida: { pais: string; ciudad: string };
  /** Frases útiles: de vuestro idioma (ISO 639-1) al de allí. */
  idiomaOrigen: string;
  idiomaDestino: string;
  /** Lo grande de la portada (kanji, bandera…). */
  simbolo: string;
  color: string;
  /** Qué partes de la app tiene este viaje. */
  apartados: Apartado[];
  /** Apartados propios: listas con precio (equipaje, compras…). Sus elementos van en su tabla. */
  listas: Lista[];
  /** Día de salida (vuelo de ida, hora de casa). */
  inicio: Fecha;
  /** Día de llegada a casa. */
  fin: Fecha;
  horaSalida: string;
  /** Vuelo de vuelta (hora del destino). */
  vueltaFecha: Fecha;
  horaVuelta: string;
  /** Datos de los vuelos (todo opcional: vacío = no se enseña). */
  vuelos: { ida: InfoVuelo; vuelta: InfoVuelo };
  jrPass: { inicio: Fecha; dias: number };
  parques: Record<IdParque, ParqueConfig>;
  ciudades: CiudadConfig[];
}

export const CONFIG_POR_DEFECTO: ConfigViaje = {
  destino: 'Japón',
  pais: 'JP',
  moneda: 'JPY',
  zona: 'Asia/Tokyo',
  zonaOrigen: 'Europe/Madrid',
  salida: { pais: 'ES', ciudad: 'Madrid' },
  idiomaOrigen: 'es',
  idiomaDestino: 'ja',
  simbolo: '日本',
  color: '#c73e2f',
  apartados: TODOS_LOS_APARTADOS,
  listas: [],
  inicio: '2027-01-11',
  fin: '2027-02-02',
  horaSalida: '20:20',
  vueltaFecha: '2027-02-01',
  horaVuelta: '22:10',
  vuelos: { ida: VUELO_VACIO, vuelta: VUELO_VACIO },
  jrPass: { inicio: '2027-01-22', dias: 7 },
  parques: {
    tdl: {
      fecha: '2027-01-14',
      primero: 'Nada más entrar, desde la app: Standby Pass o DPA de Pooh’s Hunny Hunt y/o La Bella y la Bestia.',
    },
    tds: {
      fecha: '2027-01-20',
      primero: 'Nada más entrar, desde la app: Standby Pass de Fantasy Springs (Frozen o Rapunzel). Se agota rápido.',
    },
    usj: {
      fecha: '2027-01-25',
      primero: 'Nada más entrar, desde la app: Area Timed Entry de Super Nintendo World (gratis). Probad con los dos móviles.',
    },
  },
  ciudades: [
    { nombre: 'Tokio', kanji: '東京', color: '#2d4b73', lat: 35.7148, lon: 139.7967, pref: '東京都', zona: '130010' },
    { nombre: 'Nikko', kanji: '日光', color: '#4f7a4a', lat: 36.75, lon: 139.5986, pref: '栃木県', zona: '090020' },
    { nombre: 'Osaka', kanji: '大阪', color: '#c8641f', lat: 34.6687, lon: 135.5013, pref: '大阪府', zona: '270000' },
    { nombre: 'Kioto', kanji: '京都', color: '#7a4e8c', lat: 34.9858, lon: 135.7588, pref: '京都府', zona: '260010' },
    { nombre: 'Hiroshima', kanji: '広島', color: '#2f7f86', lat: 34.3853, lon: 132.4553, pref: '広島県', zona: '340010' },
    { nombre: 'Nara', kanji: '奈良', color: '#8c6a43', lat: 34.6851, lon: 135.8048, pref: '奈良県', zona: '290010' },
  ],
};

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^\d{2}:\d{2}$/;
const COLOR = /^#[0-9a-f]{6}$/i;
const fecha = (v: unknown, def: Fecha) => (typeof v === 'string' && FECHA.test(v) ? v : def);
const hora = (v: unknown, def: string) => (typeof v === 'string' && HORA.test(v) ? v : def);
const texto = (v: unknown, def: string) => (typeof v === 'string' ? v : def);

const idiomaValido = (v: unknown) => (typeof v === 'string' && IDIOMAS.some((i) => i.codigo === v) ? v : undefined);
function leerSalida(v: unknown): ConfigViaje['salida'] {
  const s = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  const pais = typeof s.pais === 'string' && /^[A-Z]{2}$/.test(s.pais) ? s.pais : 'ES';
  const ciudad = typeof s.ciudad === 'string' && s.ciudad.trim() ? s.ciudad.trim().slice(0, 100) : 'Madrid';
  return { pais, ciudad };
}

/** ¿Tiene este viaje ese apartado? */
export const tiene = (c: ConfigViaje, a: Apartado) => c.apartados.includes(a);

function leerVuelo(v: unknown): InfoVuelo {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  const t = (x: unknown, max: number) => (typeof x === 'string' ? x.trim().slice(0, max) : '');
  return { numero: t(o.numero, 12), aerolinea: t(o.aerolinea, 60), terminal: t(o.terminal, 30) };
}

/** Lee el JSON guardado sin fiarse de él: lo que no valga se cambia por el valor por defecto. */
export function leerConfig(json: string | undefined): ConfigViaje {
  let v: Record<string, unknown> = {};
  try {
    const p = JSON.parse(json ?? '{}');
    if (p && typeof p === 'object') v = p as Record<string, unknown>;
  } catch {
    // JSON roto: valores por defecto.
  }
  const d = CONFIG_POR_DEFECTO;
  const jr = (v.jrPass ?? {}) as Record<string, unknown>;
  const parques = (v.parques ?? {}) as Record<string, Record<string, unknown> | undefined>;
  const ciudades = Array.isArray(v.ciudades)
    ? (v.ciudades as Record<string, unknown>[])
        .filter((c) => c && typeof c.nombre === 'string' && c.nombre.trim())
        .map((c) => {
          const nombre = String(c.nombre).trim();
          // Las ciudades de siempre conservan su posición aunque se guardaran antes de existir este dato.
          const base = d.ciudades.find((x) => x.nombre === nombre);
          const num = (v: unknown, def?: number) => (typeof v === 'number' && Number.isFinite(v) ? v : def);
          const cad = (v: unknown, def?: string) => (typeof v === 'string' && v ? v : def);
          return {
            nombre,
            kanji: texto(c.kanji, '旅').trim() || '旅',
            color: typeof c.color === 'string' && COLOR.test(c.color) ? c.color : '#c73e2f',
            lat: num(c.lat, base?.lat),
            lon: num(c.lon, base?.lon),
            pref: cad(c.pref, base?.pref),
            zona: cad(c.zona, base?.zona),
          };
        })
    : d.ciudades;
  const inicio = fecha(v.inicio, d.inicio);
  const fin = fecha(v.fin, d.fin);
  const dias = typeof jr.dias === 'number' && jr.dias >= 1 && jr.dias <= 30 ? Math.round(jr.dias) : d.jrPass.dias;
  const pais = typeof v.pais === 'string' && /^[A-Z]{2}$/.test(v.pais) ? v.pais : d.pais;
  const zona = (z: unknown, def: string) => (typeof z === 'string' && zonaValida(z) ? z : def);
  return {
    destino: texto(v.destino, d.destino).trim() || d.destino,
    pais,
    moneda: typeof v.moneda === 'string' && /^[A-Z]{3}$/.test(v.moneda) ? v.moneda : d.moneda,
    zona: zona(v.zona, d.zona),
    zonaOrigen: zona(v.zonaOrigen, d.zonaOrigen),
    salida: leerSalida(v.salida),
    idiomaOrigen: idiomaValido(v.idiomaOrigen) ?? 'es',
    idiomaDestino: idiomaValido(v.idiomaDestino) ?? idiomaDelPais(pais),
    simbolo: texto(v.simbolo, d.simbolo).trim().slice(0, 8) || d.simbolo,
    color: typeof v.color === 'string' && COLOR.test(v.color) ? v.color : d.color,
    apartados: Array.isArray(v.apartados)
      ? TODOS_LOS_APARTADOS.filter((a) => (v.apartados as unknown[]).includes(a))
      : 'destino' in v
        ? apartadosPorDefecto(pais)
        : d.apartados,
    listas: leerListas(v.listas),
    inicio,
    fin: fin >= inicio ? fin : inicio,
    horaSalida: hora(v.horaSalida, d.horaSalida),
    vueltaFecha: fecha(v.vueltaFecha, d.vueltaFecha),
    horaVuelta: hora(v.horaVuelta, d.horaVuelta),
    vuelos: { ida: leerVuelo((v.vuelos as Record<string, unknown> | undefined)?.ida), vuelta: leerVuelo((v.vuelos as Record<string, unknown> | undefined)?.vuelta) },
    jrPass: { inicio: fecha(jr.inicio, d.jrPass.inicio), dias },
    parques: Object.fromEntries(
      (Object.keys(d.parques) as IdParque[]).map((id) => [
        id,
        { fecha: fecha(parques[id]?.fecha, d.parques[id].fecha), primero: texto(parques[id]?.primero, d.parques[id].primero) },
      ]),
    ) as Record<IdParque, ParqueConfig>,
    ciudades,
  };
}
