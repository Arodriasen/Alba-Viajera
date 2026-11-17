import type { EnvAcceso } from '../server/acceso';

export interface Env extends EnvAcceso {
  DB: D1Database;
  /** Workers AI (traducción de las frases). */
  AI: Ai;
}
