/**
 * Copia local de los datos (IndexedDB en la app, memoria en los tests). Las filas tienen el mismo
 * formato que en el servidor, más `pendiente` (falta subirla).
 */

export type Tabla = 'dias' | 'alojamientos' | 'reservas' | 'trayectos' | 'atracciones' | 'gastos' | 'ajustes' | 'elementos';
export const TABLAS: Tabla[] = ['dias', 'alojamientos', 'reservas', 'trayectos', 'atracciones', 'gastos', 'ajustes', 'elementos'];

export type Valor = string | number | null;

export interface FilaLocal {
  id: string;
  actualizado: number;
  borrado: 0 | 1;
  pendiente: 0 | 1;
  [columna: string]: Valor;
}

/** Foto en el dispositivo: `subir` (nueva), `ok` (ya está en el servidor) o `borrar` (falta borrarla allí). */
export interface FotoLocal {
  nombre: string;
  estado: 'subir' | 'ok' | 'borrar';
  blob?: Blob;
}

export interface AlmacenLocal {
  /** Todas, también las borradas. */
  todas(tabla: Tabla): Promise<FilaLocal[]>;
  obtener(tabla: Tabla, id: string): Promise<FilaLocal | undefined>;
  poner(tabla: Tabla, filas: FilaLocal[]): Promise<void>;

  leerMeta<T>(clave: string): Promise<T | undefined>;
  escribirMeta(clave: string, valor: unknown): Promise<void>;

  foto(nombre: string): Promise<FotoLocal | undefined>;
  ponerFoto(foto: FotoLocal): Promise<void>;
  quitarFoto(nombre: string): Promise<void>;
  fotosPorSincronizar(): Promise<FotoLocal[]>;
}

export class AlmacenMemoria implements AlmacenLocal {
  private datos = new Map<Tabla, Map<string, FilaLocal>>(TABLAS.map((t) => [t, new Map()]));
  private meta = new Map<string, unknown>();
  private fotos = new Map<string, FotoLocal>();

  async todas(tabla: Tabla) {
    return [...this.datos.get(tabla)!.values()].map((f) => ({ ...f }));
  }
  async obtener(tabla: Tabla, id: string) {
    const f = this.datos.get(tabla)!.get(id);
    return f && { ...f };
  }
  async poner(tabla: Tabla, filas: FilaLocal[]) {
    for (const f of filas) this.datos.get(tabla)!.set(f.id, { ...f });
  }
  async leerMeta<T>(clave: string) {
    return this.meta.get(clave) as T | undefined;
  }
  async escribirMeta(clave: string, valor: unknown) {
    this.meta.set(clave, valor);
  }
  async foto(nombre: string) {
    return this.fotos.get(nombre);
  }
  async ponerFoto(foto: FotoLocal) {
    this.fotos.set(foto.nombre, foto);
  }
  async quitarFoto(nombre: string) {
    this.fotos.delete(nombre);
  }
  async fotosPorSincronizar() {
    return [...this.fotos.values()].filter((f) => f.estado !== 'ok');
  }
}
