import { describe, expect, it } from 'vitest';

import { CONFIG_POR_DEFECTO } from './config';
import { cambioDeHotel, CONSEJOS_DE_SERIE, diasSuica, facturacionAbierta, leerConsejos, ultimoTrenPendiente } from './consejos';
import { instanteDe, type Alojamiento } from './viaje';

const c = CONFIG_POR_DEFECTO;
const hoteles: Alojamiento[] = [
  { id: 't1', nombre: 'Tavinos', ciudad: 'Tokio', entrada: '2027-01-12', salida: '2027-01-17', estado: 'reservado' },
  { id: 'n', nombre: 'Tokanso', ciudad: 'Nikko', entrada: '2027-01-17', salida: '2027-01-19', estado: 'reservado' },
  { id: 't2', nombre: 'Tavinos', ciudad: 'Tokio', entrada: '2027-01-19', salida: '2027-01-22', estado: 'reservado' },
];

describe('notas de Japón', () => {
  it('cambio de hotel: solo los días en que se deja uno y se llega a otro', () => {
    expect(cambioDeHotel(hoteles, '2027-01-17')?.salida.nombre).toBe('Tavinos');
    expect(cambioDeHotel(hoteles, '2027-01-17')?.llegada.nombre).toBe('Tokanso');
    expect(cambioDeHotel(hoteles, '2027-01-12')).toBeUndefined(); // llegada al primero: no es cambio
    expect(cambioDeHotel(hoteles, '2027-01-13')).toBeUndefined();
    expect(cambioDeHotel(hoteles, '2027-01-22')).toBeUndefined(); // se deja sin llegar a otro (en los datos de la prueba)
  });

  it('Suica: el día de llegar al primer hotel y el primero con trenes; nada fuera de Japón', () => {
    const tren = [{ id: 'x', fecha: '2027-01-14', titulo: 'A Maihama', pasos: [], orden: 0 }];
    expect(diasSuica(c, hoteles, tren)).toEqual(['2027-01-12', '2027-01-14']);
    expect(diasSuica(c, hoteles, [])).toEqual(['2027-01-12']);
    expect(diasSuica({ ...c, pais: 'IT' }, hoteles, tren)).toEqual([]);
  });

  it('consejos guardados: los de serie si no hay; lo vacío se quita', () => {
    expect(leerConsejos(undefined)).toEqual(CONSEJOS_DE_SERIE);
    expect(leerConsejos('roto')).toEqual(CONSEJOS_DE_SERIE);
    expect(leerConsejos(JSON.stringify({ suica: [' Uno ', '', 3] })).suica).toEqual(['Uno']);
    expect(leerConsejos(JSON.stringify({ suica: [] })).cambioHotel).toEqual(CONSEJOS_DE_SERIE.cambioHotel);
  });

  it('último tren: desde 3 h antes, urgente la última hora; de madrugada cuenta para el día siguiente', () => {
    const dia = { fecha: '2027-01-13', titulo: '', plan: [], ultimoTren: '23:40' };
    const a = (h: string, f = '2027-01-13') => instanteDe(f, h, c);
    expect(ultimoTrenPendiente([dia], a('20:00'), c)).toBeUndefined();
    expect(ultimoTrenPendiente([dia], a('21:00'), c)?.urgente).toBe(false);
    expect(ultimoTrenPendiente([dia], a('23:00'), c)?.urgente).toBe(true);
    expect(ultimoTrenPendiente([dia], a('23:45'), c)).toBeUndefined();
    const madrugada = { ...dia, ultimoTren: '00:20' };
    expect(ultimoTrenPendiente([madrugada], a('23:50'), c)?.hora).toBe('00:20');
    expect(ultimoTrenPendiente([madrugada, undefined], a('00:10', '2027-01-14'), c)?.urgente).toBe(true);
    expect(ultimoTrenPendiente([{ ...dia, ultimoTren: undefined }], a('23:00'), c)).toBeUndefined();
  });

  it('facturación online: desde N horas antes hasta que sale el vuelo', () => {
    const vuelta = instanteDe(c.vueltaFecha, c.horaVuelta, c);
    const h = (n: number) => new Date(vuelta.getTime() - n * 3600_000);
    expect(facturacionAbierta('vuelta', h(25), c)).toBe(false);
    expect(facturacionAbierta('vuelta', h(23), c)).toBe(true);
    expect(facturacionAbierta('vuelta', h(-1), c)).toBe(false);
    expect(facturacionAbierta('vuelta', h(40), { ...c, vuelos: { ...c.vuelos, facturacionHoras: 48 } })).toBe(true);
    expect(facturacionAbierta('ida', h(23), c)).toBe(false);
  });
});
