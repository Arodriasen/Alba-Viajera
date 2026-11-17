import { CATEGORIAS_FRASES, FRASES_DE_SERIE, frasesDe, frasesDeSerie, leerFrasesPropias, porTraducir } from './frases';

describe('frases útiles', () => {
  it('todas las categorías tienen frases y los ids no se repiten', () => {
    for (const c of CATEGORIAS_FRASES) expect(frasesDe(c.id, []).length).toBeGreaterThan(5);
    const ids = FRASES_DE_SERIE.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('las vuestras van detrás de las de serie y se pueden editar', () => {
    const propias = leerFrasesPropias(JSON.stringify([{ id: 'p1', categoria: 'comer', es: 'Sin cebolla', ja: '玉ねぎ抜きで', romaji: 'tamanegi nuki de' }]));
    const lista = frasesDe('comer', propias);
    expect(lista.at(-1)).toMatchObject({ id: 'p1', propia: true });
    expect(lista[0].propia).toBeUndefined();
  });

  it('descarta lo que no vale', () => {
    expect(leerFrasesPropias('[{"id":"x","categoria":"nada","es":"a","ja":"b"}, 3]')).toEqual([]);
    expect(leerFrasesPropias('roto')).toEqual([]);
  });

  it('español → japonés no necesita traducción; otros idiomas, sí', () => {
    const japon = { pais: 'JP', idiomaOrigen: 'es', idiomaDestino: 'ja' };
    expect(porTraducir(japon)).toBeUndefined();
    expect(frasesDeSerie(japon)!.find((x) => x.id === 'basicas-nohablo')!.es).toBe('No hablo japonés');

    const italia = { pais: 'IT', idiomaOrigen: 'es', idiomaDestino: 'it' };
    const p = porTraducir(italia)!;
    expect(p.a).toBe('it');
    expect(p.textos.find((x) => x.id === 'basicas-nohablo')!.es).toBe('No hablo italiano');
    expect(p.textos.some((x) => x.id === 'basicas-taxfree')).toBe(false);
    expect(frasesDeSerie(italia)).toBeUndefined();
    const traducidas = frasesDeSerie(italia, { de: 'es', a: 'it', frases: { 'basicas-hola': { t: 'Ciao' } } })!;
    expect(traducidas).toEqual([expect.objectContaining({ id: 'basicas-hola', es: 'Hola', ja: 'Ciao', romaji: '' })]);
    // Una traducción a otro idioma no vale.
    expect(frasesDeSerie(italia, { de: 'es', a: 'fr', frases: {} })).toBeUndefined();
  });
});
