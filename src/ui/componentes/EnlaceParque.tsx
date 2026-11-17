import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';

import { parqueDelDia } from '@/domain/parques';
import type { Fecha } from '@/domain/viaje';

import { useAlba } from '../AlbaViajera';
import { Icono } from './Icono';

/** En un día de parque, acceso a su guía con Alba. */
export function EnlaceParque({ fecha }: { fecha: Fecha }) {
  const { config } = useAlba();
  const p = parqueDelDia(fecha, config);
  if (!p) return null;
  return (
    <Link to={`/parque/${p.id}`} className="parque-mini enlace-parque" style={{ '--c': p.color } as CSSProperties}>
      <span className="kanji-peq">{p.kanji}</span>
      <span style={{ flex: 1 }}>
        <span className="negrita" style={{ display: 'block' }}>Guía del parque con Alba</span>
        <span className="muy-pequeno">Qué puede hacer según su altura, Rider Swap y lo imprescindible</span>
      </span>
      <Icono nombre="chevron" tamano={20} />
    </Link>
  );
}
