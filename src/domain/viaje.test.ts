import {
  alojamientoDeLaNoche,
  cuentaAtras,
  diaJrPass,
  diaSemana,
  enlaceGoogleMaps,
  fase,
  fechaLarga,
  fechasDelViaje,
  porComprar,
  desglose,
  instanteDe,
  proximoConHora,
  restante,
  salida,
  type Alojamiento,
  type Reserva,
} from './viaje';
import { CONFIG_POR_DEFECTO, leerConfig } from './config';

describe('calendario del viaje', () => {
  it('pone bien los días de la semana (el Word los tenía desplazados)', () => {
    expect(diaSemana('2027-01-11')).toBe('lunes');
    expect(fechaLarga('2027-01-14')).toBe('jueves 14 de enero');
    expect(diaSemana('2027-01-25')).toBe('lunes');
  });

  it('el viaje dura del 11 de enero al 2 de febrero', () => {
    const f = fechasDelViaje();
    expect(f[0]).toBe('2027-01-11');
    expect(f.at(-1)).toBe('2027-02-02');
    expect(f).toHaveLength(23);
  });

  it('sabe si es antes, durante o después', () => {
    expect(fase('2026-11-16')).toEqual({ tipo: 'antes', faltan: 56 });
    expect(fase('2027-01-14')).toEqual({ tipo: 'durante', dia: 4, total: 23 });
    expect(fase('2027-02-03')).toEqual({ tipo: 'despues' });
  });

  it('cuenta los 7 días del JR Pass del 22 al 28', () => {
    expect(diaJrPass('2027-01-21')).toBeUndefined();
    expect(diaJrPass('2027-01-22')).toBe(1);
    expect(diaJrPass('2027-01-28')).toBe(7);
    expect(diaJrPass('2027-01-29')).toBeUndefined();
  });
});

describe('alojamiento de cada noche', () => {
  const a = (id: string, entrada: string, salida: string, estado: Alojamiento['estado'] = 'reservado'): Alojamiento => ({
    id,
    nombre: id,
    entrada,
    salida,
    estado,
  });
  const lista = [
    a('tavinos', '2027-01-12', '2027-01-22'),
    a('ryokan', '2027-01-17', '2027-01-18'),
    a('duplicado', '2027-01-22', '2027-01-25', 'cancelar'),
    a('glanz', '2027-01-22', '2027-01-25'),
  ];

  it('la noche del día de salida ya es el siguiente', () => {
    expect(alojamientoDeLaNoche(lista, '2027-01-21')?.id).toBe('tavinos');
    expect(alojamientoDeLaNoche(lista, '2027-01-22')?.id).toBe('glanz');
  });

  it('entre dos que coinciden gana el más corto si los dos están reservados (el ryokan)', () => {
    // Tavinos 12-22 y ryokan 17-18: el 17 hay que dormir en Nikko.
    expect(alojamientoDeLaNoche([lista[1], lista[0]], '2027-01-17')?.id).toBe('ryokan');
  });
});

describe('compras pendientes', () => {
  const r = (id: string, extra: Partial<Reserva>): Reserva => ({ id, titulo: id, estado: 'pendiente', ...extra });

  it('ordena por fecha de venta y deja al final las que no tienen', () => {
    const lista = porComprar([
      r('sin-fecha', { fechaUso: '2027-01-22' }),
      r('spacia', { venta: new Date('2026-12-17T00:00:00Z') }),
      r('comprada', { estado: 'comprada', venta: new Date('2026-11-01T00:00:00Z') }),
      r('disneysea', { venta: new Date('2026-11-20T05:00:00Z') }),
    ]);
    expect(lista.map((x) => x.id)).toEqual(['disneysea', 'spacia', 'sin-fecha']);
  });

  it('cuenta atrás legible', () => {
    const ahora = new Date('2026-11-16T10:00:00Z');
    expect(cuentaAtras(new Date('2026-11-20T05:00:00Z'), ahora)).toEqual({ tipo: 'pronto', texto: 'en 3 días', urgente: false });
    expect(cuentaAtras(new Date('2026-11-16T15:00:00Z'), ahora)).toEqual({ tipo: 'pronto', texto: 'en 5 h', urgente: true });
    expect(cuentaAtras(new Date('2026-11-16T09:00:00Z'), ahora)).toEqual({ tipo: 'yaALaVenta' });
  });
});

