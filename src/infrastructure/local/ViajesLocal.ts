import { leerConfig, type ConfigViaje } from '@/domain/config';
import { PRESUPUESTO_VACIO } from '@/domain/gastos';
import type { ResumenViaje, ViajesRepositorio } from '@/domain/ViajesRepositorio';
import { esDelViaje, idEn, nuevoViajeId, sinViaje, VIAJE_ORIGINAL, viajeDe, type ViajeId } from '@/domain/viajes';

import { TABLAS, type AlmacenLocal } from './AlmacenLocal';
import { escribirFila } from './ViajeLocal';

/**
 * Los viajes son sus ajustes (`<viaje>:viaje` en la tabla ajustes; el de Japón, 'viaje'). El de Japón
 * aparece aunque aún no tenga ajustes guardados (sus datos de partida venían sin ellos) hasta que se borre.
 */
export class ViajesLocal implements ViajesRepositorio {
  constructor(
    private readonly almacen: AlmacenLocal,
    private readonly alCambiar: () => void,
  ) {}

  async lista(): Promise<ResumenViaje[]> {
    const ajustes = await this.almacen.todas('ajustes');
    const viajes = ajustes
      .filter((f) => sinViaje(f.id) === 'viaje' && !f.borrado)
      .map((f) => ({ id: viajeDe(f.id), config: leerConfig(typeof f.valor === 'string' ? f.valor : undefined) }));
    if (!ajustes.some((f) => f.id === 'viaje')) viajes.push({ id: VIAJE_ORIGINAL, config: leerConfig(undefined) });
    return viajes.sort((a, b) => a.config.inicio.localeCompare(b.config.inicio) || a.config.destino.localeCompare(b.config.destino));
  }

  async crear(config: ConfigViaje): Promise<ViajeId> {
    const id = nuevoViajeId();
    await escribirFila(this.almacen, 'ajustes', { id: idEn(id, 'viaje'), valor: JSON.stringify(config) });
    await escribirFila(this.almacen, 'ajustes', { id: idEn(id, 'presupuesto'), valor: JSON.stringify(PRESUPUESTO_VACIO) });
    this.alCambiar();
    return id;
  }

  async borrar(viaje: ViajeId): Promise<string[]> {
    const fotos: string[] = [];
    for (const tabla of TABLAS) {
      const suyas = (await this.almacen.todas(tabla)).filter((f) => !f.borrado && esDelViaje(f.id, viaje));
      for (const f of suyas) {
        if (tabla === 'dias' && typeof f.foto === 'string' && f.foto) fotos.push(f.foto);
        await escribirFila(this.almacen, tabla, { id: f.id }, 1);
      }
    }
    // Que conste como borrado aunque nunca se guardaran sus ajustes (el de Japón).
    const ajustes = idEn(viaje, 'viaje');
    if (!(await this.almacen.obtener('ajustes', ajustes))?.borrado) await escribirFila(this.almacen, 'ajustes', { id: ajustes }, 1);
    this.alCambiar();
    return fotos;
  }
}
