import type { BaseDatos } from './sincronizacion';

/** Las fotos se comprimen en el dispositivo (~300 KB); D1 admite hasta 2 MB por fila. */
export const MAX_BYTES_FOTO = 1024 * 1024;
const TIPOS = new Set(['image/jpeg', 'image/webp', 'image/png']);
/** Los nombres los genera el dispositivo (uuid + extensión) y nunca cambian de contenido. */
const NOMBRE = /^[A-Za-z0-9-]{8,64}\.(jpg|jpeg|webp|png)$/;

export function nombreValido(nombre: string): boolean {
  return NOMBRE.test(nombre);
}

export function tipoValido(tipo: string | null): tipo is string {
  return tipo !== null && TIPOS.has(tipo.split(';')[0].trim());
}

export async function guardarFoto(db: BaseDatos, nombre: string, tipo: string, datos: ArrayBuffer, ahora: number) {
  // Mismo nombre = misma foto: si ya estaba (reintento), no se toca.
  await db.batch([
    db
      .prepare('INSERT INTO fotos (nombre, tipo, datos, creada) VALUES (?, ?, ?, ?) ON CONFLICT (nombre) DO NOTHING')
      .bind(nombre, tipo.split(';')[0].trim(), datos, ahora),
  ]);
}

export async function leerFoto(db: BaseDatos, nombre: string): Promise<{ tipo: string; datos: ArrayBuffer } | undefined> {
  const [r] = await db.batch<{ tipo: string; datos: ArrayBuffer | Uint8Array | number[] }>([
    db.prepare('SELECT tipo, datos FROM fotos WHERE nombre = ?').bind(nombre),
  ]);
  const fila = r.results[0];
  if (!fila) return undefined;
  const bytes = fila.datos instanceof ArrayBuffer ? new Uint8Array(fila.datos) : Uint8Array.from(fila.datos);
  return { tipo: fila.tipo, datos: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer };
}

export async function borrarFoto(db: BaseDatos, nombre: string) {
  await db.batch([db.prepare('DELETE FROM fotos WHERE nombre = ?').bind(nombre)]);
}
