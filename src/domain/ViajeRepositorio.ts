import type { ConfigViaje } from './config';
import type { Frase, TraduccionSerie } from './frases';
import type { Elemento } from './listas';
import type { Gasto, Presupuesto } from './gastos';
import type { Atraccion } from './parques';
import type { Alojamiento, Dia, Fecha, Reserva, Trayecto } from './viaje';
import type { ViajeId } from './viajes';

/** Los datos de UN viaje (el abierto). La lista de viajes va por ViajesRepositorio. */
export interface ViajeRepositorio {
  readonly id: ViajeId;

  dias(): Promise<Dia[]>;
  dia(fecha: Fecha): Promise<Dia | undefined>;
  guardarDia(d: Dia): Promise<void>;

  alojamientos(): Promise<Alojamiento[]>;
  alojamiento(id: string): Promise<Alojamiento | undefined>;
  guardarAlojamiento(a: Alojamiento): Promise<void>;
  borrarAlojamiento(id: string): Promise<void>;

  reservas(): Promise<Reserva[]>;
  reserva(id: string): Promise<Reserva | undefined>;
  guardarReserva(r: Reserva): Promise<void>;
  borrarReserva(id: string): Promise<void>;

  atracciones(): Promise<Atraccion[]>;
  atraccion(id: string): Promise<Atraccion | undefined>;
  guardarAtraccion(a: Atraccion): Promise<void>;
  borrarAtraccion(id: string): Promise<void>;
  /** cm; la que haya guardado cualquiera de los dos. */
  alturaAlba(): Promise<number>;
  guardarAlturaAlba(cm: number): Promise<void>;

  /** Ajustes del viaje (destino, apartados, fechas, vuelos, JR Pass, parques, ciudades). */
  config(): Promise<ConfigViaje>;
  guardarConfig(c: ConfigViaje): Promise<void>;
  /** Deja el día sin título, plan ni notas (la foto se queda). */
  vaciarDia(fecha: string): Promise<void>;

  gastos(): Promise<Gasto[]>;
  gasto(id: string): Promise<Gasto | undefined>;
  guardarGasto(g: Gasto): Promise<void>;
  borrarGasto(id: string): Promise<void>;
  presupuesto(): Promise<Presupuesto>;
  /** Frases añadidas por vosotros (las de serie no se guardan). */
  frasesPropias(): Promise<Frase[]>;
  guardarFrasesPropias(f: Frase[]): Promise<void>;
  /** Las de serie traducidas a los idiomas del viaje (si no son español → japonés). */
  traduccionFrases(): Promise<TraduccionSerie | undefined>;
  guardarTraduccionFrases(t: TraduccionSerie): Promise<void>;
  guardarPresupuesto(p: Presupuesto): Promise<void>;

  /** Elementos de las listas propias (de una o de todas). */
  elementos(lista?: string): Promise<Elemento[]>;
  elemento(id: string): Promise<Elemento | undefined>;
  guardarElemento(e: Elemento): Promise<void>;
  borrarElemento(id: string): Promise<void>;

  trayectos(): Promise<Trayecto[]>;
  trayecto(id: string): Promise<Trayecto | undefined>;
  guardarTrayecto(t: Trayecto): Promise<void>;
  borrarTrayecto(id: string): Promise<void>;
}
