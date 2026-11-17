import { PeticionTraducir, traducir, type IaTraductora } from './traducir';

describe('traducir', () => {
  it('traduce de cinco en cinco y, si la IA no devuelve nada, deja el original', async () => {
    let llamadas = 0;
    const ia: IaTraductora = {
      async run(_m, e) {
        llamadas++;
        return e.text === 'raro' ? {} : { translated_text: ` ${e.target_lang}:${e.text} ` };
      },
    };
    const textos = ['Hola', 'Gracias', 'raro', 'a', 'b', 'c', 'd'];
    expect(await traducir(ia, 'es', 'it', textos)).toEqual(['it:Hola', 'it:Gracias', 'raro', 'it:a', 'it:b', 'it:c', 'it:d']);
    expect(llamadas).toBe(7);
    expect(await traducir(ia, 'es', 'es', ['Hola'])).toEqual(['Hola']);
  });

  it('valida la petición', () => {
    expect(PeticionTraducir.safeParse({ de: 'es', a: 'it', textos: ['Hola'] }).success).toBe(true);
    expect(PeticionTraducir.safeParse({ de: 'español', a: 'it', textos: ['Hola'] }).success).toBe(false);
    expect(PeticionTraducir.safeParse({ de: 'es', a: 'it', textos: [] }).success).toBe(false);
  });
});
