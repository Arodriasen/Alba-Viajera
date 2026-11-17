import { z } from 'zod';

/**
 * Traducción con la IA de Cloudflare (Workers AI, modelo m2m100: gratis dentro del cupo diario). Se usa
 * para las frases útiles: las de serie una vez por viaje (se guardan) y las vuestras al pulsar "Traducir".
 */
export const MODELO_TRADUCCION = '@cf/meta/m2m100-1.2b';

/** Lo que usamos de Workers AI (en los tests, uno falso). */
export interface IaTraductora {
  run(modelo: string, entrada: { text: string; source_lang: string; target_lang: string }): Promise<{ translated_text?: string }>;
}

const idioma = z.string().regex(/^[a-z]{2}$/);
export const PeticionTraducir = z.object({
  de: idioma,
  a: idioma,
  textos: z.array(z.string().min(1).max(500)).min(1).max(60),
});

/** De cinco en cinco, para no pasarse con las peticiones simultáneas. */
export async function traducir(ia: IaTraductora, de: string, a: string, textos: string[]): Promise<string[]> {
  if (de === a) return textos;
  const salida: string[] = [];
  for (let i = 0; i < textos.length; i += 5) {
    const trozo = textos.slice(i, i + 5);
    const r = await Promise.all(trozo.map((text) => ia.run(MODELO_TRADUCCION, { text, source_lang: de, target_lang: a })));
    salida.push(...r.map((x, j) => x.translated_text?.trim() || trozo[j]));
  }
  return salida;
}
