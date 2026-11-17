import { error, json } from '../../server/http';
import { PeticionTraducir, traducir } from '../../server/traducir';
import type { Env } from '../env';

/** POST { de, a, textos } → { textos }. Ver server/traducir.ts. */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return error('JSON no válido', 400);
  }
  const p = PeticionTraducir.safeParse(cuerpo);
  if (!p.success) return error('Petición de traducción no válida', 400);
  try {
    return json({ textos: await traducir(env.AI, p.data.de, p.data.a, p.data.textos) });
  } catch (e) {
    console.error(e);
    return error('No se ha podido traducir ahora', 502);
  }
};
