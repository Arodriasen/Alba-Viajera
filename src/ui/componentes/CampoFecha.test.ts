import { formatearEscrito, leerEscrito } from './CampoFecha';

describe('fecha escrita a mano', () => {
  it('pone las barras solas mientras se escribe', () => {
    expect(formatearEscrito('1')).toBe('1');
    expect(formatearEscrito('110')).toBe('11/0');
    expect(formatearEscrito('11012027')).toBe('11/01/2027');
    expect(formatearEscrito('11/01/20271')).toBe('11/01/2027');
    expect(formatearEscrito('11-01-2027')).toBe('11/01/2027');
  });

  it('solo acepta fechas que existen', () => {
    expect(leerEscrito('11/01/2027')).toBe('2027-01-11');
    expect(leerEscrito('1/2/27')).toBe('2027-02-01');
    expect(leerEscrito('29/02/2027')).toBeUndefined();
    expect(leerEscrito('29/02/2028')).toBe('2028-02-29');
    expect(leerEscrito('11/01/202')).toBeUndefined();
    expect(leerEscrito('')).toBeUndefined();
  });
});
