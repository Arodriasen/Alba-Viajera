import { leerConfig, CONFIG_POR_DEFECTO } from './config';
import { instanteDe } from './viaje';
import { apartadosDe, apartadosPorDefecto, bandera, esDelViaje, idEn, instanteEnZona, sinViaje, tituloDelViaje, VIAJE_ORIGINAL, viajeDe } from './viajes';

describe('varios viajes', () => {
  it('el viaje va en el id (el de Japón, sin prefijo)', () => {
    expect(idEn(VIAJE_ORIGINAL, '2027-01-14')).toBe('2027-01-14');
    expect(idEn('vroma1', '2027-05-01')).toBe('vroma1:2027-05-01');
    expect(idEn('vroma1', 'vroma1:2027-05-01')).toBe('vroma1:2027-05-01');
    expect(viajeDe('2027-01-14')).toBe(VIAJE_ORIGINAL);
    expect(viajeDe('vroma1:abc')).toBe('vroma1');
    expect(sinViaje('vroma1:2027-05-01')).toBe('2027-05-01');
    expect(sinViaje('presupuesto')).toBe('presupuesto');
  });

  it('la altura de Alba no es de ningún viaje', () => {
    expect(esDelViaje('alba', VIAJE_ORIGINAL)).toBe(false);
    expect(esDelViaje('presupuesto', VIAJE_ORIGINAL)).toBe(true);
    expect(esDelViaje('vroma1:presupuesto', VIAJE_ORIGINAL)).toBe(false);
    expect(esDelViaje('vroma1:presupuesto', 'vroma1')).toBe(true);
  });

  it('lo de Japón solo se ofrece en Japón', () => {
    expect(apartadosDe('IT').map((a) => a.id)).toEqual(['reservas', 'presupuesto', 'tiempo', 'album', 'frases']);
    expect(apartadosDe('JP')).toHaveLength(9);
    expect(apartadosPorDefecto('JP')).toContain('taxfree');
    expect(apartadosPorDefecto('IT')).not.toContain('parques');
  });

  it('título y bandera', () => {
    expect(tituloDelViaje('Japón')).toBe('Alba en Japón');
    expect(bandera('JP')).toBe('🇯🇵');
    expect(bandera('??')).toBe('✈️');
  });
});

describe('zonas horarias', () => {
  it('hora de reloj en una zona → instante', () => {
    expect(instanteEnZona('2027-01-14', '09:00', 'Asia/Tokyo').toISOString()).toBe('2027-01-14T00:00:00.000Z');
    expect(instanteEnZona('2027-01-11', '20:20', 'Europe/Madrid').toISOString()).toBe('2027-01-11T19:20:00.000Z');
    // Horario de verano en Madrid y en Nueva York.
    expect(instanteEnZona('2027-07-01', '12:00', 'Europe/Madrid').toISOString()).toBe('2027-07-01T10:00:00.000Z');
    expect(instanteEnZona('2027-07-01', '12:00', 'America/New_York').toISOString()).toBe('2027-07-01T16:00:00.000Z');
  });

  it('el día de salida va en hora de casa y el resto en la del destino', () => {
    const c = { ...CONFIG_POR_DEFECTO, inicio: '2027-07-01', fin: '2027-07-10', zona: 'America/New_York' };
    expect(instanteDe('2027-07-01', '10:00', c).toISOString()).toBe('2027-07-01T08:00:00.000Z');
    expect(instanteDe('2027-07-02', '10:00', c).toISOString()).toBe('2027-07-02T14:00:00.000Z');
  });
});

