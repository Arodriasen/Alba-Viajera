import type { EntidadEnVivo, EstadoVivo, Horario, IdParque, ParqueEnVivo } from '@/domain/parques';

/**
 * Datos en directo de ThemeParks.wiki (gratis, sin clave, con CORS): recoge lo que publican las apps
 * oficiales de Tokyo Disney Resort y USJ. Estado de cada atracción, esperas, funciones y horarios.
 */
const API = 'https://api.themeparks.wiki/v1/entity';
const IDS: Record<IdParque, string> = {
  tdl: '3cc919f1-d16d-43e0-8c3f-1dd269bd1a42',
  tds: '67b290d5-3478-4f23-b601-2f8fb71ba803',
  usj: '47f61fac-7586-41ac-ae80-61c9257cf33e',
};

interface LiveApi {
  liveData: {
    name: string;
    entityType: string;
    status?: string;
    queue?: { STANDBY?: { waitTime?: number | null } };
    showtimes?: { startTime?: string | null }[];
  }[];
}
interface ScheduleApi {
  schedule: { date: string; type: string; openingTime: string; closingTime: string }[];
}

const ESTADOS: Record<string, EstadoVivo> = { OPERATING: 'abierta', CLOSED: 'cerrada', DOWN: 'parada', REFURBISHMENT: 'obras' };

/** Fecha de hoy en Japón ('AAAA-MM-DD'), esté donde esté el móvil. */
export function hoyEnJapon(ahora = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(ahora);
}

function horarioDe(s: ScheduleApi | undefined, fecha: string): Horario | undefined {
  const d = s?.schedule.find((x) => x.date === fecha && x.type === 'OPERATING');
  return d ? { abre: new Date(d.openingTime), cierra: new Date(d.closingTime) } : undefined;
}

async function leer<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`ThemeParks.wiki respondió ${r.status}`);
  return (await r.json()) as T;
}

const cache = new Map<string, { cuando: number; datos: ParqueEnVivo }>();

/** `fechaVisita` = día de nuestra visita, para su horario. Se guarda 50 s en memoria. */
export async function parqueEnVivo(id: IdParque, fechaVisita: string): Promise<ParqueEnVivo> {
  const ya = cache.get(id);
  if (ya && Date.now() - ya.cuando < 50_000) return ya.datos;

  const ahora = new Date();
  const hoy = hoyEnJapon(ahora);
  const [anio, mes] = fechaVisita.split('-');
  const [vivo, horarioHoy, horarioVisita] = await Promise.all([
    leer<LiveApi>(`${API}/${IDS[id]}/live`),
    leer<ScheduleApi>(`${API}/${IDS[id]}/schedule`).catch(() => undefined),
    leer<ScheduleApi>(`${API}/${IDS[id]}/schedule/${anio}/${mes}`).catch(() => undefined),
  ]);

  const entidades: EntidadEnVivo[] = vivo.liveData
    .filter((e) => e.entityType === 'ATTRACTION' || e.entityType === 'SHOW')
    .map((e) => ({
      nombre: e.name,
      tipo: e.entityType === 'SHOW' ? 'show' : 'atraccion',
      estado: ESTADOS[e.status ?? ''] ?? 'cerrada',
      espera: typeof e.queue?.STANDBY?.waitTime === 'number' ? e.queue.STANDBY.waitTime : undefined,
      funciones: (e.showtimes ?? [])
        .map((s) => (s.startTime ? new Date(s.startTime) : undefined))
        .filter((d): d is Date => !!d && d.getTime() > ahora.getTime())
        .sort((a, b) => a.getTime() - b.getTime()),
    }));

  const datos: ParqueEnVivo = {
    actualizado: ahora,
    hoy: horarioDe(horarioHoy, hoy),
    diaVisita: horarioDe(horarioVisita, fechaVisita),
    entidades,
  };
  cache.set(id, { cuando: Date.now(), datos });
  guardar(id, datos);
  return datos;
}

// ───── Último dato guardado en el móvil (para verlo sin conexión) ─────

const clave = (id: IdParque) => `parque-vivo-${id}`;

function guardar(id: IdParque, d: ParqueEnVivo) {
  try {
    localStorage.setItem(clave(id), JSON.stringify(d));
  } catch {
    // Sin espacio o almacenamiento bloqueado: no pasa nada, solo no habrá copia.
  }
}

const aHorario = (h?: { abre: string; cierra: string }): Horario | undefined => (h ? { abre: new Date(h.abre), cierra: new Date(h.cierra) } : undefined);

export function ultimoGuardado(id: IdParque): ParqueEnVivo | undefined {
  try {
    const t = localStorage.getItem(clave(id));
    if (!t) return undefined;
    const j = JSON.parse(t);
    return {
      actualizado: new Date(j.actualizado),
      hoy: aHorario(j.hoy),
      diaVisita: aHorario(j.diaVisita),
      entidades: (j.entidades ?? []).map((e: EntidadEnVivo & { funciones: string[] }) => ({ ...e, funciones: e.funciones.map((f) => new Date(f)) })),
    };
  } catch {
    return undefined;
  }
}
