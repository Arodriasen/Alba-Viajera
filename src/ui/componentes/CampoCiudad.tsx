import type { CSSProperties } from 'react';

import { useAlba } from '../AlbaViajera';
import { conCiudad } from '../ciudades';

/**
 * Ciudad: se escribe o se toca una de las guardadas en el viaje. Una nueva se añade a las ciudades
 * del viaje al guardar (con `useGuardarCiudad`).
 */
export function CampoCiudad({ valor, alCambiar, ayuda }: { valor: string; alCambiar: (v: string) => void; ayuda?: string }) {
  const { config } = useAlba();
  const elegida = config.ciudades.find((c) => c.nombre.toLowerCase() === valor.trim().toLowerCase());
  const nueva = valor.trim() && !elegida;
  return (
    <div className="campo">
      <span>Ciudad</span>
      <input className="entrada" value={valor} placeholder="Escribe o elige abajo" onChange={(e) => alCambiar(e.target.value)} />
      {config.ciudades.length > 0 && (
        <div className="opciones" role="radiogroup" aria-label="Ciudades del viaje">
          {config.ciudades.map((c) => (
            <button
              key={c.nombre}
              type="button"
              role="radio"
              aria-checked={elegida?.nombre === c.nombre}
              className={`opcion opcion-ciudad ${elegida?.nombre === c.nombre ? 'activa' : ''}`}
              style={{ '--c': c.color } as CSSProperties}
              onClick={() => alCambiar(elegida?.nombre === c.nombre ? '' : c.nombre)}
            >
              {c.nombre}
            </button>
          ))}
        </div>
      )}
      {nueva ? <small>«{valor.trim()}» se añadirá a las ciudades del viaje al guardar.</small> : ayuda && <small>{ayuda}</small>}
    </div>
  );
}

/** Guarda la ciudad en los ajustes del viaje si aún no está. */
export function useGuardarCiudad() {
  const { viaje } = useAlba();
  return async (nombre: string | undefined) => {
    const nueva = conCiudad(await viaje.config(), nombre);
    if (nueva) await viaje.guardarConfig(nueva);
  };
}
