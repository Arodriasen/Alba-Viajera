import type { ViajeRepositorio } from '@/domain/ViajeRepositorio';
import type { Fecha } from '@/domain/viaje';

import { descargarFoto } from '../api';
import type { AlmacenLocal } from '../local/AlmacenLocal';

/**
 * Fotos de recuerdo: más grandes que las de Tocador, pero por debajo del límite del servidor (1 MB).
 * Una por día durante 23 días: ~12 MB en D1, nada para los 5 GB gratis.
 */
const LADO_MAXIMO = 1920;
const BYTES_OBJETIVO = 550 * 1024;

export async function comprimir(origen: Blob): Promise<Blob> {
  // Pasar por el canvas también convierte las HEIC del iPhone y respeta la orientación EXIF.
  const bitmap = await createImageBitmap(origen, { imageOrientation: 'from-image' });
  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
  let ancho = Math.round(bitmap.width * escala);
  let alto = Math.round(bitmap.height * escala);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  let resultado: Blob | undefined;
  for (let intento = 0; intento < 6; intento++) {
    canvas.width = ancho;
    canvas.height = alto;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, ancho, alto);
    ctx.drawImage(bitmap, 0, 0, ancho, alto);
    for (const calidad of [0.85, 0.75, 0.65]) {
      resultado = await new Promise<Blob>((ok, mal) =>
        canvas.toBlob((b) => (b ? ok(b) : mal(new Error('No se ha podido preparar la foto'))), 'image/jpeg', calidad),
      );
      if (resultado.size <= BYTES_OBJETIVO) break;
    }
    if (resultado!.size <= BYTES_OBJETIVO) break;
    ancho = Math.round(ancho * 0.8);
    alto = Math.round(alto * 0.8);
  }
  bitmap.close();
  return resultado!;
}

/**
 * La foto de cada día: en IndexedDB (para verla sin conexión) y en el servidor. Cada foto tiene un
 * nombre nuevo (uuid), así que un nombre nunca cambia de contenido; cambiarla = otra foto nueva.
 */
export class FotosDelDia {
  private readonly urls = new Map<string, string>();
  private readonly descargando = new Map<string, Promise<string | undefined>>();

  constructor(
    private readonly almacen: AlmacenLocal,
    private readonly viaje: ViajeRepositorio,
    private readonly alCambiar: () => void,
  ) {}

  /** Pone (o cambia) la foto del día. */
  async poner(fecha: Fecha, archivo: Blob): Promise<void> {
    const blob = await comprimir(archivo);
    const nombre = `${crypto.randomUUID()}.jpg`;
    // Primero la foto: el motor la sube antes que el día, así al otro móvil le llega ya con ella.
    await this.almacen.ponerFoto({ nombre, estado: 'subir', blob });
    this.urls.set(nombre, URL.createObjectURL(blob));
    const dia = await this.viaje.dia(fecha);
    const anterior = dia?.foto;
    await this.viaje.guardarDia(dia ? { ...dia, foto: nombre } : { fecha, titulo: 'Día libre', plan: [], foto: nombre });
    if (anterior) await this.olvidar(anterior);
  }

  async quitar(fecha: Fecha): Promise<void> {
    const dia = await this.viaje.dia(fecha);
    if (!dia?.foto) return;
    const nombre = dia.foto;
    await this.viaje.guardarDia({ ...dia, foto: undefined });
    await this.olvidar(nombre);
  }

  /** Quita la foto de este móvil y, si ya estaba subida, también del servidor. */
  async olvidar(nombre: string) {
    const foto = await this.almacen.foto(nombre);
    // Si aún no se había subido, basta con olvidarla; si no, hay que borrarla también del servidor.
    if (foto?.estado === 'subir') await this.almacen.quitarFoto(nombre);
    else await this.almacen.ponerFoto({ nombre, estado: 'borrar' });
    const url = this.urls.get(nombre);
    if (url) URL.revokeObjectURL(url);
    this.urls.delete(nombre);
    this.alCambiar();
  }

  /** URL para un <img>: de la copia local o, si no está (la hizo el otro móvil), se descarga y se guarda. */
  url(nombre: string): Promise<string | undefined> {
    const ya = this.urls.get(nombre);
    if (ya) return Promise.resolve(ya);
    let p = this.descargando.get(nombre);
    if (!p) {
      p = this.cargar(nombre).finally(() => this.descargando.delete(nombre));
      this.descargando.set(nombre, p);
    }
    return p;
  }

  private async cargar(nombre: string): Promise<string | undefined> {
    let foto = await this.almacen.foto(nombre);
    if (!foto?.blob) {
      const blob = await descargarFoto(nombre).catch(() => undefined);
      if (!blob) return undefined;
      foto = { nombre, estado: 'ok', blob };
      await this.almacen.ponerFoto(foto);
    }
    const url = URL.createObjectURL(foto.blob!);
    this.urls.set(nombre, url);
    return url;
  }
}
