import { useEffect, useRef, useState } from 'react';

import { Icono } from './Icono';

/** 'AAAA-MM-DD' → 'DD/MM/AAAA'. */
const aTexto = (iso: string | undefined) => (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '');

/** Lo escrito (solo cifras cuentan) → 'DD/MM/AAAA' a medida que se escribe. */
export function formatearEscrito(t: string): string {
  const d = t.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** 'DD/MM/AAAA' (o con año de 2 cifras) → 'AAAA-MM-DD' si es una fecha que existe. */
export function leerEscrito(t: string): string | undefined {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(t.trim());
  if (!m) return undefined;
  const [dia, mes] = [Number(m[1]), Number(m[2])];
  const anio = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  const f = new Date(Date.UTC(anio, mes - 1, dia));
  if (f.getUTCFullYear() !== anio || f.getUTCMonth() !== mes - 1 || f.getUTCDate() !== dia) return undefined;
  return f.toISOString().slice(0, 10);
}

/**
 * Fecha que se puede escribir con el teclado (del ordenador o del móvil: se ponen solas las barras)
 * o elegir en el calendario del sistema con el botón.
 */
export function CampoFecha({
  valor,
  alCambiar,
  opcional,
  min,
  max,
  etiqueta = 'Fecha',
}: {
  valor: string | undefined;
  alCambiar: (iso: string | undefined) => void;
  /** Si se puede dejar vacía. */
  opcional?: boolean;
  min?: string;
  max?: string;
  etiqueta?: string;
}) {
  const [texto, setTexto] = useState(() => aTexto(valor));
  const [mal, setMal] = useState(false);
  const calendario = useRef<HTMLInputElement>(null);

  // Si cambia desde fuera (o desde el calendario), se enseña.
  useEffect(() => {
    if (leerEscrito(texto) !== valor) setTexto(aTexto(valor));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  const escribir = (t: string) => {
    const f = formatearEscrito(t);
    setTexto(f);
    setMal(false);
    const iso = leerEscrito(f);
    if (iso) alCambiar(iso);
    else if (!f && opcional) alCambiar(undefined);
  };

  const abrirCalendario = () => {
    const c = calendario.current;
    if (!c) return;
    try {
      c.showPicker();
    } catch {
      c.focus();
      c.click();
    }
  };

  return (
    <span className="campo-fecha">
      <input
        className={`entrada ${mal ? 'mal' : ''}`}
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        aria-label={etiqueta}
        value={texto}
        onChange={(e) => escribir(e.target.value)}
        onBlur={() => {
          const iso = leerEscrito(texto);
          if (!texto) setMal(!opcional);
          else if (!iso) setMal(true);
          else setTexto(aTexto(iso));
        }}
      />
      <button type="button" className="boton-calendario" aria-label={`Elegir ${etiqueta.toLowerCase()} en el calendario`} onClick={abrirCalendario}>
        <Icono nombre="calendario" tamano={20} />
      </button>
      <input
        ref={calendario}
        type="date"
        className="calendario-oculto"
        tabIndex={-1}
        aria-hidden="true"
        min={min}
        max={max}
        value={valor ?? ''}
        onChange={(e) => {
          if (e.target.value) {
            setTexto(aTexto(e.target.value));
            setMal(false);
            alCambiar(e.target.value);
          } else if (opcional) alCambiar(undefined);
        }}
      />
    </span>
  );
}
