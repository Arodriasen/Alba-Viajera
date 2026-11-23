import { aEuros, deEuros, gastoDelHotel, hotelDelGasto, hotelesPorPagar, idGastoDeHotel, importesRapidos, enMoneda, euros, eurosExactos, gastadoEl, yenes, leerPresupuesto, PRESUPUESTO_VACIO, resumir, type Gasto, type Presupuesto } from './gastos';
import type { Alojamiento } from './viaje';

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

describe('conversor', () => {
  it('pasa de euros a la moneda y vuelta', () => {
    expect(deEuros(10, 'JPY', 175)).toBe(1750);
    expect(aEuros(deEuros(10, 'JPY', 175), 'JPY', 175)).toBe(10);
    expect(deEuros(10, 'EUR', 175)).toBe(10);
  });

  it('propone importes redondos para tocar', () => {
    expect(importesRapidos('JPY', 175)).toEqual([500, 1000, 3000, 5000, 10000]);
    expect(importesRapidos('EUR', undefined)).toEqual([5, 10, 20, 50, 100]);
    // 1 € = 1,08 $ → 5,4 / 10,8 / 21,6 / 54 / 108 redondeados.
    expect(importesRapidos('USD', 1.08)).toEqual([5, 11, 22, 54, 110]);
    expect(importesRapidos('KRW', 1450)).toEqual([7300, 15000, 29000, 73000, 150000]);
    expect(importesRapidos('XXX', undefined)).toEqual([]);
  });
});

describe('precio de los hoteles', () => {
  const hotel = (extra: Partial<Alojamiento>): Alojamiento => ({ id: 'aloj-tavinos', nombre: 'Hotel Tavinos', estado: 'reservado', entrada: '2027-01-12', ...extra });
  const cats = ['vuelos', 'alojamiento', 'otros'];

  it('el gasto va enlazado por id al hotel (también con el viaje delante)', () => {
    expect(idGastoDeHotel('aloj-tavinos')).toBe('hotel-aloj-tavinos');
    expect(idGastoDeHotel('v1abc:123')).toBe('hotel-123');
    expect(hotelDelGasto('v1abc:hotel-123')).toBe('123');
    expect(hotelDelGasto('hotel-aloj-tavinos')).toBe('aloj-tavinos');
    expect(hotelDelGasto('gasto-vuelos')).toBeUndefined();
  });

  it('pagado: un gasto en Alojamiento pasado a euros', () => {
    const g = gastoDelHotel(hotel({ precio: 90000, moneda: 'JPY', pagado: true }), { porEuro: 180, hoy: '2026-11-21', categorias: cats })!;
    expect(g).toMatchObject({ id: 'hotel-aloj-tavinos', concepto: 'Hotel Tavinos', categoria: 'alojamiento', importe: 90000, moneda: 'JPY', fecha: '2026-11-21' });
    expect(g.euros).toBeCloseTo(500, 5);
  });

  it('sin precio, sin pagar o cancelado: no hay gasto', () => {
    const o = { porEuro: 1, hoy: '2026-11-21', categorias: cats };
    expect(gastoDelHotel(hotel({ pagado: true }), o)).toBeUndefined();
    expect(gastoDelHotel(hotel({ precio: 300, pagado: false }), o)).toBeUndefined();
    expect(gastoDelHotel(hotel({ precio: 300, pagado: true, estado: 'cancelado' }), o)).toBeUndefined();
  });

  it('al volver a guardar conserva lo del gasto y sus euros si el importe no cambia', () => {
    const existente = g('hotel-aloj-tavinos', { categoria: 'otros', importe: 90000, moneda: 'JPY', euros: 520, fecha: '2026-10-01', notas: 'con tarjeta', foto: 't.jpg' });
    const igual = gastoDelHotel(hotel({ precio: 90000, moneda: 'JPY', pagado: true, nombre: 'Tavinos Asakusa' }), { existente, porEuro: 180, hoy: '2026-11-21', categorias: cats })!;
    expect(igual).toMatchObject({ concepto: 'Tavinos Asakusa', categoria: 'otros', euros: 520, fecha: '2026-10-01', notas: 'con tarjeta', foto: 't.jpg' });
    const otro = gastoDelHotel(hotel({ precio: 72000, moneda: 'JPY', pagado: true }), { existente, porEuro: 180, hoy: '2026-11-21', categorias: cats })!;
    expect(otro.euros).toBeCloseTo(400, 5);
  });

  it('enlazar un gasto apuntado a mano: pasa a tener el id del hotel y conserva lo suyo', () => {
    const suelto = g('abc-123', { concepto: 'Tavinos (Booking)', categoria: 'alojamiento', importe: 1040, moneda: 'EUR', euros: 1040, fecha: '2026-07-02', foto: 'r.jpg' });
    const r = gastoDelHotel(hotel({ precio: 1040, moneda: 'EUR', pagado: true }), { existente: suelto, porEuro: 1, hoy: '2026-11-21', categorias: cats })!;
    expect(r).toMatchObject({ id: 'hotel-aloj-tavinos', concepto: 'Hotel Tavinos', euros: 1040, fecha: '2026-07-02', foto: 'r.jpg' });
  });

  it('sin categoría Alojamiento va a Otros', () => {
    expect(gastoDelHotel(hotel({ precio: 300, pagado: true }), { porEuro: 1, hoy: '2026-11-21', categorias: ['comida', 'otros'] })!.categoria).toBe('otros');
  });

  it('por pagar: los que se pagan allí, por fecha y con el cambio de hoy', () => {
    const r = hotelesPorPagar(
      [
        hotel({ id: 'b', entrada: '2027-01-28', precio: 54000, moneda: 'JPY' }),
        hotel({ id: 'a', entrada: '2027-01-22', precio: 300 }),
        hotel({ id: 'pagado', precio: 500, pagado: true }),
        hotel({ id: 'cancelado', precio: 500, estado: 'cancelado' }),
        hotel({ id: 'sin-precio' }),
        hotel({ id: 'usd', entrada: '2027-02-01', precio: 100, moneda: 'USD' }),
      ],
      (m) => (m === 'JPY' ? 180 : undefined),
    );
    expect(r.map((x) => x.alojamiento.id)).toEqual(['a', 'b', 'usd']);
    expect(r[0].euros).toBe(300);
    expect(r[1].euros).toBeCloseTo(300, 5);
    expect(r[2].euros).toBeUndefined();
  });
});
