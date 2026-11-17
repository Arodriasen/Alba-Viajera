import { borrarFoto, guardarFoto, leerFoto, MAX_BYTES_FOTO, nombreValido, tipoValido } from '../../../server/fotos';
import { error } from '../../../server/http';
import type { Env } from '../../env';

type Ctx = EventContext<Env, 'nombre', Record<string, unknown>>;

function nombre(ctx: Ctx): string | undefined {
  const n = String(ctx.params.nombre);
  return nombreValido(n) ? n : undefined;
}

export const onRequestGet = async (ctx: Ctx) => {
  const n = nombre(ctx);
  if (!n) return error('Nombre de foto no válido', 400);
  const foto = await leerFoto(ctx.env.DB, n);
  if (!foto) return error('No existe', 404);
  // El contenido de un nombre nunca cambia: el navegador puede guardarla para siempre.
  return new Response(foto.datos, {
    headers: { 'Content-Type': foto.tipo, 'Cache-Control': 'private, max-age=31536000, immutable' },
  });
};

export const onRequestPut = async (ctx: Ctx) => {
  const n = nombre(ctx);
  if (!n) return error('Nombre de foto no válido', 400);
  const tipo = ctx.request.headers.get('Content-Type');
  if (!tipoValido(tipo)) return error('Solo fotos JPEG, WebP o PNG', 415);
  const datos = await ctx.request.arrayBuffer();
  if (datos.byteLength === 0) return error('Foto vacía', 400);
  if (datos.byteLength > MAX_BYTES_FOTO) return error('La foto pesa demasiado', 413);
  await guardarFoto(ctx.env.DB, n, tipo, datos, Date.now());
  return new Response(null, { status: 204 });
};

export const onRequestDelete = async (ctx: Ctx) => {
  const n = nombre(ctx);
  if (!n) return error('Nombre de foto no válido', 400);
  await borrarFoto(ctx.env.DB, n);
  return new Response(null, { status: 204 });
};
