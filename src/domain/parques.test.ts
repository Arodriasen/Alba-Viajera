import { aptitud, delParque, emparejar, parqueDelDia, resumen, type Atraccion } from './parques';

const a = (id: string, extra: Partial<Atraccion> = {}): Atraccion => ({
  id,
  parque: 'usj',
  nombre: id,
  tipo: 'atraccion',
  cerrada: false,
  imprescindible: false,
  unica: false,
  hecha: false,
  orden: 1,
  ...extra,
});

describe('parques con Alba', () => {
  it('sin altura mínima, Alba puede', () => {
    expect(aptitud(a('kitty'), 87)).toBe('puede');
  });

  it('si no llega, Rider Swap; si llega justo, puede', () => {
    expect(aptitud(a('yoshi', { alturaMin: 92 }), 87)).toBe('swap');
    expect(aptitud(a('yoshi', { alturaMin: 92 }), 92)).toBe('puede');
  });

  it('las cerradas no cuentan', () => {
    const lista = [a('kitty'), a('yoshi', { alturaMin: 92 }), a('cerrada', { cerrada: true }), a('hecha', { hecha: true })];
    expect(aptitud(lista[2], 120)).toBe('cerrada');
    expect(resumen(lista, 87)).toEqual({ abiertas: 3, puede: 2, hechas: 1 });
  });

  it('imprescindibles primero, luego el orden de la guía', () => {
    const lista = delParque([a('b', { orden: 1 }), a('c', { orden: 2, imprescindible: true }), a('tdl', { parque: 'tdl' })], 'usj');
    expect(lista.map((x) => x.id)).toEqual(['c', 'b']);
  });

  it('sabe qué día es de parque', () => {
    expect(parqueDelDia('2027-01-14')?.id).toBe('tdl');
    expect(parqueDelDia('2027-01-20')?.id).toBe('tds');
    expect(parqueDelDia('2027-01-25')?.id).toBe('usj');
    expect(parqueDelDia('2027-01-15')).toBeUndefined();
  });
});

describe('emparejar con los nombres en directo', () => {
  // Nombres tal cual los da ThemeParks.wiki.
  const api = [
    '“it\'s a small world”',
    'The Enchanted Tiki Room: Stitch Presents “Aloha E Komo Mai!”',
    'Star Tours: The Adventures Continue',
    'Despicable Me: Minion Mayhem',
    'Illumination’s Villain-Con Minion Blast',
    'Mine Cart Madness™',
    'Yoshi\'s Adventure™',
    'Indiana Jones Adventure®: Temple of the Crystal Skull',
    'Jungle Cruise: Wildlife Expeditions',
    'Haunted Mansion “Holiday Nightmare”',
  ].map((nombre) => ({ nombre }));
  const casos: [string, string | undefined][] = [
    ["It's a Small World", '“it\'s a small world”'],
    ['The Enchanted Tiki Room: Stitch Presents', 'The Enchanted Tiki Room: Stitch Presents “Aloha E Komo Mai!”'],
    ['Star Tours', 'Star Tours: The Adventures Continue'],
    ['Despicable Me Minion Mayhem', 'Despicable Me: Minion Mayhem'],
    ['Villain-Con Minion Blast', 'Illumination’s Villain-Con Minion Blast'],
    ['Mine-Cart Madness (Donkey Kong)', 'Mine Cart Madness™'],
    ["Yoshi's Adventure", "Yoshi's Adventure™"],
    ['Indiana Jones Adventure', 'Indiana Jones Adventure®: Temple of the Crystal Skull'],
    ['Jungle Cruise', 'Jungle Cruise: Wildlife Expeditions'],
    ['Haunted Mansion', 'Haunted Mansion “Holiday Nightmare”'],
    ['Pooh\'s Hunny Hunt', undefined],
  ];
  it.each(casos)('%s', (nuestro, suyo) => {
    expect(emparejar(nuestro, api)?.nombre).toBe(suyo);
  });
});
