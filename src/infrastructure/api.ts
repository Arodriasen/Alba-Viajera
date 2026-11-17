import type { ApiSync, RespuestaSync } from './sync/MotorSync';

/** No hay red o el servidor no responde: la app sigue con la copia local. */
export class SinConexion extends Error {
  constructor() {
    super('Sin conexión');
  }
}

/** Access ha caducado la sesión: hay que recargar para volver a entrar. */
export class SesionCaducada extends Error {
  constructor() {
    super('La sesión ha caducado');
  }
}

async function pedir(ruta: string, opciones: RequestInit = {}): Promise<Response> {
  let r: Response;
  try {
    // redirect: 'manual' → si Access pide volver a entrar no seguimos su redirección a la página de login.
    r = await fetch(`/api/${ruta}`, { ...opciones, redirect: 'manual', credentials: 'same-origin' });
  } catch {
    throw new SinConexion();
  }
  if (r.type === 'opaqueredirect' || r.status === 401 || r.status === 403) throw new SesionCaducada();
  if (r.status === 502 || r.status === 503 || r.status === 504) throw new SinConexion();
  return r;
}

async function json<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const r = await pedir(ruta, opciones);
  const cuerpo = (await r.json().catch(() => undefined)) as (T & { error?: string }) | undefined;
  if (!r.ok) throw new Error(cuerpo?.error ?? `Error ${r.status}`);
  return cuerpo as T;
}

export const apiSync: ApiSync = {
  sincronizar: (desde, cambios) =>
    json<RespuestaSync>('sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ desde, cambios }),
    }),

  async subirFoto(nombre, blob) {
    const r = await pedir(`fotos/${encodeURIComponent(nombre)}`, {
      method: 'PUT',
      headers: { 'Content-Type': blob.type || 'image/jpeg' },
      body: blob,
    });
    // Una foto que el servidor no acepta (demasiado grande...) no debe atascar la sincronización.
    if (!r.ok && r.status >= 500) throw new Error(`No se ha podido subir la foto (${r.status})`);
  },

  async borrarFoto(nombre) {
    const r = await pedir(`fotos/${encodeURIComponent(nombre)}`, { method: 'DELETE' });
    if (!r.ok && r.status >= 500) throw new Error(`No se ha podido borrar la foto (${r.status})`);
  },
};

export async function descargarFoto(nombre: string): Promise<Blob | undefined> {
  const r = await pedir(`fotos/${encodeURIComponent(nombre)}`);
  return r.ok ? r.blob() : undefined;
}

/** Traduce textos con la IA de Cloudflare (ver server/traducir.ts). */
export async function traducirTextos(de: string, a: string, textos: string[]): Promise<string[]> {
  const r = await json<{ textos: string[] }>('traducir', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ de, a, textos }),
  });
  return r.textos;
}
