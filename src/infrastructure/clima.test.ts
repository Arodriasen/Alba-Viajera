import { ventanaTipica } from './clima';

describe('clima típico', () => {
  it('las mismas fechas del viaje en los dos años anteriores', () => {
    expect(ventanaTipica('2027-01-11', '2027-02-02', '2026-11-16')).toEqual(['2025-01-04', '2026-02-09']);
  });

  it('sin pasar de hace una semana (viaje dentro de menos de un año)', () => {
    expect(ventanaTipica('2027-05-01', '2027-05-10', '2026-11-16')).toEqual(['2025-04-24', '2026-05-17']);
    expect(ventanaTipica('2027-03-01', '2027-12-20', '2026-11-16')[1]).toBe('2026-11-09');
  });
});
