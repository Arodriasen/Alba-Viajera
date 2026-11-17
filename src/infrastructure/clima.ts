import type { AlertaTsunami, DiaTiempo, Pronostico, Terremoto } from '@/domain/clima';
import type { CiudadConfig } from '@/domain/config';

/**
 * Tiempo (Open-Meteo, con el modelo de la JMA) y avisos oficiales (JMA y P2PQuake, que reenvía los
 * boletines de la JMA). Todo gratis, sin clave y con CORS: se consulta desde el móvil.
 * Lo último que llegó se guarda para poder verlo sin conexión.
 */

export interface Dato<T> {
  valor: T;
  /** Cuándo se descargó. */
  cuando: Date;
  /** true = no se ha podido actualizar y es lo último guardado. */
  guardado: boolean;
}

const memoria = new Map<string, { cuando: number; valor: unknown }>();
const enCurso = new Map<string, Promise<unknown>>();

function leerGuardado<T>(clave: string, revivir: (v: unknown) => T): { cuando: number; valor: T } | undefined {
  try {
    const t = localStorage.getItem(`clima:${clave}`);
    if (!t) return undefined;
    const j = JSON.parse(t) as { cuando: number; valor: unknown };
    return { cuando: j.cuando, valor: revivir(j.valor) };
  } catch {
    return undefined;
  }
}

/** Descarga con caché en memoria (`frescura` ms) y copia en el móvil para ir sin conexión. */
async function conCache<T>(clave: string, frescura: number, cargar: () => Promise<T>, revivir: (v: unknown) => T = (v) => v as T): Promise<Dato<T>> {
  const m = memoria.get(clave);
  if (m && Date.now() - m.cuando < frescura) return { valor: m.valor as T, cuando: new Date(m.cuando), guardado: false };
  let p = enCurso.get(clave) as Promise<T> | undefined;
  if (!p) {
    p = cargar().finally(() => enCurso.delete(clave));
    enCurso.set(clave, p);
  }
  try {
    const valor = await p;
    const cuando = Date.now();
    memoria.set(clave, { cuando, valor });
    try {
      localStorage.setItem(`clima:${clave}`, JSON.stringify({ cuando, valor }));
    } catch {
      // Sin espacio: no pasa nada.
    }
    return { valor, cuando: new Date(cuando), guardado: false };
  } catch (e) {
    const g = leerGuardado(clave, revivir);
    if (g) return { valor: g.valor, cuando: new Date(g.cuando), guardado: true };
    throw e;
  }
}

async function json<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Respuesta ${r.status}`);
  return (await r.json()) as T;
}

// ───── Dónde está cada ciudad ─────

export interface Ubicacion {
  nombre: string;
  lat: number;
  lon: number;
  pref?: string;
  /** Oficina de la JMA de su prefectura (p. ej. 130000) y zona (class10). */
  oficina?: string;
  zona?: string;
}

/**
 * Las ciudades sin posición se buscan por el nombre en el país del viaje (Open-Meteo; en Japón, en
 * japonés para tener la prefectura y su oficina de la JMA).
 */
export async function ubicar(c: CiudadConfig, pais = 'JP'): Promise<Ubicacion | undefined> {
  if (c.lat !== undefined && c.lon !== undefined) {
    return { nombre: c.nombre, lat: c.lat, lon: c.lon, pref: c.pref, zona: c.zona, oficina: c.zona ? `${c.zona.slice(0, 2)}0000` : undefined };
  }
  try {
    const d = await conCache(pais === 'JP' ? `ubicacion:${c.nombre}` : `ubicacion:${pais}:${c.nombre}`, 30 * 86_400_000, async () => {
      const j = await json<{ results?: { latitude: number; longitude: number; admin1?: string }[] }>(
        `https://geocoding-api.open-meteo.com/v1/search?${new URLSearchParams({ name: c.nombre, count: '1', language: pais === 'JP' ? 'ja' : 'es', countryCode: pais })}`,
      );
      const r = j.results?.[0];
      if (!r) throw new Error('No encontrada');
      if (pais !== 'JP') return { nombre: c.nombre, lat: r.latitude, lon: r.longitude } as Ubicacion;
      const areas = await json<{ offices: Record<string, { name: string }> }>('https://www.jma.go.jp/bosai/common/const/area.json').catch(() => undefined);
      const oficina = areas && r.admin1 ? Object.entries(areas.offices).find(([, o]) => o.name === r.admin1)?.[0] : undefined;
      return { nombre: c.nombre, lat: r.latitude, lon: r.longitude, pref: r.admin1, oficina } as Ubicacion;
    });
    return d.valor;
  } catch {
    return undefined;
  }
}