it('enlace de Google Maps en transporte público', () => {
  const url = new URL(enlaceGoogleMaps('Tokyo Disneyland', 'Hotel Tavinos Asakusa'));
  expect(url.searchParams.get('travelmode')).toBe('transit');
  expect(url.searchParams.get('origin')).toBe('Hotel Tavinos Asakusa');
  expect(url.searchParams.get('destination')).toBe('Tokyo Disneyland');
});

describe('tiempo real', () => {
  it('las horas del día 11 son de Madrid y las demás de Japón', () => {
    expect(instanteDe('2027-01-11', '20:20').toISOString()).toBe('2027-01-11T19:20:00.000Z');
    expect(instanteDe('2027-01-27', '16:00').toISOString()).toBe('2027-01-27T07:00:00.000Z');
    expect(salida().toISOString()).toBe('2027-01-11T19:20:00.000Z');
  });

  it('restante sin segundos', () => {
    expect(restante(((2 * 60 + 5) * 60 + 9) * 1000)).toBe('2 h 05 min');
    expect(restante((4 * 60 + 9) * 1000)).toBe('4 min');
    expect(restante(9000)).toBe('menos de 1 min');
    expect(restante(((3 * 24 + 4) * 60 + 1) * 60_000)).toBe('3 d 04 h');
    expect(desglose(((3 * 24 + 4) * 3600 + 61) * 1000)).toEqual({ dias: 3, horas: 4, minutos: 1, segundos: 1 });
  });

  it('lo siguiente con hora, en las próximas 24 h', () => {
    const ahora = new Date('2027-01-27T05:00:00Z'); // 14:00 en Japón
    const r = (titulo: string, hora: string, extra: Partial<Reserva> = {}): Reserva => ({ id: titulo, titulo, estado: 'comprada', fechaUso: '2027-01-27', horaUso: hora, ...extra });
    const p = proximoConHora(
      [r('pasado', '09:00'), r('museo', '16:00'), r('descartada', '15:00', { estado: 'descartada' })],
      [{ id: 't', fecha: '2027-01-27', hora: '14:30', titulo: 'Nara → museo', pasos: [], orden: 1 }],
      ahora,
    );
    expect(p?.titulo).toBe('Nara → museo');
    expect(p?.tipo).toBe('trayecto');
  });
});

describe('ajustes del viaje', () => {
  it('con otras fechas cambian los días, el JR Pass y la salida', () => {
    const c = leerConfig(JSON.stringify({ inicio: '2027-01-12', fin: '2027-01-20', horaSalida: '10:00', jrPass: { inicio: '2027-01-15', dias: 14 } }));
    expect(fechasDelViaje(c)).toHaveLength(9);
    expect(diaJrPass('2027-01-28', c)).toBe(14);
    expect(salida(c).toISOString()).toBe('2027-01-12T09:00:00.000Z');
    expect(fase('2027-01-12', c)).toEqual({ tipo: 'durante', dia: 1, total: 9 });
  });

  it('lo que no vale se cambia por el valor por defecto', () => {
    const c = leerConfig(JSON.stringify({ inicio: 'mañana', fin: '2020-01-01', jrPass: { dias: 99 }, ciudades: [{ nombre: ' ', kanji: 'x' }, { nombre: 'Kobe' }] }));
    expect(c.inicio).toBe(CONFIG_POR_DEFECTO.inicio);
    expect(c.fin).toBe(CONFIG_POR_DEFECTO.inicio);
    expect(c.jrPass.dias).toBe(7);
    expect(c.ciudades).toEqual([{ nombre: 'Kobe', kanji: '旅', color: '#c73e2f', lat: undefined, lon: undefined, pref: undefined, zona: undefined }]);
    expect(leerConfig('esto no es json')).toEqual(CONFIG_POR_DEFECTO);
  });
});
