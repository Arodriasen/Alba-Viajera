import type { Gasto } from './gastos';
import { impuestoIncluido, resumenTaxFree } from './taxfree';

const g = (id: string, extra: Partial<Gasto>): Gasto => ({
  id,
  concepto: id,
  categoria: 'compras',
  importe: 0,
  moneda: 'JPY',
  euros: 0,
  fecha: '2027-01-19',
  taxFree: true,
  ...extra,
});

describe('Tax Free', () => {
  it('el impuesto es el 10 % que va dentro del precio', () => {
    expect(impuestoIncluido(11_000)).toBeCloseTo(1000, 5);
  });

  it('solo cuenta las compras marcadas y avisa de las de más de 90 días', () => {
    const r = resumenTaxFree(
      [
        g('pocket-pikachu', { importe: 5500, euros: 31.29 }),
        g('ramen', { taxFree: false, categoria: 'comida', importe: 1200, euros: 6.83 }),
        g('antigua', { importe: 11000, euros: 62.58, fecha: '2026-10-01' }),
      ],
      '2027-02-01',
    );
    expect(r.compras.map((x) => x.id)).toEqual(['antigua', 'pocket-pikachu']);
    expect(r.devolucionYenes).toBeCloseTo(1500, 5);
    expect(r.devolucionEuros).toBeCloseTo((31.29 + 62.58) / 11, 5);
    expect(r.fueraDePlazo.map((x) => x.id)).toEqual(['antigua']);
  });

});
