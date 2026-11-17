import { z } from 'zod';

import { COLUMNAS, NOMBRES_TABLAS, validarFila, type Fila, type NombreTabla } from './tablas';

/** Lo que usamos de D1 (en los tests lo implementa sql.js). */
export interface BaseDatos {
  prepare(sql: string): Sentencia;
  batch<T = unknown>(sentencias: Sentencia[]): Promise<{ results: T[] }[]>;
}
export interface Sentencia {
  bind(...valores: unknown[]): Sentencia;
}

export const MAX_FILAS_POR_PETICION = 500;
/** Lo que se devuelve como mucho por tabla en cada respuesta; si hay más, `quedan` y se vuelve a pedir. */
export const MAX_FILAS_RESPUESTA = 500;
/** D1 admite textos de hasta 2 MB por parámetro: las filas se mandan en trozos de JSON más pequeños. */
const MAX_BYTES_TROZO = 900_000;

const Peticion = z.object({
  /** Última `version` que tiene el dispositivo (0 la primera vez). */
  desde: z.number().int().nonnegative(),
  cambios: z.partialRecord(z.enum(NOMBRES_TABLAS as [NombreTabla, ...NombreTabla[]]), z.array(z.unknown())).default({}),
});

export type Cambios = Partial<Record<NombreTabla, Fila[]>>;

export interface RespuestaSync {
  /** Guardar como `desde` para la próxima vez. */
  hasta: number;
  /** true si alguna tabla tenía más filas de las que caben: volver a llamar con el nuevo `desde`. */
  quedan: boolean;
  /**
   * Lo cambiado desde `desde` más el estado actual de cada fila enviada (aceptada o no: si el
   * servidor tenía una más reciente, el dispositivo recibe esa).
   */
  cambios: Record<NombreTabla, Fila[]>;
}

export class ErrorPeticion extends Error {}

export function leerPeticion(cuerpo: unknown): { desde: number; cambios: Cambios } {
  const p = Peticion.safeParse(cuerpo);
  if (!p.success) throw new ErrorPeticion('Petición de sincronización no válida');

  const total = Object.values(p.data.cambios).reduce((n, filas) => n + (filas?.length ?? 0), 0);
  if (total > MAX_FILAS_POR_PETICION) throw new ErrorPeticion(`Como mucho ${MAX_FILAS_POR_PETICION} cambios por petición`);

  const cambios: Cambios = {};
  for (const [tabla, filas] of Object.entries(p.data.cambios) as [NombreTabla, unknown[]][]) {
    try {
      cambios[tabla] = filas.map((f) => validarFila(tabla, f));
    } catch {
      throw new ErrorPeticion(`Hay una fila no válida en "${tabla}"`);
    }
  }
  return { desde: p.data.desde, cambios };
}

/** Parte las filas en trozos cuyo JSON no pase de MAX_BYTES_TROZO. */
function trocear(filas: Fila[]): string[] {
  const trozos: string[] = [];
  let actual: string[] = [];
  let bytes = 2;
  for (const f of filas) {
    const j = JSON.stringify(f);
    if (actual.length && bytes + j.length + 1 > MAX_BYTES_TROZO) {
      trozos.push(`[${actual.join(',')}]`);
      actual = [];
      bytes = 2;
    }
    actual.push(j);
    bytes += j.length + 1;
  }
  if (actual.length) trozos.push(`[${actual.join(',')}]`);
  return trozos;
}

/**
 * Un único INSERT por trozo con las filas como JSON (`json_each`): D1 gratis admite 50 consultas
 * por petición y 100 parámetros por consulta, así que una consulta por fila no serviría.
 */
