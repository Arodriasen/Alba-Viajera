import { openDB, type IDBPDatabase } from 'idb';

import { TABLAS, type AlmacenLocal, type FilaLocal, type FotoLocal, type Tabla } from './AlmacenLocal';

const NOMBRE = 'albaviajera';
/** 2: atracciones (parques con Alba). 3: gastos. 4: elementos (listas propias de cada viaje). 5: diario. */
const VERSION = 5;

export class AlmacenIndexedDb implements AlmacenLocal {
  private constructor(private readonly db: IDBPDatabase) {}

  static async abrir(): Promise<AlmacenIndexedDb> {
    const db = await openDB(NOMBRE, VERSION, {
      // Solo se crea lo que falte: así un móvil con la versión anterior conserva sus datos.
      upgrade(db, antes, _ahora, tx) {
        for (const t of TABLAS) if (!db.objectStoreNames.contains(t)) db.createObjectStore(t, { keyPath: 'id' });
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
        // Una tabla nueva: lo que el otro móvil ya hubiera creado en ella quedó "atrás" en la sincronización.
        // Se vuelve a pedir todo (lo pendiente de aquí no se pierde: gana si es más nuevo).
        if (antes > 0 && antes < VERSION) void tx.objectStore('meta').put(0, 'sync.desde');
        if (!db.objectStoreNames.contains('fotos')) db.createObjectStore('fotos', { keyPath: 'nombre' }).createIndex('estado', 'estado');
      },
    });
    // Que el navegador no borre los datos si anda justo de espacio (Safari los borra a los 7 días sin uso si no).
    navigator.storage?.persist?.().catch(() => undefined);
    return new AlmacenIndexedDb(db);
  }

  todas(tabla: Tabla): Promise<FilaLocal[]> {
    return this.db.getAll(tabla);
  }

  obtener(tabla: Tabla, id: string): Promise<FilaLocal | undefined> {
    return this.db.get(tabla, id);
  }

  async poner(tabla: Tabla, filas: FilaLocal[]): Promise<void> {
    if (!filas.length) return;
    const tx = this.db.transaction(tabla, 'readwrite');
    await Promise.all([...filas.map((f) => tx.store.put(f)), tx.done]);
  }

  leerMeta<T>(clave: string): Promise<T | undefined> {
    return this.db.get('meta', clave);
  }

  async escribirMeta(clave: string, valor: unknown): Promise<void> {
    await this.db.put('meta', valor, clave);
  }

  foto(nombre: string): Promise<FotoLocal | undefined> {
    return this.db.get('fotos', nombre);
  }

  async ponerFoto(foto: FotoLocal): Promise<void> {
    await this.db.put('fotos', foto);
  }

  async quitarFoto(nombre: string): Promise<void> {
    await this.db.delete('fotos', nombre);
  }

  async fotosPorSincronizar(): Promise<FotoLocal[]> {
    const [subir, borrar] = await Promise.all([
      this.db.getAllFromIndex('fotos', 'estado', 'subir'),
      this.db.getAllFromIndex('fotos', 'estado', 'borrar'),
    ]);
    return [...subir, ...borrar];
  }
}
