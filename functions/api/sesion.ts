import { json } from '../../server/http';
import type { Env } from '../env';

/**
 * GET → { salir }: la dirección para cerrar la sesión general de Cloudflare Access (la del equipo). El dominio
 * del equipo es un secreto del servidor; la ruta va detrás del middleware, como el resto de /api.
 */
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const dominio = env.ACCESS_TEAM_DOMAIN?.replace(/\/+$/, '');
  return json({ salir: dominio ? `${dominio}/cdn-cgi/access/logout` : null });
};