// ───── El tiempo ─────

const restarDias = (f: string, n: number) => new Date(Date.parse(`${f}T00:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10);
const restarAnios = (f: string, n: number) => `${Number(f.slice(0, 4)) - n}${f.slice(4)}`.replace('-02-29', '-02-28');

/**
 * Del mismo periodo del viaje dos años atrás (una semana de margen) al del año pasado, sin pasar de
 * hace una semana (el archivo tarda unos días en tener los datos).
 */
export function ventanaTipica(inicio: string, fin: string, hoy = new Date().toISOString().slice(0, 10)): [string, string] {
  const tope = restarDias(hoy, 7);
  let hasta = restarDias(restarAnios(fin, 1), -7);
  if (hasta > tope) hasta = tope;
  let desde = restarDias(restarAnios(inicio, 2), 7);
  if (desde > hasta) desde = restarDias(hasta, 30);
  return [desde, hasta];
}

interface RespuestaOpenMeteo {
  /** Con timezone=auto, la hora local del sitio va así de adelantada respecto a UTC. */
  utc_offset_seconds?: number;
  current?: { temperature_2m: number; apparent_temperature: number; weather_code: number; wind_speed_10m: number; is_day: number };
  hourly?: { time: string[]; temperature_2m: number[]; precipitation_probability: (number | null)[]; weather_code: number[]; is_day: number[] };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max?: (number | null)[];
    snowfall_sum?: (number | null)[];
  };
}

const DIARIO = 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,snowfall_sum';

function aDias(d: RespuestaOpenMeteo['daily']): DiaTiempo[] {
  if (!d) return [];
  return d.time.map((fecha, i) => ({
    fecha,
    codigo: d.weather_code[i],
    maxima: d.temperature_2m_max[i],
    minima: d.temperature_2m_min[i],
    lluvia: d.precipitation_probability_max?.[i] ?? 0,
    nieve: d.snowfall_sum?.[i] ?? 0,
  }));
}

/** Las horas de Open-Meteo vienen en la hora del sitio, sin zona: se les quita su desfase. */
const instanteLocal = (t: string, desfase: number) => new Date(new Date(`${t}:00Z`).getTime() - desfase * 1000);

const revivirPronostico = (v: unknown): Pronostico => {
  const p = v as Pronostico & { actualizado: string; horas: { hora: string }[] };
  return { ...p, actualizado: new Date(p.actualizado), horas: p.horas.map((h) => ({ ...h, hora: new Date(h.hora) })) } as Pronostico;
};

/** Ahora, las próximas 24 horas y 16 días, de un sitio. Se renueva cada 20 minutos. */
export function pronostico(u: Ubicacion): Promise<Dato<Pronostico>> {
  return conCache(
    `pronostico2:${u.lat.toFixed(2)},${u.lon.toFixed(2)}`,
    20 * 60_000,
    async () => {
      const q = new URLSearchParams({
        latitude: String(u.lat),
        longitude: String(u.lon),
        current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day',
        hourly: 'temperature_2m,precipitation_probability,weather_code,is_day',
        daily: DIARIO,
        // La hora del propio sitio: así cada día empieza y acaba donde toca, sea cual sea el país.
        timezone: 'auto',
        forecast_days: '16',
        forecast_hours: '24',
      });
      const j = await json<RespuestaOpenMeteo>(`https://api.open-meteo.com/v1/forecast?${q}`);
      const h = j.hourly!;
      return {
        actualizado: new Date(),
        ahora: {
          temperatura: j.current!.temperature_2m,
          sensacion: j.current!.apparent_temperature,
          codigo: j.current!.weather_code,
          viento: j.current!.wind_speed_10m,
          deDia: j.current!.is_day === 1,
        },
        horas: h.time.map((t, i) => ({
          hora: instanteLocal(t, j.utc_offset_seconds ?? 0),
          deDia: h.is_day?.[i] !== 0,
          temperatura: h.temperature_2m[i],
          lluvia: h.precipitation_probability[i] ?? 0,
          codigo: h.weather_code[i],
        })),
        dias: aDias(j.daily),
      } satisfies Pronostico;
    },
    revivirPronostico,
  );
}

