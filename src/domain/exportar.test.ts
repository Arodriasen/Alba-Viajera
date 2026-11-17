import { describe, expect, it } from 'vitest';

import { CONFIG_POR_DEFECTO } from './config';
import { fechaParaExcel, hojasDelViaje, nombreDeArchivo, nombreDeHoja, type DatosViaje } from './exportar';
import { PRESUPUESTO_VACIO } from './gastos';

const datos = (cambios: Partial<DatosViaje> = {}): DatosViaje => ({
  config: CONFIG_POR_DEFECTO,
  dias: [{ fecha: CONFIG_POR_DEFECTO.inicio, titulo: 'Salida', plan: ['Vuelo', 'Cena'], ciudad: 'Madrid' }],
  alojamientos: [{ id: 'h', nombre: 'Tavinos', entrada: '2027-01-12', salida: '2027-01-17', estado: 'reservado' }],
  trayectos: [],
  reservas: [{ id: 'r', titulo: 'DisneySea', estado: 'comprada', fechaUso: '2027-01-20' }],
  gastos: [{ id: 'g', concepto: 'Ramen', categoria: 'comida', importe: 1800, moneda: 'JPY', euros: 10.234, fecha: '2027-01-13', taxFree: false, foto: 'x.jpg' }],
  presupuesto: PRESUPUESTO_VACIO,
  elementos: [],
  ...cambios,
});

describe('exportar a Excel', () => {
  it('saca las hojas de los apartados que tiene el viaje', () => {
    const nombres = hojasDelViaje(datos()).map((h) => h.nombre);
    expect(nombres).toEqual(['Resumen', 'Itinerario', 'Hoteles', 'Reservas', 'Gastos', 'Presupuesto']);
    const sin = hojasDelViaje(datos({ config: { ...CONFIG_POR_DEFECTO, apartados: [] } })).map((h) => h.nombre);
    expect(sin).toEqual(['Resumen', 'Itinerario', 'Hoteles']);
  });

  it('el itinerario lleva todos los días, con el plan en líneas y el hotel de esa noche', () => {
    const it = hojasDelViaje(datos()).find((h) => h.nombre === 'Itinerario')!;
    expect(it.filas[0].slice(0, 4)).toEqual([CONFIG_POR_DEFECTO.inicio, 'Madrid', 'Salida', 'Vuelo\nCena']);
    const noche13 = it.filas.find((f) => f[0] === '2027-01-13')!;
    expect(noche13[4]).toBe('Tavinos');
    expect(it.filas.length).toBeGreaterThan(20);
  });

  it('los gastos con su categoría, euros redondeados y si tienen ticket; el presupuesto acaba en total', () => {
    const hojas = hojasDelViaje(datos());
    const g = hojas.find((h) => h.nombre === 'Gastos')!;
    const fila = g.filas[0];
    expect(fila[2]).toBe('Comida');
    expect(fila[5]).toBe(10.23);
    expect(fila[g.columnas.findIndex((c) => c.titulo === 'Ticket')]).toBe('Sí');
    const p = hojas.find((h) => h.nombre === 'Presupuesto')!;
    expect(p.conTotal).toBe(true);
    expect(p.filas.at(-1)![0]).toBe('Total');
  });

  it('cada lista propia es una hoja', () => {
    const config = { ...CONFIG_POR_DEFECTO, listas: [{ id: 'l', nombre: 'Compras: friki/varias', icono: 'lista', color: '#000000' }] } as DatosViaje['config'];
    const hojas = hojasDelViaje(datos({ config, elementos: [{ id: 'e', lista: 'l', nombre: 'Pocket Pikachu', hecho: false, precioMin: 3000, orden: 0 }] }));
    const l = hojas.at(-1)!;
    expect(l.nombre).toBe('Compras friki varias');
    expect(l.filas[0]).toEqual(['Pocket Pikachu', 'No', 3000, null, 'JPY', null, null, null]);
  });

  it('nombres de hoja válidos y sin repetir', () => {
    const usados = new Set<string>();
    expect(nombreDeHoja('Gastos', usados)).toBe('Gastos');
    expect(nombreDeHoja('gastos', usados)).toBe('gastos 2');
    expect(nombreDeHoja('x'.repeat(40), usados)).toHaveLength(31);
    expect(nombreDeHoja('[]', usados)).toBe('Hoja');
  });

  it('nombre de archivo y fechas', () => {
    expect(nombreDeArchivo('Japón', '2026-11-17')).toBe('alba-en-japon-2026-11-17.xlsx');
    expect(fechaParaExcel('2027-01-11')?.toISOString()).toBe('2027-01-11T00:00:00.000Z');
    expect(fechaParaExcel('mal')).toBeUndefined();
  });
});
