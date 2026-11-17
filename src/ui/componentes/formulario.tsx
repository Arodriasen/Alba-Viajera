import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Guarda solo, sin botón: un rato después de dejar de escribir y, si se sale de la pantalla antes,
 * al salir. Compara por contenido (JSON), así no guarda lo que no ha cambiado.
 */
export function useGuardadoSolo<T>(valor: T | undefined, guardar: (v: T) => Promise<void> | void, ms = 700) {
  const guardarRef = useRef(guardar);
  guardarRef.current = guardar;
  const guardado = useRef<string | undefined>(undefined);
  const pendiente = useRef<T | undefined>(undefined);
  const clave = valor === undefined ? undefined : JSON.stringify(valor);

  useEffect(() => {
    if (valor === undefined || clave === undefined) return;
    // Lo primero que llega es lo que ya estaba guardado.
    if (guardado.current === undefined) {
      guardado.current = clave;
      return;
    }
    if (clave === guardado.current) return;
    pendiente.current = valor;
    const t = setTimeout(() => {
      guardado.current = clave;
      pendiente.current = undefined;
      void guardarRef.current(valor);
    }, ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  useEffect(
    () => () => {
      if (pendiente.current !== undefined) void guardarRef.current(pendiente.current);
    },
    [],
  );
}

export function Campo({ etiqueta, ayuda, children }: { etiqueta: string; ayuda?: string; children: ReactNode }) {
  return (
    <label className="campo">
      <span>{etiqueta}</span>
      {children}
      {ayuda && <small>{ayuda}</small>}
    </label>
  );
}

export function Opciones<T extends string>({
  valor,
  opciones,
  alCambiar,
}: {
  valor: T;
  opciones: { valor: T; texto: string }[];
  alCambiar: (v: T) => void;
}) {
  return (
    <div className="opciones" role="radiogroup">
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="radio"
          aria-checked={valor === o.valor}
          className={`opcion ${valor === o.valor ? 'activa' : ''}`}
          onClick={() => alCambiar(o.valor)}
        >
          {o.texto}
        </button>
      ))}
    </div>
  );
}

/** Pide confirmación antes de borrar (sin ventanas propias: la del sistema basta). */
export function confirmarBorrado(que: string): boolean {
  return window.confirm(`¿Borrar ${que}? Se borrará también en el otro móvil.`);
}

/** Un Date ↔ el valor de <input type="datetime-local"> en la hora del móvil. */
export function aFechaHoraLocal(d: Date | undefined): string {
  if (!d) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function deFechaHoraLocal(v: string): Date | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}
