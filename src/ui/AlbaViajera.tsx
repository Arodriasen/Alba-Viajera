import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { CONFIG_POR_DEFECTO, type ConfigViaje } from '@/domain/config';
import type { ViajeRepositorio } from '@/domain/ViajeRepositorio';
import type { ResumenViaje, ViajesRepositorio } from '@/domain/ViajesRepositorio';
import { tituloDelViaje, VIAJE_ORIGINAL, type ViajeId } from '@/domain/viajes';
import { aFecha, type Fecha } from '@/domain/viaje';
import { apiSync, SesionCaducada, SinConexion } from '@/infrastructure/api';
import { FotosDelDia } from '@/infrastructure/fotos/FotosDelDia';
import type { AlmacenLocal } from '@/infrastructure/local/AlmacenLocal';
import { ViajeLocal } from '@/infrastructure/local/ViajeLocal';
import { ViajesLocal } from '@/infrastructure/local/ViajesLocal';
import { MotorSync } from '@/infrastructure/sync/MotorSync';

export type EstadoSync =
  | { tipo: 'sincronizando' }
  | { tipo: 'alDia' }
  | { tipo: 'sinConexion' }
  | { tipo: 'sesionCaducada' }
  | { tipo: 'error'; mensaje: string };

interface Servicios {
  /** El viaje abierto. */
  viaje: ViajeRepositorio;
  viajes: ViajesRepositorio;
  fotos: FotosDelDia;
  motor: MotorSync;
}

interface Contexto extends Servicios {
  /** Cambia cada vez que cambian los datos (aquí o al llegar del otro móvil). */
  version: number;
  estado: EstadoSync;
  pendientes: number;
  sincronizarAhora: () => void;
  /** Se actualiza cada minuto. */
  ahora: Date;
  /** Fecha de hoy (o la simulada con ?hoy=AAAA-MM-DD para ver cómo será un día del viaje). */
  hoy: Fecha;
  simulando: boolean;
  /** Ajustes del viaje abierto (los valores por defecto hasta que se cargan). */
  config: ConfigViaje;
  /** El viaje abierto (el último elegido; al abrir la app se enseña la lista). */
  viajeId: ViajeId;
  /** Todos los viajes (undefined mientras carga). */
  listaViajes: ResumenViaje[] | undefined;
  elegirViaje: (id: ViajeId) => void;
}

const Ctx = createContext<Contexto | null>(null);

/** Tras un cambio se espera un poco por si vienen más (escribir varias cosas seguidas). */
const ESPERA_TRAS_CAMBIO_MS = 1500;
const CADA_MS = 2 * 60 * 1000;

const CLAVE_VIAJE = 'viaje.actual';
function ultimoViaje(): ViajeId {
  try {
    return localStorage.getItem(CLAVE_VIAJE) || VIAJE_ORIGINAL;
  } catch {
    return VIAJE_ORIGINAL;
  }
}

function hoySimulado(): Fecha | undefined {
  try {
    const param = new URLSearchParams(location.search).get('hoy');
    if (param === '') sessionStorage.removeItem('hoy');
    else if (param && /^\d{4}-\d{2}-\d{2}$/.test(param)) sessionStorage.setItem('hoy', param);
    return sessionStorage.getItem('hoy') ?? undefined;
  } catch {
    return undefined;
  }
}