describe('ajustes de un viaje', () => {
  it('el de Japón guardado antes de haber varios viajes sigue siendo Japón con todo', () => {
    const c = leerConfig(JSON.stringify({ inicio: '2027-01-11', fin: '2027-02-02' }));
    expect(c.destino).toBe('Japón');
    expect(c.moneda).toBe('JPY');
    expect(c.zona).toBe('Asia/Tokyo');
    expect(c.apartados).toContain('parques');
  });

  it('uno nuevo guarda sus datos y descarta lo que no vale', () => {
    const c = leerConfig(
      JSON.stringify({ destino: 'Roma', pais: 'IT', moneda: 'eur', zona: 'Marte/Base', apartados: ['presupuesto', 'inventado'], color: 'rojo' }),
    );
    expect(c.destino).toBe('Roma');
    expect(c.pais).toBe('IT');
    expect(c.moneda).toBe('JPY'); // 'eur' no es un código válido
    expect(c.zona).toBe('Asia/Tokyo');
    expect(c.apartados).toEqual(['presupuesto']);
    expect(c.color).toBe(CONFIG_POR_DEFECTO.color);
  });

  it('sin apartados guardados, un viaje nuevo tiene los de su país', () => {
    expect(leerConfig(JSON.stringify({ destino: 'Roma', pais: 'IT' })).apartados).toEqual(['reservas', 'presupuesto', 'tiempo', 'album', 'frases']);
  });
});

describe('los datos de un viaje se relacionan', () => {
  it('la ciudad de un día sale del hotel si no tiene', async () => {
    const { ciudadDelDia } = await import('./viaje');
    const hoteles = [{ id: 'h', nombre: 'Hotel', ciudad: 'Roma', entrada: '2027-05-01', salida: '2027-05-04', estado: 'reservado' as const }];
    expect(ciudadDelDia('2027-05-02', undefined, hoteles)).toBe('Roma');
    expect(ciudadDelDia('2027-05-04', undefined, hoteles)).toBe('Roma'); // el día que se deja
    expect(ciudadDelDia('2027-05-02', { ciudad: 'Tívoli' }, hoteles)).toBe('Tívoli');
    expect(ciudadDelDia('2027-05-06', undefined, hoteles)).toBeUndefined();
  });

  it('una ciudad nueva se añade a las del viaje una sola vez', async () => {
    const { conCiudad } = await import('@/ui/ciudades');
    const c = { ...CONFIG_POR_DEFECTO, pais: 'IT', simbolo: '🇮🇹', ciudades: [] };
    const con = conCiudad(c, ' Roma ')!;
    expect(con.ciudades).toEqual([{ nombre: 'Roma', kanji: '🇮🇹', color: expect.any(String) }]);
    expect(conCiudad(con, 'roma')).toBeUndefined();
    expect(conCiudad(con, '  ')).toBeUndefined();
  });
});

describe('listas propias', () => {
  it('lee las listas sin fiarse y resume lo pendiente por moneda', async () => {
    const { leerListas, resumirLista } = await import('./listas');
    expect(leerListas([{ id: 'a', nombre: ' Compras ', icono: 'juegos' }, { id: 'a', nombre: 'otra' }, { id: 'b', nombre: '' }, { id: 'c', nombre: 'X', icono: '??' }])).toEqual([
      { id: 'a', nombre: 'Compras', icono: 'juegos', color: '#2d4b73' },
      { id: 'c', nombre: 'X', icono: 'lista', color: '#2d4b73' },
    ]);
    const e = (x: object) => ({ id: 'x', lista: 'a', nombre: 'x', hecho: false, orden: 0, ...x });
    const r = resumirLista([e({ precioMin: 3900, precioMax: 9500 }), e({ precioMin: 7980 }), e({ precioMin: 20, moneda: 'EUR' }), e({ precioMin: 100, hecho: true }), e({})], 'JPY');
    expect(r.pendientePorMoneda).toEqual({ JPY: [11880, 17480], EUR: [20, 20] });
    expect(r).toMatchObject({ total: 5, hechos: 1 });
  });
});