/** Los próximos 16 días de varias ciudades en una sola consulta (para el itinerario). */
export function pronosticoCiudades(us: Ubicacion[]): Promise<Dato<Record<string, DiaTiempo[]>>> {
  const clave = us.map((u) => `${u.nombre}@${u.lat.toFixed(2)},${u.lon.toFixed(2)}`).join('|');
  return conCache(`ciudades:${clave}`, 60 * 60_000, async () => {
    const q = new URLSearchParams({
      latitude: us.map((u) => u.lat).join(','),
      longitude: us.map((u) => u.lon).join(','),
      daily: DIARIO,
      timezone: 'auto',
      forecast_days: '16',
    });
    const j = await json<RespuestaOpenMeteo | RespuestaOpenMeteo[]>(`https://api.open-meteo.com/v1/forecast?${q}`);
    const lista = Array.isArray(j) ? j : [j];
    return Object.fromEntries(us.map((u, i) => [u.nombre, aDias(lista[i]?.daily)]));
  });
}

/**
 * Clima típico para fechas sin previsión aún: media de máximas y mínimas de esos días (±3) en los
 * dos años anteriores a las fechas del viaje, con datos reales (archivo de Open-Meteo). No cambia:
 * se guarda un mes.
 */
export function climaTipico(
  us: Ubicacion[],
  inicio: string,
  fin: string,
): Promise<Dato<Record<string, Record<string, { maxima: number; minima: number }>>>> {
  const clave = us.map((u) => `${u.lat.toFixed(2)},${u.lon.toFixed(2)}`).join('|');
  const [desde, hasta] = ventanaTipica(inicio, fin);
  return conCache(`tipico:${desde}:${hasta}:${clave}`, 30 * 86_400_000, async () => {
    const q = new URLSearchParams({
      latitude: us.map((u) => u.lat).join(','),
      longitude: us.map((u) => u.lon).join(','),
      start_date: desde,
      end_date: hasta,
      daily: 'temperature_2m_max,temperature_2m_min',
      timezone: 'auto',
    });
    const j = await json<RespuestaOpenMeteo | RespuestaOpenMeteo[]>(`https://archive-api.open-meteo.com/v1/archive?${q}`);
    const lista = Array.isArray(j) ? j : [j];
    return Object.fromEntries(
      us.map((u, i) => {
        const d = lista[i]?.daily;
        const porDia: Record<string, { maxima: number; minima: number }> = {};
        if (d) {
          // Para cada día del año (MM-DD), media de los días cercanos de todos los años.
          const claves = new Set(d.time.map((t) => t.slice(5)));
          for (const md of claves) {
            const [m, dd] = md.split('-').map(Number);
            const cerca = d.time
              .map((t, k) => ({ t, k }))
              .filter(({ t }) => {
                const [, tm, td] = t.split('-').map(Number);
                const dif = Math.abs((tm - m) * 31 + (td - dd));
                return dif <= 3;
              });
            const max = cerca.map(({ k }) => d.temperature_2m_max[k]).filter((x) => typeof x === 'number');
            const min = cerca.map(({ k }) => d.temperature_2m_min[k]).filter((x) => typeof x === 'number');
            if (max.length) porDia[md] = { maxima: max.reduce((a, b) => a + b, 0) / max.length, minima: min.reduce((a, b) => a + b, 0) / min.length };
          }
        }
        return [u.nombre, porDia];
      }),
    );
  });
}

// ───── Avisos oficiales ─────

type AreasJma = { code: string; warnings?: { code: string; status: string }[] }[];

/** Avisos meteorológicos (警報・注意報) de una prefectura, por zonas. Cada 5 minutos. */
export function avisosJma(oficina: string): Promise<Dato<{ areas: AreasJma; emitido: string }>> {
  return conCache(`avisos:${oficina}`, 5 * 60_000, async () => {
    const j = await json<{ reportDatetime: string; areaTypes: { areas: AreasJma }[] }>(`https://www.jma.go.jp/bosai/warning/data/warning/${oficina}.json`);
    return { areas: j.areaTypes[0]?.areas ?? [], emitido: j.reportDatetime };
  });
}

interface P2pTerremoto {
  id: string;
  code: 551;
  earthquake: {
    time: string;
    maxScale: number;
    domesticTsunami: string;
    hypocenter: { name: string; magnitude: number; depth: number };
  };
  points?: { pref: string; scale: number }[];
}
interface P2pTsunami {
  code: 552;
  cancelled: boolean;
  issue: { time: string };
  areas?: { grade: string; name: string }[];
}

