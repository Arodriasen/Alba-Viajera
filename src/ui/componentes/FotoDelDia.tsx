import { useEffect, useRef, useState, type ChangeEvent } from 'react';

import { fechaLarga, type Fecha } from '@/domain/viaje';

import { useAlba } from '../AlbaViajera';
import { Icono } from './Icono';

/** URL local de una foto (la descarga si la hizo el otro móvil). undefined mientras carga o si no hay. */
export function useUrlFoto(nombre: string | undefined): string | undefined {
  const { fotos } = useAlba();
  const [url, setUrl] = useState<{ nombre: string; url?: string }>();
  useEffect(() => {
    if (!nombre) return;
    let vigente = true;
    fotos.url(nombre).then((u) => vigente && setUrl({ nombre, url: u }));
    return () => {
      vigente = false;
    };
  }, [fotos, nombre]);
  return nombre && url?.nombre === nombre ? url.url : undefined;
}

/** La foto a pantalla completa. */
export function VisorFoto({ url, titulo, alCerrar }: { url: string; titulo: string; alCerrar: () => void }) {
  return (
    <div className="velo visor" role="dialog" aria-modal="true" onClick={alCerrar}>
      <button className="cerrar" onClick={alCerrar} aria-label="Cerrar">
        <Icono nombre="cerrar" tamano={28} />
      </button>
      <img src={url} alt={titulo} />
      <p className="centrado mincho" style={{ margin: 0 }}>{titulo}</p>
    </div>
  );
}

/** "Foto del día": hacerla o subirla cuando se quiera, verla, cambiarla o quitarla. */
export function FotoDelDia({ fecha, foto }: { fecha: Fecha; foto?: string }) {
  const { fotos } = useAlba();
  const camara = useRef<HTMLInputElement>(null);
  const galeria = useRef<HTMLInputElement>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string>();
  const [grande, setGrande] = useState(false);
  const url = useUrlFoto(foto);

  const alElegir = async (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setTrabajando(true);
    setError(undefined);
    try {
      await fotos.poner(fecha, archivo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se ha podido guardar la foto');
    } finally {
      setTrabajando(false);
    }
  };

  const entradas = (
    <>
      <input ref={camara} type="file" accept="image/*" capture="environment" hidden onChange={alElegir} />
      <input ref={galeria} type="file" accept="image/*" hidden onChange={alElegir} />
    </>
  );

  if (!foto) {
    return (
      <div className="tarjeta foto-vacia">
        {entradas}
        <p className="etiqueta">Foto del día</p>
        {trabajando ? (
          <p className="secundario centrado" style={{ margin: 0 }}>Preparando la foto…</p>
        ) : (
          <div className="botones">
            <button className="boton claro pequeno" onClick={() => camara.current?.click()}>
              <Icono nombre="camara" tamano={18} /> Hacerla
            </button>
            <button className="boton claro pequeno" onClick={() => galeria.current?.click()}>
              <Icono nombre="galeria" tamano={18} /> Subirla
            </button>
          </div>
        )}
        {error && <p className="pequeno error" style={{ margin: 0 }}>{error}</p>}
      </div>
    );
  }

  // La foto ya se ve en grande en la portada del día: aquí solo la miniatura y los botones.
  return (
    <div className="tarjeta foto-compacta">
      {entradas}
      <div className="fila-foto">
        <button className="miniatura-foto" onClick={() => url && setGrande(true)} aria-label="Ver la foto en grande">
          {url && <img src={url} alt={`Foto del ${fechaLarga(fecha)}`} />}
        </button>
        <span className="negrita" style={{ flex: 1 }}>{trabajando ? 'Preparando…' : 'Foto del día'}</span>
        <button className="accion-foto" disabled={trabajando} onClick={() => camara.current?.click()} aria-label="Hacer otra foto">
          <Icono nombre="camara" tamano={20} />
        </button>
        <button className="accion-foto" disabled={trabajando} onClick={() => galeria.current?.click()} aria-label="Cambiar por otra de la galería">
          <Icono nombre="galeria" tamano={20} />
        </button>
        <button
          className="accion-foto peligro"
          disabled={trabajando}
          aria-label="Quitar la foto"
          onClick={() => window.confirm('¿Quitar la foto de este día? Se quitará también en el otro móvil.') && void fotos.quitar(fecha)}
        >
          <Icono nombre="papelera" tamano={20} />
        </button>
      </div>
      {error && <p className="pequeno error" style={{ margin: 0 }}>{error}</p>}
      {grande && url && <VisorFoto url={url} titulo={fechaLarga(fecha)} alCerrar={() => setGrande(false)} />}
    </div>
  );
}
