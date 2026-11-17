import { aEuros, enMoneda, euros, eurosExactos, gastadoEl, yenes, leerPresupuesto, PRESUPUESTO_VACIO, resumir, type Gasto, type Presupuesto } from './gastos';

const g = (id: string, extra: Partial<Gasto>): Gasto => ({
  id,
  concepto: id,
  categoria: 'comida',
  importe: 0,
  moneda: 'EUR',
  euros: 0,
  fecha: '2027-01-14',
  taxFree: false,
  ...extra,
});

describe('presupuesto', () => {
  it('pasa yenes a euros con el cambio', () => {
    expect(aEuros(1758, 'JPY', 175.8)).toBeCloseTo(10, 5);
    expect(aEuros(12.5, 'EUR', 175.8)).toBe(12.5);
  });

  it('resume por categoría y avisa si nos pasamos', () => {
    const p: Presupuesto = {
      categorias: PRESUPUESTO_VACIO.categorias.map((c) => ({ ...c, previsto: c.id === 'comida' ? 100 : c.id === 'vuelos' ? 2300 : 0 })),
    };
    const r = resumir(
      [g('ramen', { euros: 15 }), g('sushi', { euros: 30, fecha: '2027-01-15' }), g('vuelo', { categoria: 'vuelos', euros: 2300 })],
      p,
    );
    expect(r.previsto).toBe(2400);
    expect(r.gastado).toBe(2345);
    expect(r.queda).toBe(55);
    const comida = r.categorias.find((c) => c.categoria.id === 'comida')!;
    expect(comida.gastado).toBe(45);
    expect(comida.gastos.map((x) => x.id)).toEqual(['sushi', 'ramen']); // lo más reciente primero
  });

  it('lo gastado en un día', () => {
    expect(gastadoEl([g('a', { euros: 10 }), g('b', { euros: 5 }), g('c', { euros: 7, fecha: '2027-01-15' })], '2027-01-14')).toBe(15);
  });

  it('lee el presupuesto antiguo (solo importes) sin fiarse', () => {
    const p = leerPresupuesto('{"comida":850,"vuelos":-3,"otros":"mucho"}');
    const de = (id: string) => p.categorias.find((c) => c.id === id)?.previsto;
    expect(p.categorias).toHaveLength(9);
    expect(de('comida')).toBe(850);
    expect(de('vuelos')).toBe(0);
    expect(de('otros')).toBe(0);
    expect(leerPresupuesto('roto')).toEqual(PRESUPUESTO_VACIO);
  });

  it('lee categorías propias y descarta lo que no vale', () => {
    const p = leerPresupuesto(
      JSON.stringify({
        categorias: [
          { id: 'comida', previsto: 300 },
          { id: 'c-friki', nombre: ' Compras friki ', previsto: 500, icono: 'juegos', color: '#c73e2f' },
          { id: 'c-friki', nombre: 'repetida' },
          { id: 'c-x', nombre: 'Rara', icono: 'cohete', color: 'rojo', previsto: -1 },
          { nombre: 'sin id' },
        ],
      }),
    );
    expect(p.categorias.map((c) => c.id)).toEqual(['comida', 'c-friki', 'c-x']);
    expect(p.categorias[0]).toMatchObject({ nombre: 'Comida', icono: 'comida', previsto: 300 });
    expect(p.categorias[1]).toMatchObject({ nombre: 'Compras friki', icono: 'juegos' });
    expect(p.categorias[2]).toMatchObject({ icono: 'otros', color: '#6b705c', previsto: 0 });
  });

  it('los gastos de una categoría que ya no existe salen aparte', () => {
    const r = resumir([g('a', { categoria: 'c-borrada', euros: 10 })], { categorias: [] });
    expect(r.categorias).toHaveLength(1);
    expect(r.categorias[0].categoria.nombre).toBe('Sin categoría');
    expect(r.gastado).toBe(10);
  });

  it('formatea en cualquier moneda', () => {
    expect(enMoneda(2400, 'JPY')).toBe('¥2.400');
    expect(enMoneda(12.5, 'EUR')).toBe('12,50 €');
    expect(enMoneda(12.5, 'USD')).toBe('12,50 $');
    expect(enMoneda(15000, 'KRW')).toBe('15.000 ₩');
  });

  it('formatea en euros', () => {
    expect(euros(1249.6)).toBe('1.250 €');
    expect(eurosExactos(13.6537)).toBe('13,65 €');
    expect(yenes(2400)).toBe('¥2.400');
  });
});
