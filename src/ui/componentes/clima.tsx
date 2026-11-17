import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { avisosActivos, consejoDelDia, describirTiempo, nosAfecta, shindo, type IconoTiempo, type Pronostico } from '@/domain/clima';
import { avisosJma, climaTipico, pronostico, pronosticoCiudades, terremotos, tifones, tsunamis, ubicar, type Dato, type Ubicacion } from '@/infrastructure/clima';

import { useAlba } from '../AlbaViajera';
import { ciudad } from '../ciudades';
import { Icono, type NombreIcono } from './Icono';

export const iconoTiempo = (i: IconoTiempo) => `t_${i}` as NombreIcono;
export const grados = (n: number) => `${Math.round(n)}°`;

/**
 * Carga un dato de internet y lo refresca cada `cada` ms mientras la pantalla está a la vista.
 * Si falla y no hay nada guardado, `error`.
 */
export function useDato<T>(cargar: (() => Promise<Dato<T>>) | undefined, deps: unknown[], cada = 5 * 60_000) {
  const [estado, setEstado] = useState<{ dato?: Dato<T>; error?: boolean }>({});
  useEffect(() => {
    if (!cargar) return;
    let vigente = true;
    const ir = () => {
      if (document.visibilityState !== 'visible') return;
      cargar().then(
        (dato) => vigente && setEstado({ dato }),
        () => vigente && setEstado((s) => ({ ...s, error: true })),
      );
    };
    ir();
    const t = setInterval(ir, cada);
    document.addEventListener('visibilitychange', ir);
    return () => {
      vigente = false;
      clearInterval(t);
      document.removeEventListener('visibilitychange', ir);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return estado;
}

/** La posición de una ciudad del viaje (por su nombre). */
export function useUbicacion(nombre: string | undefined): Ubicacion | undefined {
  const { config } = useAlba();
  const c = ciudad(nombre || config.ciudades[0]?.nombre || config.destino, config.ciudades);
  const [u, setU] = useState<Ubicacion>();
  useEffect(() => {
    let vigente = true;
    void ubicar(c, config.pais).then((x) => vigente && setU(x));
    return () => {
      vigente = false;
    };
  }, [c.nombre, c.lat, c.lon, config.pais]);
  return u;
}

export function usePronostico(u: Ubicacion | undefined) {
  return useDato<Pronostico>(u ? () => pronostico(u) : undefined, [u?.lat, u?.lon], 20 * 60_000);
}

/** "nublado 8° · 11°/3°" en la portada. Toca para ver el detalle. */
export function ChipTiempo({ ciudad: nombre, texto }: { ciudad?: string; texto?: string }) {
  const u = useUbicacion(nombre);
  const { dato } = usePronostico(u);
  if (!u || !dato) return null;
  const p = dato.valor;
  const hoy = p.dias[0];
  const d = describirTiempo(p.ahora.codigo, p.ahora.deDia);
  return (
    <Link to={`/tiempo?ciudad=${encodeURIComponent(u.nombre)}`} className="chip-tiempo">
      <Icono nombre={iconoTiempo(d.icono)} tamano={18} />
      <span>
        {texto && `${texto} `}
        <span className="negrita">{grados(p.ahora.temperatura)}</span>
        {!texto && ` ${d.texto.toLowerCase()}`}
        {hoy && ` · ${grados(hoy.maxima)}/${grados(hoy.minima)}`}
      </span>
    </Link>
  );
}

/** Aviso corto si va a llover o nevar en las próximas horas. */
export function ConsejoTiempo({ ciudad: nombre }: { ciudad?: string }) {
  const { config } = useAlba();
  const u = useUbicacion(nombre);
  const { dato } = usePronostico(u);
  const consejo = dato && consejoDelDia(dato.valor.horas, new Date(), config.zona);
  if (!consejo) return null;
  return (
    <Link to={`/tiempo?ciudad=${encodeURIComponent(u!.nombre)}`} className="aviso ai">
      <Icono nombre={iconoTiempo(describirTiempo(dato.valor.horas.find((h) => h.lluvia >= 50)?.codigo ?? 61).icono)} tamano={20} />
      <span>{consejo}</span>
    </Link>
  );
}

/**
 * Franja en Hoy solo si hay algo que importe: avisos de la JMA en vuestra zona, tsunami, tifón o un
 * terremoto notado (≥ 3) en vuestra prefectura en las últimas 6 horas. Si no hay nada, no se ve.
 */
export function FranjaAvisos({ ciudad: nombre }: { ciudad?: string }) {
  const u = useUbicacion(nombre);
  const meteo = useDato(u?.oficina ? () => avisosJma(u.oficina!) : undefined, [u?.oficina], 5 * 60_000);
  const sismos = useDato(terremotos, [], 2 * 60_000);
  const olas = useDato(tsunamis, [], 2 * 60_000);
  const tif = useDato(tifones, [], 30 * 60_000);

  const avisos = meteo.dato ? avisosActivos(meteo.dato.valor.areas, u?.zona) : [];
  const graves = avisos.filter((a) => a.nivel !== 'precaucion');
  const reciente = sismos.dato?.valor.find((t) => Date.now() - t.hora.getTime() < 6 * 3600_000 && u?.pref && nosAfecta(t, [u.pref]));
  const tsunami = olas.dato?.valor ?? [];
  const nTifones = tif.dato?.valor ?? 0;

  const lineas: { clase: string; icono: NombreIcono; texto: string }[] = [];
  if (tsunami.length) lineas.push({ clase: 'grave', icono: 'tsunami', texto: 'Aviso de tsunami en vigor: alejaos de la costa' });
  if (reciente) lineas.push({ clase: 'grave', icono: 'terremoto', texto: `Terremoto de intensidad ${shindo(reciente.prefecturas[u!.pref!] ?? reciente.maxima)} en vuestra zona` });
  if (graves.length) lineas.push({ clase: graves.some((a) => a.nivel === 'emergencia') ? 'grave' : 'medio', icono: 'aviso', texto: `Aviso: ${graves.map((a) => a.nombre.toLowerCase()).join(', ')}` });
  else if (avisos.length) lineas.push({ clase: 'leve', icono: 'aviso', texto: `Precaución: ${avisos.map((a) => a.nombre.toLowerCase()).join(', ')}` });
  if (nTifones) lineas.push({ clase: 'medio', icono: 'viento', texto: nTifones === 1 ? 'Hay un tifón activo cerca de Japón' : `Hay ${nTifones} tifones activos cerca de Japón` });
  if (!lineas.length) return null;

  return (
    <Link to={`/avisos?ciudad=${encodeURIComponent(u?.nombre ?? '')}`} className={`franja-avisos ${lineas[0].clase}`}>
      {lineas.map((l) => (
        <span key={l.texto} className="linea-aviso">
          <Icono nombre={l.icono} tamano={18} />
          {l.texto}
        </span>
      ))}
      <span className="muy-pequeno">Toca para ver qué hacer</span>
    </Link>
  );
}

export interface TiempoDia {
  icono?: IconoTiempo;
  maxima: number;
  minima: number;
  /** true = sin previsión todavía: media de esos días en los dos últimos inviernos. */
  tipico: boolean;
}

/** El tiempo de cada día del itinerario en su ciudad: previsión (16 días) o, si no, lo típico. */
export function useTiempoItinerario(): (fecha: string, nombreCiudad?: string) => TiempoDia | undefined {
  const { config } = useAlba();
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>();
  const claves = config.pais + config.ciudades.map((c) => `${c.nombre}:${c.lat}:${c.lon}`).join('|');
  useEffect(() => {
    let vigente = true;
    void Promise.all(config.ciudades.map((c) => ubicar(c, config.pais))).then((us) => vigente && setUbicaciones(us.filter((x): x is Ubicacion => !!x)));
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claves]);
  const prev = useDato(ubicaciones?.length ? () => pronosticoCiudades(ubicaciones) : undefined, [ubicaciones], 60 * 60_000);
  const tipico = useDato(
    ubicaciones?.length ? () => climaTipico(ubicaciones, config.inicio, config.fin) : undefined,
    [ubicaciones, config.inicio, config.fin],
    24 * 3600_000,
  );

  return (fecha, nombreCiudad) => {
    const nombre = ciudad(nombreCiudad || config.ciudades[0]?.nombre, config.ciudades).nombre;
    const dia = prev.dato?.valor[nombre]?.find((d) => d.fecha === fecha);
    if (dia) return { icono: describirTiempo(dia.codigo).icono, maxima: dia.maxima, minima: dia.minima, tipico: false };
    const t = tipico.dato?.valor[nombre]?.[fecha.slice(5)];
    return t ? { maxima: t.maxima, minima: t.minima, tipico: true } : undefined;
  };
}

/** "☁ 11°/3°" en cada día del itinerario ("~11°/3°" si es lo típico). */
export function MiniTiempo({ t }: { t: TiempoDia | undefined }) {
  if (!t) return null;
  return (
    <span className={`mini-tiempo ${t.tipico ? 'tipico' : ''}`} title={t.tipico ? 'Lo típico esos días (aún sin previsión)' : 'Previsión'}>
      {t.icono && <Icono nombre={iconoTiempo(t.icono)} tamano={16} />}
      {t.tipico && '~'}
      {grados(t.maxima)}
      <span className="secundario">/{grados(t.minima)}</span>
    </span>
  );
}
