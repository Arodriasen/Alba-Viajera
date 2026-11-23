import { describe, expect, it } from 'vitest';

import { diarioEnHoy, sePuedeEscribir } from './diario';

const c = { inicio: '2027-01-11', fin: '2027-02-02' };

describe('diario', () => {
  it('por la tarde pregunta por hoy', () => {
    expect(diarioEnHoy('2027-01-14', '18:00', c)).toEqual({ fecha: '2027-01-14', ayer: false });
    expect(diarioEnHoy('2027-01-14', '23:59', c)).toEqual({ fecha: '2027-01-14', ayer: false });
  });

  it('por la mañana recuerda el de ayer', () => {
    expect(diarioEnHoy('2027-01-15', '08:30', c)).toEqual({ fecha: '2027-01-14', ayer: true });
    expect(diarioEnHoy('2027-01-15', '00:10', c)).toEqual({ fecha: '2027-01-14', ayer: true });
  });

  it('a media tarde no sale nada', () => {
    expect(diarioEnHoy('2027-01-15', '12:00', c)).toBeUndefined();
    expect(diarioEnHoy('2027-01-15', '17:59', c)).toBeUndefined();
  });

  it('el primer día por la mañana no hay ayer, y fuera del viaje no sale', () => {
    expect(diarioEnHoy('2027-01-11', '09:00', c)).toBeUndefined();
    expect(diarioEnHoy('2027-01-11', '20:00', c)).toEqual({ fecha: '2027-01-11', ayer: false });
    expect(diarioEnHoy('2027-02-03', '20:00', c)).toBeUndefined();
  });

  it('se escribe en hoy y en los días pasados, no en los que faltan', () => {
    expect(sePuedeEscribir('2027-01-14', '2027-01-14')).toBe(true);
    expect(sePuedeEscribir('2027-01-12', '2027-01-14')).toBe(true);
    expect(sePuedeEscribir('2027-01-15', '2027-01-14')).toBe(false);
  });
});