describe('hoteles y el itinerario', () => {
  const h = (id: string, entrada: string, salida: string) => ({ id, nombre: id, entrada, salida, estado: 'reservado' as const });
  it('llegada, salida y noche de cada día', async () => {
    const { hotelesDelDia, textoSinPlan } = await import('./viaje');
    const hoteles = [h('Roma Inn', '2027-05-01', '2027-05-03'), h('Firenze B&B', '2027-05-03', '2027-05-05')];
    expect(textoSinPlan(hotelesDelDia(hoteles, '2027-05-01'))).toBe('Llegada a Roma Inn');
    expect(textoSinPlan(hotelesDelDia(hoteles, '2027-05-02'))).toBe('Noche en Roma Inn');
    expect(textoSinPlan(hotelesDelDia(hoteles, '2027-05-03'))).toBe('Roma Inn → Firenze B&B');
    expect(textoSinPlan(hotelesDelDia(hoteles, '2027-05-05'))).toBe('Salida de Firenze B&B');
    expect(textoSinPlan(hotelesDelDia(hoteles, '2027-05-06'))).toBeUndefined();
  });

  it('un hotel fuera de las fechas propone ampliar el viaje', async () => {
    const { fechasParaIncluir } = await import('./viaje');
    const c = { ...CONFIG_POR_DEFECTO, inicio: '2027-05-01', fin: '2027-05-05', vueltaFecha: '2027-05-05' };
    expect(fechasParaIncluir(c, { entrada: '2027-05-02', salida: '2027-05-04' })).toBeUndefined();
    expect(fechasParaIncluir(c, { entrada: '2027-04-29', salida: '2027-05-07' })).toEqual({ inicio: '2027-04-29', fin: '2027-05-07', vueltaFecha: '2027-05-07' });
    expect(fechasParaIncluir(c, {})).toBeUndefined();
  });
});

describe('salida e idiomas', () => {
  it('la hora de casa sale de la ciudad de salida (Canarias, una hora menos)', async () => {
    const { zonaDeSalida } = await import('./idiomas');
    expect(zonaDeSalida('ES', 'Madrid', undefined)).toBe('Europe/Madrid');
    expect(zonaDeSalida('ES', 'Las Palmas de Gran Canaria', undefined)).toBe('Atlantic/Canary');
    expect(zonaDeSalida('PT', 'Lisboa', 'Europe/Lisbon')).toBe('Europe/Lisbon');
  });

  it('un viaje sin idiomas guardados traduce al idioma del país; Japón sigue igual', () => {
    expect(leerConfig(JSON.stringify({ destino: 'Roma', pais: 'IT' }))).toMatchObject({ idiomaOrigen: 'es', idiomaDestino: 'it', salida: { pais: 'ES', ciudad: 'Madrid' } });
    expect(leerConfig(undefined)).toMatchObject({ idiomaOrigen: 'es', idiomaDestino: 'ja' });
    expect(leerConfig(JSON.stringify({ idiomaDestino: 'klingon' })).idiomaDestino).toBe('ja');
  });
});

describe('ciudades de cada país', () => {
  it('todos los países de la lista tienen ciudades, sin repetir', async () => {
    const { ciudadesDelPais } = await import('./ciudadesPais');
    const { PAISES } = await import('./viajes');
    for (const p of PAISES) {
      const c = ciudadesDelPais(p.codigo);
      expect(c.length, p.nombre).toBeGreaterThan(0);
      expect(new Set(c).size, p.nombre).toBe(c.length);
    }
  });
});

describe('El viaje y los hoteles se sugieren fechas', () => {
  it('noches sin hotel, juntas por ciudad, sin la última ni la ciudad de salida', async () => {
    const { nochesSinHotel, nochesParaHotel } = await import('./viaje');
    const c = { ...CONFIG_POR_DEFECTO, inicio: '2027-05-01', fin: '2027-05-07' };
    const dias = [
      { fecha: '2027-05-01', ciudad: 'Madrid' },
      { fecha: '2027-05-02', ciudad: 'Roma' },
      { fecha: '2027-05-03', ciudad: 'Roma' },
      { fecha: '2027-05-04', ciudad: 'Florencia' },
      { fecha: '2027-05-05', ciudad: 'Florencia' },
    ];
    const hotel = { id: 'h', nombre: 'Firenze', ciudad: 'Florencia', entrada: '2027-05-05', salida: '2027-05-06', estado: 'reservado' as const };
    const b = nochesSinHotel(c, dias, [hotel]);
    expect(b).toEqual([
      { ciudad: 'Roma', entrada: '2027-05-02', salida: '2027-05-04' },
      { ciudad: 'Florencia', entrada: '2027-05-04', salida: '2027-05-05' },
      { ciudad: undefined, entrada: '2027-05-06', salida: '2027-05-07' },
    ]);
    expect(nochesParaHotel(b, 'roma')).toEqual([b[0]]);
    expect(nochesParaHotel(b, '')).toHaveLength(3);
  });
});
