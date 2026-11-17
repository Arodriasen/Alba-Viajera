import { avisosActivos, consejoDelDia, describirTiempo, lugarLegible, nosAfecta, shindo, type HoraTiempo, type Terremoto } from './clima';

describe('el tiempo', () => {
  it('traduce los códigos WMO', () => {
    expect(describirTiempo(0)).toEqual({ texto: 'Despejado', icono: 'sol' });
    expect(describirTiempo(3).icono).toBe('nublado');
    expect(describirTiempo(61).icono).toBe('lluvia');
    expect(describirTiempo(73).icono).toBe('nieve');
    expect(describirTiempo(95).icono).toBe('tormenta');
    expect(describirTiempo(0, false).icono).toBe('luna');
    expect(describirTiempo(2, false).icono).toBe('nubes_noche');
  });

  it('avisa de lluvia o nieve en las próximas horas (nieve antes que lluvia)', () => {
    const h = (iso: string, lluvia: number, codigo = 3): HoraTiempo => ({ hora: new Date(iso), deDia: true, temperatura: 8, lluvia, codigo });
    const desde = new Date('2027-01-14T00:00:00Z'); // 9:00 en Japón
    expect(consejoDelDia([h('2027-01-14T00:00:00Z', 10), h('2027-01-14T06:00:00Z', 70, 61)], desde)).toBe(
      'Lluvia probable hacia las 15:00: paraguas y el plástico del carrito.',
    );
    expect(consejoDelDia([h('2027-01-14T03:00:00Z', 70, 61), h('2027-01-14T04:00:00Z', 40, 73)], desde)).toContain('Nieve hacia las 13:00');
    expect(consejoDelDia([h('2027-01-14T03:00:00Z', 10)], desde)).toBeUndefined();
  });
});

describe('avisos de la JMA', () => {
  const areas = [
    { code: '090010', warnings: [{ code: '20', status: '解除' }] },
    { code: '090020', warnings: [{ code: '12', status: '発表' }, { code: '06', status: '継続' }, { code: '15', status: '解除' }] },
  ];

  it('solo los que están en vigor, los más graves primero', () => {
    expect(avisosActivos(areas, '090020').map((a) => [a.nombre, a.nivel])).toEqual([
      ['Nevada intensa', 'aviso'],
      ['Nevada', 'precaucion'],
    ]);
  });

  it('sin zona (o zona desconocida), mira toda la prefectura', () => {
    expect(avisosActivos(areas).length).toBe(2);
    expect(avisosActivos(areas, '999999').length).toBe(2);
    expect(avisosActivos([{ code: '090010', warnings: [{ code: '20', status: '解除' }] }], '090010')).toEqual([]);
  });
});

describe('terremotos', () => {
  const t: Terremoto = { id: 'x', hora: new Date(), lugar: '千葉県北西部', maxima: 40, tsunami: 'ninguno', prefecturas: { 東京都: 30, 千葉県: 40 } };

  it('lugares legibles', () => {
    expect(lugarLegible('石川県能登地方')).toEqual({ es: 'Ishikawa', ja: '石川県能登地方' });
    expect(lugarLegible('大阪府北部').es).toBe('Osaka');
    expect(lugarLegible('茨城県沖').es).toBe('Ibaraki (en el mar)');
    expect(lugarLegible('薩摩半島西方沖').es).toBe('En el mar');
    expect(lugarLegible('渡島地方東部').es).toBeUndefined();
  });

  it('escala shindo', () => {
    expect(shindo(40)).toBe('4');
    expect(shindo(45)).toBe('5−');
    expect(shindo(60)).toBe('6+');
  });

  it('nos afecta si se nota (≥3) en nuestras prefecturas', () => {
    expect(nosAfecta(t, ['東京都'])).toBe(true);
    expect(nosAfecta(t, ['大阪府'])).toBe(false);
    expect(nosAfecta(t, ['東京都'], 40)).toBe(false);
  });
});
