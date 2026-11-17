import { verificarAcceso } from '../../server/acceso';
import { error } from '../../server/http';
import type { Env } from '../env';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  if (!(await verificarAcceso(ctx.request, ctx.env))) return error('Sin acceso', 403);
  try {
    return await ctx.next();
  } catch (e) {
    console.error(e);
    return error('Error en el servidor', 500);
  }
};
