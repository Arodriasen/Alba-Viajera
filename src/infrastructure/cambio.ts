/**
 * Cambio euro → moneda del viaje (Banco Central Europeo, vía Frankfurter: gratis, sin clave, con CORS).
 * Se guarda en el móvil para tenerlo sin conexión. El BCE publica unas 30 monedas; para las demás no
 * hay cambio automático y se escribe a mano en cada gasto.
 */
export interface Cambio {
  moneda: string;
  /** 1 € = N (moneda) */
  porEuro: number;
  /** Día del cambio (AAAA-MM-DD). */
  fecha: string;
  /** true = es el último guardado (no se ha podido actualizar). */
  guardado: boolean;
}

const clave = (moneda: string) => `cambio-eur-${moneda.toLowerCase()}`;
/** Por si nunca se ha podido consultar (el yen de noviembre de 2026). */
const POR_DEFECTO: Record<string, Cambio> = { JPY: { moneda: 'JPY', porEuro: 175.78, fecha: '2026-11-16', guardado: true } };

export function ultimoCambio(moneda: string): Cambio | undefined {
  if (moneda === 'EUR') return { moneda, porEuro: 1, fecha: new Date().toISOString().slice(0, 10), guardado: false };
  try {
    const t = localStorage.getItem(clave(moneda));
    if (t) {
      const c = JSON.parse(t) as Partial<Cambio> & { yenesPorEuro?: number };
      // Lo guardado antes de haber varias monedas era solo el yen, con otro nombre.
      const porEuro = c.porEuro ?? c.yenesPorEuro;
      if (typeof porEuro === 'number' && porEuro > 0 && typeof c.fecha === 'string') return { moneda, porEuro, fecha: c.fecha, guardado: true };
    }
  } catch {
    // Sin almacenamiento: el de por defecto.
  }
  return POR_DEFECTO[moneda];
}

const enCurso = new Map<string, Promise<Cambio | undefined>>();

export function cambioDeHoy(moneda: string): Promise<Cambio | undefined> {
  if (moneda === 'EUR') return Promise.resolve(ultimoCambio(moneda));
  let p = enCurso.get(moneda);
  if (!p) {
    p = (async () => {
      try {
        const r = await fetch(`https://api.frankfurter.dev/v1/latest?base=EUR&symbols=${encodeURIComponent(moneda)}`);
        if (!r.ok) throw new Error(String(r.status));
        const j = (await r.json()) as { date: string; rates: Record<string, number> };
        const porEuro = j.rates[moneda];
        if (typeof porEuro !== 'number') throw new Error('Moneda sin cambio del BCE');
        const c: Cambio = { moneda, porEuro, fecha: j.date, guardado: false };
        try {
          localStorage.setItem(clave(moneda), JSON.stringify(c));
        } catch {
          // No se puede guardar: no pasa nada.
        }
        return c;
      } catch {
        return ultimoCambio(moneda);
      } finally {
        setTimeout(() => enCurso.delete(moneda), 30 * 60_000);
      }
    })();
    enCurso.set(moneda, p);
  }
  return p;
}
