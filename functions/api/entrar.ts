import type { Env } from '../env';

/**
 * GET → vuelve a la app. Sirve para iniciar sesión desde la PWA: la página de la app sale de la caché del móvil
 * (service worker) y nunca pasa por Access; /api/* no se cachea, así que Access intercepta esta dirección, pide el
 * correo y el código, y al terminar la petición llega aquí (ya con sesión) y se vuelve al inicio.
 */
export const onRequestGet: PagesFunction<Env> = async ({ request }) => Response.redirect(new URL('/', request.url).toString(), 302);