const TSUNAMI: Record<string, Terremoto['tsunami']> = {
  None: 'ninguno',
  NonEffective: 'sin-riesgo',
  Checking: 'revisando',
  Watch: 'vigilancia',
  Warning: 'aviso',
  Unknown: 'desconocido',
};

/** "2026/11/16 13:28:00" (hora de Japón) → instante. */
const fechaP2p = (t: string) => new Date(`${t.replace(/\//g, '-').replace(' ', 'T')}+09:00`);

const revivirTerremotos = (v: unknown) => (v as (Terremoto & { hora: string })[]).map((t) => ({ ...t, hora: new Date(t.hora) }));

/** Los últimos terremotos con intensidad 1 o más en Japón. Cada 2 minutos. */
export function terremotos(): Promise<Dato<Terremoto[]>> {
  return conCache(
    'terremotos',
    2 * 60_000,
    async () => {
      const j = await json<P2pTerremoto[]>('https://api.p2pquake.net/v2/history?codes=551&limit=30');
      // Cada terremoto puede venir varias veces (primer aviso y detalle): se queda el más completo.
      const porHora = new Map<string, Terremoto>();
      for (const e of j) {
        if (!e.earthquake || e.earthquake.maxScale < 10) continue;
        const prefecturas: Record<string, number> = {};
        for (const p of e.points ?? []) prefecturas[p.pref] = Math.max(prefecturas[p.pref] ?? 0, p.scale);
        const t: Terremoto = {
          id: e.id,
          hora: fechaP2p(e.earthquake.time),
          lugar: e.earthquake.hypocenter?.name || 'Epicentro por confirmar',
          magnitud: e.earthquake.hypocenter?.magnitude > 0 ? e.earthquake.hypocenter.magnitude : undefined,
          profundidad: e.earthquake.hypocenter?.depth > 0 ? e.earthquake.hypocenter.depth : undefined,
          maxima: e.earthquake.maxScale,
          tsunami: TSUNAMI[e.earthquake.domesticTsunami] ?? 'desconocido',
          prefecturas,
        };
        const clave = e.earthquake.time;
        const ya = porHora.get(clave);
        if (!ya || Object.keys(prefecturas).length > Object.keys(ya.prefecturas).length) porHora.set(clave, t);
      }
      return [...porHora.values()].sort((a, b) => b.hora.getTime() - a.hora.getTime()).slice(0, 15);
    },
    revivirTerremotos,
  );
}

/** Avisos de tsunami en vigor (el último boletín, si no está cancelado y es de las últimas 24 h). */
export function tsunamis(): Promise<Dato<AlertaTsunami[]>> {
  return conCache('tsunamis', 2 * 60_000, async () => {
    const [ultimo] = await json<P2pTsunami[]>('https://api.p2pquake.net/v2/history?codes=552&limit=1');
    if (!ultimo || ultimo.cancelled || Date.now() - fechaP2p(ultimo.issue.time).getTime() > 86_400_000) return [];
    const grupos: Record<AlertaTsunami['nivel'], string[]> = { 'aviso-grave': [], aviso: [], vigilancia: [] };
    for (const a of ultimo.areas ?? []) {
      const nivel = a.grade === 'MajorWarning' ? 'aviso-grave' : a.grade === 'Warning' ? 'aviso' : a.grade === 'Watch' ? 'vigilancia' : undefined;
      if (nivel) grupos[nivel].push(a.name);
    }
    return (Object.keys(grupos) as AlertaTsunami['nivel'][]).filter((n) => grupos[n].length).map((nivel) => ({ nivel, zonas: grupos[nivel] }));
  });
}

/** Tifones activos según la JMA (número de ellos). Cada 30 minutos. */
export function tifones(): Promise<Dato<number>> {
  return conCache('tifones', 30 * 60_000, async () => (await json<unknown[]>('https://www.jma.go.jp/bosai/typhoon/data/targetTc.json')).length);
}

export const ENLACES = {
  tifones: 'https://www.jma.go.jp/bosai/map.html#contents=typhoon&lang=en',
  avisos: 'https://www.jma.go.jp/bosai/warning/#lang=en',
  terremotos: 'https://www.jma.go.jp/bosai/map.html#contents=earthquake_map&lang=en',
  safetyTips: 'https://www.jnto.go.jp/safety-tips/eng/app.html',
  refugios: 'https://www.google.com/maps/search/?api=1&query=%E9%81%BF%E9%9B%A3%E6%89%80',
};
