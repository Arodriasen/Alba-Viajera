import { error, json } from '../../server/http';
import { ErrorPeticion, leerPeticion, sincronizar } from '../../server/sincronizacion';
import type { Env } from '../env';

/** POST { desde, cambios } → { hasta, quedan, cambios }. Ver server/sincronizacion.ts. */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return error('JSON no válido', 400);
  }
  try {
    const { desde, cambios } = leerPeticion(cuerpo);
    return json(await sincronizar(env.DB, desde, cambios));
  } catch (e) {
    if (e instanceof ErrorPeticion) return error(e.message, 400);
    throw e;
  }
};
