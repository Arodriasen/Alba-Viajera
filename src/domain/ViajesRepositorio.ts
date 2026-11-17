import type { ConfigViaje } from './config';
import type { ViajeId } from './viajes';

export interface ResumenViaje {
  id: ViajeId;
  config: ConfigViaje;
}

/** La lista de viajes (pantalla inicial). Lo de dentro de cada viaje va por ViajeRepositorio. */
export interface ViajesRepositorio {
  /** Por fecha de salida. */
  lista(): Promise<ResumenViaje[]>;
  /** Crea el viaje con sus ajustes y el presupuesto de serie; devuelve su id. */
  crear(config: ConfigViaje): Promise<ViajeId>;
  /** Borra el viaje y todo lo suyo. Devuelve las fotos que tenía (para borrarlas también). */
  borrar(id: ViajeId): Promise<string[]>;
}
