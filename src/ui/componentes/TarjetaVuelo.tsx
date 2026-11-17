import { enlaceEstadoVuelo, fechaCorta, horaAeropuerto } from '@/domain/viaje';

import { useAlba } from '../AlbaViajera';
import { Icono } from './Icono';

/**
 * El vuelo de ida o de vuelta: número, aerolínea, terminal, a qué hora estar en el aeropuerto y el enlace a su
 * estado. Con `siHayDatos`, no sale nada si en Ajustes no se ha escrito ni número, ni aerolínea, ni terminal.
 */
export function TarjetaVuelo({ tramo, siHayDatos = false }: { tramo: 'ida' | 'vuelta'; siHayDatos?: boolean }) {
  const { config } = useAlba();
  const v = config.vuelos[tramo];
  const hayDatos = Boolean(v.numero || v.aerolinea || v.terminal);
  if (siHayDatos && !hayDatos) return null;
  const fecha = tramo === 'ida' ? config.inicio : config.vueltaFecha;
  const hora = tramo === 'ida' ? config.horaSalida : config.horaVuelta;
  const donde = tramo === 'ida' ? `hora de ${config.salida.ciudad || 'casa'}` : `hora de ${config.destino}`;
  const aeropuerto = horaAeropuerto(hora);
  const estado = enlaceEstadoVuelo(v.numero);
  const detalle = [v.numero.toUpperCase(), v.aerolinea, v.terminal && (/^t/i.test(v.terminal) ? v.terminal : `Terminal ${v.terminal}`)].filter(Boolean).join(' · ');

  return (
    <div className="tarjeta fila-tarjeta destacada">
      <span className="icono-redondo">
        <Icono nombre="vuelos" tamano={20} />
      </span>
      <span className="texto">
        <span className="etiqueta">
          {tramo === 'ida' ? 'Vuelo de ida' : 'Vuelo de vuelta'} · {fechaCorta(fecha)} · {hora} ({donde})
        </span>
        {detalle && <span className="negrita">{detalle}</span>}
        {aeropuerto && <span className="pequeno secundario">Estar en el aeropuerto hacia las {aeropuerto} (unas 3 h antes).</span>}
      </span>
      {estado && (
        <a className="accion-texto" href={estado} target="_blank" rel="noreferrer">
          Estado <Icono nombre="enlace" tamano={14} />
        </a>
      )}
    </div>
  );
}
