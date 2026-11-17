import { describe, expect, it } from 'vitest';

import { CONFIG_POR_DEFECTO } from './config';
import { PRESUPUESTO_VACIO } from './gastos';
import { resumenDelViaje, type DatosResumen } from './resumen';
import { enlaceEstadoVuelo, horaAeropuerto } from './viaje';

const base: DatosResumen = {
  config: CONFIG_POR_DEFECTO,
  dias: [
    { fecha: '2027-01-13', titulo: 'Asakusa', plan: [], foto: 'a.jpg' },
    { fecha: '2027-01-14', titulo: 'Disney', plan: [], ciudad: 'Tokio' },
  ],
  alojamientos: [
    { id: 't', nombre: 'Tavinos', ciudad: 'Tokio', entrada: '2027-01-12', salida: '2027-01-17', estado: 'reservado' },
    { id: 'n', nombre: 'Tokanso', ciudad: 'Nikko', entrada: '2027-01-17', salida: '2027-01-19', estado: 'reservado' },
    { id: 'x', nombre: 'Parkside', ciudad: 'Tokio', entrada: '2027-01-28', salida: '2027-02-01', estado: 'cancelado' },
  ],
  trayectos: [
    { id: '1', fecha: '2027-01-17', titulo: 'A Nikko', pasos: [], orden: 0, jrPass: false },
    { id: '2', fecha: '2027-01-22', titulo: 'A Osaka', pasos: [], orden: 0, jrPass: true },
  ],
  reservas: [
    { id: 'r1', titulo: 'Disneyland', estado: 'comprada' },
    { id: 'r2', titulo: 'Algo', estado: 'pendiente' },
  ],
  gastos: [
    { id: 'g1', concepto: 'Ramen', categoria: 'comida', importe: 10, moneda: 'EUR', euros: 10, fecha: '2027-01-13', taxFree: false },
    { id: 'g2', concepto: 'Hotel', categoria: 'alojamiento', importe: 500, moneda: 'EUR', euros: 500, fecha: '2027-01-13', taxFree: false },
  ],
  presupuesto: PRESUPUESTO_VACIO,
};

describe('resumen del viaje', () => {
  it('cuenta días, noches por ciudad (sin hoteles cancelados), fotos y gasto', () => {
    const r = resumenDelViaje(base);
    expect(r.dias).toBe(23);
    expect(r.noches).toBe(7);
    expect(r.ciudades.map((c) => [c.nombre, c.noches])).toEqual([
      ['Tokio', 5],
      ['Nikko', 2],
    ]);
    expect(r.hoteles).toBe(2);
    expect(r.trayectos).toBe(2);
    expect(r.trayectosJr).toBe(1);
    expect(r.entradas).toBe(1);
    expect(r.parques).toEqual(['Tokyo Disneyland', 'Tokyo DisneySea', 'Universal Studios Japan']);
    expect(r.fotos).toEqual([{ fecha: '2027-01-13', foto: 'a.jpg' }]);
    expect(r.gastado).toBe(510);
    expect(r.masGasto).toEqual({ nombre: 'Alojamiento', euros: 500 });
  });

  it('sin apartados no saca ni gasto ni parques ni fotos', () => {
    const r = resumenDelViaje({ ...base, config: { ...CONFIG_POR_DEFECTO, apartados: [] } });
    expect(r.gastado).toBeUndefined();
    expect(r.masGasto).toBeUndefined();
    expect(r.parques).toEqual([]);
    expect(r.fotos).toEqual([]);
    expect(r.entradas).toBe(0);
  });
});

describe('vuelo', () => {
  it('enlace al estado del vuelo solo con un número de vuelo', () => {
    expect(enlaceEstadoVuelo('ib 282')).toBe('https://www.google.com/search?q=IB282+vuelo');
    expect(enlaceEstadoVuelo('')).toBeUndefined();
    expect(enlaceEstadoVuelo('Iberia')).toBeUndefined();
  });

  it('hora de estar en el aeropuerto', () => {
    expect(horaAeropuerto('22:10')).toBe('19:10');
    expect(horaAeropuerto('01:30')).toBe('22:30');
    expect(horaAeropuerto('mal')).toBeUndefined();
  });
});
