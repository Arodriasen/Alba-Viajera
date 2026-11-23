import { useEffect, useRef, useState } from 'react';

import type { Fecha } from '@/domain/viaje';

import { useAlba, useConsulta } from '../AlbaViajera';
import { Icono } from './Icono';

/**
 * El diario de un día: un texto compartido (lo escriben los dos). Se lee tal cual y, al tocar «Escribir» o
 * «Editar», se escribe ahí mismo y se guarda solo (a los 700 ms de dejar de escribir, con «Listo» y al
 * salir). Solo se guarda lo que se ha tecleado: abrir y cerrar no pisa lo del otro móvil. Usar con
 * `key={fecha}` si cambia el día.
 */
export function TarjetaDiario({ fecha, titulo = 'Diario' }: { fecha: Fecha; titulo?: string }) {
  const { viaje } = useAlba();
  const datos = useConsulta(async ({ viaje: v }) => ({ e: await v.diario(fecha) }), [fecha]);
  /** Lo que se está escribiendo (undefined = solo leyendo). */
  const [texto, setTexto] = useState<string>();
  /** Tecleado y aún sin guardar. */
  const pendiente = useRef<string | undefined>(undefined);
  const guardar = useRef(viaje.guardarDiario.bind(viaje));
  guardar.current = viaje.guardarDiario.bind(viaje);

  useEffect(() => {
    if (pendiente.current === undefined) return;
    const t = setTimeout(() => {
      const v = pendiente.current;
      pendiente.current = undefined;
      if (v !== undefined) void guardar.current(fecha, v);
    }, 700);
    return () => clearTimeout(t);
  }, [texto, fecha]);
  useEffect(
    () => () => {
      if (pendiente.current !== undefined) void guardar.current(fecha, pendiente.current);
    },
    [fecha],
  );

  if (!datos) return null;
  const guardado = datos.e?.texto;

  return (
    <div className="tarjeta diario">
      <p className="etiqueta">
        <Icono nombre="diario" tamano={14} /> {titulo}
      </p>
      {texto !== undefined ? (
        <>
          <textarea
            className="entrada"
            rows={6}
            autoFocus
            value={texto}
            placeholder="Qué habéis hecho, lo mejor del día, qué ha dicho Alba…"
            onChange={(e) => {
              pendiente.current = e.target.value;
              setTexto(e.target.value);
            }}
          />
          <div className="fila-diario">
            <span className="muy-pequeno secundario">Se guarda solo</span>
            <button
              type="button"
              className="accion-texto"
              onClick={async () => {
                const v = pendiente.current;
                pendiente.current = undefined;
                if (v !== undefined) await viaje.guardarDiario(fecha, v);
                setTexto(undefined);
              }}
            >
              <Icono nombre="check" tamano={16} /> Listo
            </button>
          </div>
        </>
      ) : guardado ? (
        <>
          <p className="pre" style={{ margin: 0 }}>
            {guardado}
          </p>
          <button type="button" className="enlace-editar" onClick={() => setTexto(guardado)}>
            <Icono nombre="editar" tamano={16} /> Editar
          </button>
        </>
      ) : (
        <div className="fila-diario">
          <span className="secundario">Aún sin escribir.</span>
          <button type="button" className="accion-texto" onClick={() => setTexto('')}>
            <Icono nombre="editar" tamano={16} /> Escribir
          </button>
        </div>
      )}
    </div>
  );
}