export function ProveedorAlbaViajera({ almacen, children }: { almacen: AlmacenLocal; children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const [estado, setEstado] = useState<EstadoSync>({ tipo: 'sincronizando' });
  const [pendientes, setPendientes] = useState(0);
  const [ahora, setAhora] = useState(() => new Date());
  const [simulado] = useState(hoySimulado);
  const [config, setConfig] = useState<ConfigViaje>(CONFIG_POR_DEFECTO);
  const [viajeId, setViajeId] = useState<ViajeId>(ultimoViaje);
  const [listaViajes, setListaViajes] = useState<ResumenViaje[]>();
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined);
  const sincronizarRef = useRef<() => void>(() => {});

  const comunes = useMemo(() => {
    const alCambiarAqui = () => {
      setVersion((v) => v + 1);
      clearTimeout(temporizador.current);
      temporizador.current = setTimeout(() => sincronizarRef.current(), ESPERA_TRAS_CAMBIO_MS);
    };
    return {
      alCambiarAqui,
      viajes: new ViajesLocal(almacen, alCambiarAqui),
      motor: new MotorSync(almacen, apiSync, () => setVersion((v) => v + 1)),
    };
  }, [almacen]);

  const servicios = useMemo<Servicios>(() => {
    const viaje = new ViajeLocal(almacen, viajeId, comunes.alCambiarAqui);
    return { viaje, viajes: comunes.viajes, motor: comunes.motor, fotos: new FotosDelDia(almacen, viaje, comunes.alCambiarAqui) };
  }, [almacen, comunes, viajeId]);

  const elegirViaje = useCallback((id: ViajeId) => {
    try {
      localStorage.setItem(CLAVE_VIAJE, id);
    } catch {
      // Sin almacenamiento: vale para esta vez.
    }
    setViajeId(id);
  }, []);

  const sincronizar = useCallback(async () => {
    setEstado({ tipo: 'sincronizando' });
    try {
      await comunes.motor.sincronizar();
      setEstado({ tipo: 'alDia' });
    } catch (e) {
      if (e instanceof SinConexion || !navigator.onLine) setEstado({ tipo: 'sinConexion' });
      else if (e instanceof SesionCaducada) setEstado({ tipo: 'sesionCaducada' });
      else setEstado({ tipo: 'error', mensaje: e instanceof Error ? e.message : String(e) });
    }
    setPendientes(await comunes.motor.pendientes());
  }, [comunes]);

  useEffect(() => {
    sincronizarRef.current = () => void sincronizar();
    void sincronizar();

    const alVolver = () => {
      if (document.visibilityState !== 'visible') return;
      setAhora(new Date());
      void sincronizar();
    };
    const alConectar = () => void sincronizar();
    document.addEventListener('visibilitychange', alVolver);
    window.addEventListener('online', alConectar);
    const sync = setInterval(() => document.visibilityState === 'visible' && void sincronizar(), CADA_MS);
    const reloj = setInterval(() => setAhora(new Date()), 60_000);
    return () => {
      document.removeEventListener('visibilitychange', alVolver);
      window.removeEventListener('online', alConectar);
      clearInterval(sync);
      clearInterval(reloj);
    };
  }, [sincronizar]);

  useEffect(() => {
    servicios.motor.pendientes().then(setPendientes);
    servicios.viaje.config().then(setConfig);
    servicios.viajes.lista().then(setListaViajes);
  }, [servicios, version]);

  const valor = useMemo<Contexto>(
    () => ({
      ...servicios,
      version,
      estado,
      pendientes,
      sincronizarAhora: () => void sincronizar(),
      ahora,
      hoy: simulado ?? aFecha(ahora),
      simulando: simulado !== undefined,
      config,
      viajeId,
      listaViajes,
      elegirViaje,
    }),
    [servicios, version, estado, pendientes, sincronizar, ahora, simulado, config, viajeId, listaViajes, elegirViaje],
  );
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

/** El título de la pestaña: "Alba en Japón" dentro de un viaje, "Alba Viajera" en la lista. */
export function useTitulo(dentro: boolean) {
  const { config } = useAlba();
  useEffect(() => {
    document.title = dentro ? tituloDelViaje(config.destino) : 'Alba Viajera';
  }, [dentro, config.destino]);
}

export function useAlba(): Contexto {
  const c = useContext(Ctx);
  if (!c) throw new Error('Falta ProveedorAlbaViajera');
  return c;
}

/**
 * Ejecuta una consulta y la repite cuando cambian los datos. `undefined` mientras carga la primera
 * vez; después mantiene el último resultado mientras recarga (sin parpadeos).
 */
export function useConsulta<T>(consulta: (s: Servicios) => Promise<T>, deps: unknown[]): T | undefined {
  const alba = useAlba();
  const [datos, setDatos] = useState<{ deps: unknown[]; valor: T }>();
  // El viaje abierto cuenta como una dependencia más: al cambiar de viaje, se vuelve a consultar.
  const todas = [alba.viajeId, ...deps];
  useEffect(() => {
    let vigente = true;
    consulta(alba).then((valor) => vigente && setDatos({ deps: todas, valor }));
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alba.version, ...todas]);
  if (!datos || datos.deps.some((d, i) => d !== todas[i])) return undefined;
  return datos.valor;
}
