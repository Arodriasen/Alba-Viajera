import { Link } from 'react-router-dom';

import type { TipoConsejo } from '@/domain/consejos';

import { useConsulta } from '../AlbaViajera';
import { Icono, type NombreIcono } from './Icono';

/** Recordatorios en viñetas (nada que marcar) que salen en Hoy el día que sirven; se pueden cambiar. */
export function TarjetaConsejos({ tipo, titulo, detalle, icono }: { tipo: TipoConsejo; titulo: string; detalle?: string; icono: NombreIcono }) {
  const consejos = useConsulta(({ viaje }) => viaje.consejos(), []);
  const lista = consejos?.[tipo] ?? [];
  if (!lista.length) return null;
  return (
    <section className="tarjeta consejos">
      <div className="fila-consejos">
        <span className="icono-redondo">
          <Icono nombre={icono} tamano={20} />
        </span>
        <span className="texto">
          <span className="negrita">{titulo}</span>
          {detalle && <span className="pequeno secundario">{detalle}</span>}
        </span>
        <Link to={`/consejos/${tipo}`} className="accion-foto" aria-label={`Cambiar los consejos: ${titulo}`}>
          <Icono nombre="editar" tamano={18} />
        </Link>
      </div>
      <ul className="recordatorios" style={{ padding: 0 }}>
        {lista.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    </section>
  );
}
