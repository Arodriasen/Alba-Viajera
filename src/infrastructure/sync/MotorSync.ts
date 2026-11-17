import { TABLAS, type AlmacenLocal, type FilaLocal, type Tabla, type Valor } from '../local/AlmacenLocal';

type FilaRemota = { id: string; actualizado: number; borrado: number; [c: string]: Valor };

export interface RespuestaSync {
  hasta: number;
  quedan: boolean;
  cambios: Partial<Record<Tabla, FilaRemota[]>>;
}

/** Lo que el motor necesita del servidor (en la app, fetch a /api; en los tests, el servidor en memoria). */
export interface ApiSync {
  sincronizar(desde: number, cambios: Partial<Record<Tabla, unknown[]>>): Promise<RespuestaSync>;
  subirFoto(nombre: string, blob: Blob): Promise<void>;
  borrarFoto(nombre: string): Promise<void>;
}

export const MAX_CAMBIOS_POR_PETICION = 500;
const META_DESDE = 'sync.desde';

export type EstadoSync =
  | { tipo: 'alDia'; ultima?: Date }
  | { tipo: 'sincronizando' }
  | { tipo: 'sinConexion'; pendientes: number }
  | { tipo: 'error'; mensaje: string; pendientes: number };

/** Lo que se sube de una fila: las borradas solo con id, momento y la marca. */
function aEnviar(f: FilaLocal): Record<string, Valor | boolean> {
  if (f.borrado) return { id: f.id, actualizado: f.actualizado, borrado: true };
  const { pendiente: _p, ...resto } = f;
  return resto;
}

/**
 * Sube lo pendiente y baja lo nuevo. Gana el cambio más reciente: lo que llega del servidor
 * sustituye a la copia local salvo que aquí haya un cambio sin subir aún más nuevo.
 */
export class MotorSync {
  private enCurso: Promise<void> | undefined;
  private otraVez = false;

  constructor(
    private readonly almacen: AlmacenLocal,
    private readonly api: ApiSync,
    private readonly alCambiar: () => void,
  ) {}

  /** Si ya hay una en marcha, se encadena otra al terminar (los cambios hechos mientras tanto no se pierden). */
  sincronizar(): Promise<void> {
    if (this.enCurso) {
      this.otraVez = true;
      return this.enCurso;
    }
    this.enCurso = (async () => {
      try {
        do {
          this.otraVez = false;
          await this.unaVez();
        } while (this.otraVez);
      } finally {
        this.enCurso = undefined;
      }
    })();
    return this.enCurso;
  }

  async pendientes(): Promise<number> {
    const filas = await Promise.all(TABLAS.map((t) => this.almacen.todas(t)));
    const fotos = await this.almacen.fotosPorSincronizar();
    return filas.flat().filter((f) => f.pendiente).length + fotos.length;
  }

  private async unaVez(): Promise<void> {
    // Primero las fotos: así, cuando el otro dispositivo reciba el día, su foto ya está.
    for (const foto of await this.almacen.fotosPorSincronizar()) {
      if (foto.estado === 'subir' && foto.blob) {
        await this.api.subirFoto(foto.nombre, foto.blob);
        await this.almacen.ponerFoto({ ...foto, estado: 'ok' });
      } else {
        await this.api.borrarFoto(foto.nombre);
        await this.almacen.quitarFoto(foto.nombre);
      }
    }

    let hayCambios = false;
    for (let vuelta = 0; vuelta < 1000; vuelta++) {
      const desde = (await this.almacen.leerMeta<number>(META_DESDE)) ?? 0;
      const cambios: Partial<Record<Tabla, unknown[]>> = {};
      let cupo = MAX_CAMBIOS_POR_PETICION;
      for (const t of TABLAS) {
        if (cupo === 0) break;
        const pendientes = (await this.almacen.todas(t)).filter((f) => f.pendiente).slice(0, cupo);
        if (pendientes.length) cambios[t] = pendientes.map(aEnviar);
        cupo -= pendientes.length;
      }
      const enviados = MAX_CAMBIOS_POR_PETICION - cupo;

      const r = await this.api.sincronizar(desde, cambios);
      if (await this.aplicar(r)) hayCambios = true;
      await this.almacen.escribirMeta(META_DESDE, r.hasta);

      // Seguir mientras el servidor tenga más o quede algo por subir (más de 500 cambios).
      if (!r.quedan && enviados < MAX_CAMBIOS_POR_PETICION) break;
    }
    await this.almacen.escribirMeta('sync.ultima', Date.now());
    if (hayCambios) this.alCambiar();
  }

  /** Devuelve si ha cambiado algo de lo que se ve. */
  private async aplicar(r: RespuestaSync): Promise<boolean> {
    let cambiado = false;
    for (const t of TABLAS) {
      const remotas = r.cambios[t] ?? [];
      const aGuardar: FilaLocal[] = [];
      for (const remota of remotas) {
        const local = await this.almacen.obtener(t, remota.id);
        // Un cambio de aquí aún sin subir y más nuevo que lo del servidor se queda.
        if (local?.pendiente && local.actualizado > remota.actualizado) continue;
        const nueva = { ...remota, borrado: remota.borrado ? 1 : 0, pendiente: 0 } as FilaLocal;
        if (!local || !mismosDatos(local, nueva)) cambiado = true;
        aGuardar.push(nueva);
      }
      await this.almacen.poner(t, aGuardar);
    }
    return cambiado;
  }
}

function mismosDatos(a: FilaLocal, b: FilaLocal): boolean {
  return a.actualizado === b.actualizado && a.borrado === b.borrado;
}
