import type { ReactNode } from 'react';

import type { Dia, Fecha } from '@/domain/viaje';

import { useAlba } from '../AlbaViajera';
import { ciudad } from '../ciudades';
import { Portada } from './comunes';
import { useUrlFoto } from './FotoDelDia';

/** Portada de un día: el color de su ciudad o, si ya tiene foto del día, la foto. */
/** `ciudad`: la del día aunque no esté escrita (ciudadDelDia); si no se pasa, la del día. */
export function PortadaDia({ dia, fecha, ciudad: nombre, children }: { dia: Dia | undefined; fecha: Fecha; ciudad?: string; children: ReactNode }) {
  const { config } = useAlba();
  const foto = useUrlFoto(dia?.foto);
  return (
    <Portada key={fecha} ciudad={ciudad(nombre ?? dia?.ciudad, config.ciudades, config.pais === 'JP' ? '旅' : config.simbolo, config.salida.ciudad)} foto={foto}>
      {children}
    </Portada>
  );
}
