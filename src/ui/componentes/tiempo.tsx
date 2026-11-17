import { useEffect, useState } from 'react';

import { horaEn } from '@/domain/clima';
import { desglose, restante } from '@/domain/viaje';

import { useAlba } from '../AlbaViajera';

/**
 * La hora actual, refrescada justo al cambiar de minuto (sin segundos: no marea). Solo repinta el
 * componente que lo usa.
 */
export function useMinuto(): Date {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const programar = () => {
      const falta = 60_000 - (Date.now() % 60_000) + 50;
      t = setTimeout(() => {
        setAhora(new Date());
        programar();
      }, falta);
    };
    programar();
    const alVolver = () => document.visibilityState === 'visible' && setAhora(new Date());
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      clearTimeout(t);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, []);
  return ahora;
}

const horaCortaJapon = new Intl.DateTimeFormat('es-ES', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' });

/** "14:05" en hora de Japón. */
export const enJapon = (d: Date) => horaCortaJapon.format(d);

/** "En Japón son las 23:14". */
export function RelojJapon({ texto = 'En Japón son las' }: { texto?: string }) {
  const ahora = useMinuto();
  return (
    <span className="reloj">
      {texto} <span className="digitos">{enJapon(ahora)}</span>
    </span>
  );
}

/** "En Roma son las 23:14" (la hora del destino del viaje abierto). */
export function RelojDestino({ texto }: { texto?: string }) {
  const { config } = useAlba();
  const ahora = useMinuto();
  return (
    <span className="reloj">
      {texto ?? `En ${config.destino} son las`} <span className="digitos">{horaEn(ahora, config.zona)}</span>
    </span>
  );
}

/** Días · horas · minutos que faltan. */
export function CuentaAtras({ hasta }: { hasta: Date }) {
  const ahora = useMinuto();
  const d = desglose(hasta.getTime() - ahora.getTime());
  const casilla = (n: number, txt: string, ancho = 2) => (
    <span className="casilla">
      <span className="num">{String(n).padStart(ancho, '0')}</span>
      <span className="txt">{txt}</span>
    </span>
  );
  return (
    <span className="cuenta-atras" role="timer" aria-label={`Faltan ${d.dias} días, ${d.horas} horas y ${d.minutos} minutos`}>
      {casilla(d.dias, d.dias === 1 ? 'día' : 'días', 1)}
      {casilla(d.horas, 'h')}
      {casilla(d.minutos, 'min')}
    </span>
  );
}

/** "2 h 05 min". `desfase` (ms) para cuando se simula otro día con ?hoy=. */
export function Restante({ hasta, desfase = 0 }: { hasta: Date; desfase?: number }) {
  const ahora = useMinuto();
  return <span className="digitos">{restante(hasta.getTime() - ahora.getTime() - desfase)}</span>;
}