function upserts(db: BaseDatos, tabla: NombreTabla, filas: Fila[]): Sentencia[] {
  const columnas = ['id', ...COLUMNAS[tabla], 'actualizado', 'borrado'];
  const valores = columnas.map((c) => `json_extract(value, '$.${c}')`).join(', ');
  const asignaciones = [...COLUMNAS[tabla], 'actualizado', 'borrado', 'version'].map((c) => `${c} = excluded.${c}`).join(', ');
  // Gana el cambio más reciente; con el mismo instante se queda lo que ya había.
  // (El "WHERE true" lo pide SQLite para distinguir el ON CONFLICT de un JOIN.)
  const sql =
    `INSERT INTO ${tabla} (${columnas.join(', ')}, version) ` +
    `SELECT ${valores}, (SELECT valor FROM contador WHERE id = 1) FROM json_each(?) WHERE true ` +
    `ON CONFLICT (id) DO UPDATE SET ${asignaciones} WHERE excluded.actualizado > ${tabla}.actualizado`;
  return trocear(filas).map((json) => db.prepare(sql).bind(json));
}

/**
 * Aplica los cambios del dispositivo y le devuelve lo cambiado desde `desde`. Todo en un único
 * lote de D1, que es una transacción: nadie puede colarse entre la escritura y la lectura.
 */
export async function sincronizar(db: BaseDatos, desde: number, cambios: Cambios): Promise<RespuestaSync> {
  const escrituras = NOMBRES_TABLAS.flatMap((t) => (cambios[t]?.length ? upserts(db, t, cambios[t]) : []));
  const enviadas = NOMBRES_TABLAS.filter((t) => cambios[t]?.length);
  const sentencias = [
    // Todas las filas de esta petición comparten versión nueva.
    ...(escrituras.length ? [db.prepare('UPDATE contador SET valor = valor + 1 WHERE id = 1'), ...escrituras] : []),
    db.prepare('SELECT valor FROM contador WHERE id = 1'),
    ...NOMBRES_TABLAS.map((t) =>
      db.prepare(`SELECT * FROM ${t} WHERE version > ? ORDER BY version LIMIT ?`).bind(desde, MAX_FILAS_RESPUESTA + 1),
    ),
    ...enviadas.map((t) =>
      db.prepare(`SELECT * FROM ${t} WHERE id IN (SELECT value FROM json_each(?))`).bind(JSON.stringify(cambios[t]!.map((f) => f.id))),
    ),
  ];

  const resultados = await db.batch<Fila>(sentencias);
  const lecturas = resultados.slice(escrituras.length ? escrituras.length + 1 : 0);
  const contador = Number(lecturas[0].results[0]?.valor ?? 0);
  const porVersion = lecturas.slice(1, 1 + NOMBRES_TABLAS.length);
  const actuales = lecturas.slice(1 + NOMBRES_TABLAS.length);

  let quedan = false;
  let hasta = contador;
  const salida = {} as Record<NombreTabla, Fila[]>;
  NOMBRES_TABLAS.forEach((t, i) => {
    let filas = porVersion[i].results;
    if (filas.length > MAX_FILAS_RESPUESTA) {
      // Cortar por una versión completa. Si la fila que sobra es de la misma versión que la última
      // que cabe, esa versión queda para la siguiente llamada. Como una petición escribe como mucho
      // MAX_FILAS_POR_PETICION filas, siempre se avanza al menos una versión.
      const sobrante = Number(filas[MAX_FILAS_RESPUESTA].version);
      filas = filas.slice(0, MAX_FILAS_RESPUESTA);
      const ultima = Number(filas[filas.length - 1].version);
      hasta = Math.min(hasta, sobrante === ultima ? ultima - 1 : ultima);
      quedan = true;
    }
    salida[t] = filas;
  });

  if (quedan) {
    // Con el corte, solo se entregan las versiones <= hasta; el resto llegará en la siguiente llamada.
    for (const t of NOMBRES_TABLAS) salida[t] = salida[t].filter((f) => Number(f.version) <= hasta);
  }
  enviadas.forEach((t, i) => {
    const ya = new Set(salida[t].map((f) => f.id));
    salida[t] = [...salida[t], ...actuales[i].results.filter((f) => !ya.has(f.id))];
  });
  for (const t of NOMBRES_TABLAS) salida[t] = salida[t].map(({ version: _v, ...resto }) => resto);

  return { hasta, quedan, cambios: salida };
}
