/** Diario del viaje: un texto compartido por día (TypeScript puro). */

import type { ConfigViaje } from './config';
import { sumarDias, type Fecha } from './viaje';

export interface EntradaDiario {
  fecha: Fecha;
  texto: string;
}

/** Desde esta hora (del destino) Hoy pregunta por el día de hoy. */
export const HORA_DIARIO_NOCHE = '18:00';
/** Hasta esta hora Hoy recuerda el de ayer, si quedó sin escribir. */
export const HORA_DIARIO_MANANA = '12:00';

export interface DiarioEnHoy {
  fecha: Fecha;
  /** Ayer: solo se enseña si estaba sin escribir al abrir Hoy. */
  ayer: boolean;
}

/**
 * Qué día del diario saca Hoy a esta hora ("HH:MM" del destino), o undefined. Por la tarde, el de hoy; por
 * la mañana, el de ayer (si ayer era del viaje). Así no está todo el día a la vista.
 */
export function diarioEnHoy(hoy: Fecha, hora: string, c: Pick<ConfigViaje, 'inicio' | 'fin'>): DiarioEnHoy | undefined {
  if (hoy < c.inicio || hoy > c.fin) return undefined;
  if (hora >= HORA_DIARIO_NOCHE) return { fecha: hoy, ayer: false };
  const ayer = sumarDias(hoy, -1);
  if (hora < HORA_DIARIO_MANANA && ayer >= c.inicio) return { fecha: ayer, ayer: true };
  return undefined;
}

/** Se puede escribir el diario de un día cuando ya ha llegado (hoy o antes). */
export const sePuedeEscribir = (fecha: Fecha, hoy: Fecha) => fecha <= hoy;
