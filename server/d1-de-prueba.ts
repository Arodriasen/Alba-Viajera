import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import initSqlJs, { type Database } from 'sql.js';

import type { BaseDatos, Sentencia } from './sincronizacion';

class SentenciaSqlJs implements Sentencia {
  valores: unknown[] = [];
  constructor(readonly sql: string) {}
  bind(...valores: unknown[]) {
    const s = new SentenciaSqlJs(this.sql);
    s.valores = valores.map((v) => (v instanceof ArrayBuffer ? new Uint8Array(v) : v));
    return s;
  }
}

/** D1 en memoria (sql.js) con las migraciones del proyecto aplicadas. `batch` es una transacción, como en D1. */
export class D1DePrueba implements BaseDatos {
  /** Sentencias del último lote (D1 gratis admite 50 consultas por petición). */
  ultimoLote = 0;

  private constructor(readonly db: Database) {}

  static async crear(): Promise<D1DePrueba> {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    const carpeta = join(import.meta.dirname, '..', 'migrations');
    for (const f of readdirSync(carpeta).sort()) db.exec(readFileSync(join(carpeta, f), 'utf8'));
    return new D1DePrueba(db);
  }

  prepare(sql: string) {
    return new SentenciaSqlJs(sql);
  }

  async batch<T>(sentencias: Sentencia[]): Promise<{ results: T[] }[]> {
    this.ultimoLote = sentencias.length;
    this.db.exec('BEGIN');
    try {
      const salida = sentencias.map((s) => {
        const { sql, valores } = s as SentenciaSqlJs;
        const st = this.db.prepare(sql);
        st.bind(valores as never);
        const results: T[] = [];
        while (st.step()) results.push(st.getAsObject() as T);
        st.free();
        return { results };
      });
      this.db.exec('COMMIT');
      return salida;
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }
}
