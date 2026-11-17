import { useState, type CSSProperties, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  cuentaAtras,
  diaSemana,
  deFecha,
  ENLACE_NAVITIME,
  enlaceGoogleMaps,
  enlaceLugar,
  fechaCorta,
  type Alojamiento,
  type Fecha,
  type Reserva,
  type Trayecto,
} from '@/domain/viaje';

import { useAlba } from '../AlbaViajera';
import type { Ciudad } from '../ciudades';
import { Icono, type NombreIcono } from './Icono';
import { Restante } from './tiempo';

export function Cabecera({
  titulo,
  atras,
  iconoAtras = 'atras',
  textoAtras = 'Atrás',
  children,
}: {
  titulo: string;
  atras?: boolean | string;
  /** Hoy usa la maleta: vuelve a la lista de viajes. */
  iconoAtras?: NombreIcono;
  textoAtras?: string;
  children?: ReactNode;
}) {
  const navegar = useNavigate();
  return (
    <header className="cabecera">
      {atras && (
        <button
          className="accion volver"
          aria-label={textoAtras}
          onClick={() => (typeof atras === 'string' ? navegar(atras) : history.length > 1 ? navegar(-1) : navegar('/hoy'))}
        >
          <Icono nombre={iconoAtras} />
        </button>
      )}
      <h1>{titulo}</h1>
      {children}
      <IndicadorSync />
    </header>
  );
}

/** Un punto discreto: verde = al día, azul = sincronizando, ocre = sin conexión (se subirá luego), rojo = problema. */
export function IndicadorSync() {
  const { estado, pendientes, sincronizarAhora } = useAlba();
  const [clase, texto] =
    estado.tipo === 'sincronizando'
      ? ['trabajando', '']
      : estado.tipo === 'alDia'
        ? ['', pendientes ? String(pendientes) : '']
        : estado.tipo === 'sinConexion'
          ? ['sin', pendientes ? `${pendientes} sin subir` : 'sin red']
          : estado.tipo === 'sesionCaducada'
            ? ['mal', 'entrar']
            : ['mal', 'error'];
  const titulo =
    estado.tipo === 'error' ? estado.mensaje : estado.tipo === 'sesionCaducada' ? 'La sesión ha caducado: toca para volver a entrar' : 'Sincronizar ahora';
  return (
    <button
      className={`sync ${clase}`}
      title={titulo}
      aria-label={titulo}
      onClick={() => (estado.tipo === 'sesionCaducada' ? location.reload() : sincronizarAhora())}
    >
      <span className="punto" />
      {texto}
    </button>
  );
}

export function FechaBloque({ fecha }: { fecha: Fecha }) {
  const d = deFecha(fecha);
  const finde = d.getDay() === 0 || d.getDay() === 6;
  return (
    <span className={`fecha-bloque ${finde ? 'finde' : ''}`}>
      <span className="num">{d.getDate()}</span>
      <span className="dia">{diaSemana(fecha).slice(0, 3)}</span>
    </span>
  );
}

const fmtVenta = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** "vie, 20 nov, 6:00" en la hora del móvil. */
export function textoVenta(venta: Date): string {
  return fmtVenta.format(venta);
}

export function EtiquetaVenta({ venta }: { venta: Date }) {
  const { ahora } = useAlba();
  const c = cuentaAtras(venta, ahora);
  if (c.tipo === 'yaALaVenta') return <span className="pastilla matcha">ya a la venta</span>;
  // En el último día, al segundo.
  if (c.urgente)
    return (
      <span className="pastilla shu">
        en <Restante hasta={venta} />
      </span>
    );
  return <span className="pastilla ocre">{c.texto}</span>;
}

/** Fila de una reserva con el círculo para marcarla como hecha. */
export function FilaReserva({ reserva, mostrarFecha = true }: { reserva: Reserva; mostrarFecha?: boolean }) {
  const { viaje } = useAlba();
  const hecha = reserva.estado === 'comprada';
  const descartada = reserva.estado === 'descartada';
  return (
    <div className="fila" style={descartada ? { opacity: 0.5 } : undefined}>
      <button
        className={`check ${hecha ? 'hecho' : ''}`}
        aria-label={hecha ? 'Marcar como pendiente' : 'Marcar como hecha'}
        onClick={() => void viaje.guardarReserva({ ...reserva, estado: hecha ? 'pendiente' : 'comprada' })}
      >
        <Icono nombre="check" tamano={16} />
      </button>
      <Link to={`/reserva/${reserva.id}`} className="fila-enlace">
        <span className="texto">
        <span className="negrita">{reserva.titulo}</span>
        <span className="pequeno secundario">
          {[
            mostrarFecha && reserva.fechaUso ? fechaCorta(reserva.fechaUso) : undefined,
            reserva.horaUso,
            descartada ? 'descartada' : undefined,
            reserva.estado === 'pendiente' && reserva.venta ? `venta ${textoVenta(reserva.venta)}` : undefined,
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
        </span>
        {reserva.estado === 'pendiente' && reserva.venta && <EtiquetaVenta venta={reserva.venta} />}
        <span className="flecha">
          <Icono nombre="chevron" tamano={18} />
        </span>
      </Link>
    </div>
  );
}

export function BotonesRuta({ destino, origen }: { destino: string; origen?: string }) {
  const { config } = useAlba();
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="botones">
      <a className="boton claro pequeno" href={enlaceGoogleMaps(destino, origen)} target="_blank" rel="noreferrer">
        <Icono nombre="mapa" tamano={18} /> Google Maps
      </a>
      {config.pais === 'JP' && (
      <a
        className="boton claro pequeno"
        href={ENLACE_NAVITIME}
        target="_blank"
        rel="noreferrer"
        title="Copia el destino para pegarlo en NAVITIME"
        onClick={() => {
          void navigator.clipboard?.writeText(destino).then(() => {
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2500);
          });
        }}
      >
        <Icono nombre="enlace" tamano={18} /> {copiado ? 'Destino copiado' : 'NAVITIME'}
      </a>
      )}
    </div>
  );
}

export function TarjetaTrayecto({ trayecto }: { trayecto: Trayecto }) {
  const pasos = trayecto.pasos;
  return (
    <div className="tarjeta">
      <div className="trayecto-cabecera">
        <Icono nombre="tren" tamano={20} />
        <span className="titulo">{trayecto.titulo}</span>
        <Link to={`/trayecto/${trayecto.id}`} className="accion-foto" aria-label="Editar trayecto">
          <Icono nombre="editar" tamano={18} />
        </Link>
      </div>
      <div className="pastillas">
        {trayecto.hora && <span className="pastilla">{trayecto.hora}</span>}
        {trayecto.duracion && <span className="pastilla">{trayecto.duracion}</span>}
        {trayecto.jrPass === true && <span className="pastilla ai">JR Pass</span>}
        {trayecto.jrPass === false && <span className="pastilla ocre">Sin JR Pass</span>}
      </div>
      {pasos.length > 0 && (
        <ol className="ruta">
          {pasos.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ol>
      )}
      {trayecto.notas && <p className="pequeno secundario pre" style={{ margin: 0 }}>{trayecto.notas}</p>}
      {trayecto.destino && <BotonesRuta destino={trayecto.destino} origen={trayecto.origen} />}
    </div>
  );
}

/** La dirección en japonés a pantalla completa, para enseñarla al taxista o en recepción. */
export function DireccionGrande({ alojamiento, alCerrar }: { alojamiento: Alojamiento; alCerrar: () => void }) {
  return (
    <div className="velo" role="dialog" aria-modal="true">
      <button className="cerrar" onClick={alCerrar} aria-label="Cerrar">
        <Icono nombre="cerrar" tamano={28} />
      </button>
      <div className="direccion">
        <p className="mincho" style={{ fontSize: 22, margin: 0 }}>{alojamiento.nombre}</p>
        <p className="ja" style={{ margin: 0 }}>{alojamiento.direccionJa ?? alojamiento.direccion}</p>
        {alojamiento.direccionJa && alojamiento.direccion && <p className="secundario" style={{ margin: 0 }}>{alojamiento.direccion}</p>}
        <p className="pequeno secundario" style={{ margin: 0 }}>ここへ行きたいです。(Quiero ir aquí.)</p>
      </div>
    </div>
  );
}

export function TarjetaAlojamiento({ alojamiento, titulo }: { alojamiento: Alojamiento; titulo?: string }) {
  const [grande, setGrande] = useState(false);
  const lugar = alojamiento.direccion ?? alojamiento.nombre;
  return (
    <div className="tarjeta">
      {titulo && <p className="etiqueta">{titulo}</p>}
      <Link to={`/alojamiento/${alojamiento.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
        <div className="negrita">{alojamiento.nombre}</div>
        {alojamiento.direccionJa && <div className="pequeno" style={{ marginTop: 2 }}>{alojamiento.direccionJa}</div>}
        {alojamiento.direccion && <div className="pequeno secundario">{alojamiento.direccion}</div>}
      </Link>
      <div className="botones">
        <button className="boton claro pequeno" onClick={() => setGrande(true)}>
          <Icono nombre="ensenar" tamano={18} /> Enseñar
        </button>
        <a className="boton claro pequeno" href={enlaceGoogleMaps(lugar)} target="_blank" rel="noreferrer">
          <Icono nombre="ruta" tamano={18} /> Cómo ir
        </a>
        <a className="boton claro pequeno boton-icono" href={enlaceLugar(lugar)} target="_blank" rel="noreferrer" aria-label="Ver en el mapa">
          <Icono nombre="pin" tamano={18} />
        </a>
      </div>
      {grande && <DireccionGrande alojamiento={alojamiento} alCerrar={() => setGrande(false)} />}
    </div>
  );
}

/**
 * Portada con el color y el kanji de la ciudad sobre olas seigaiha. Con foto del día, la foto hace de
 * fondo (oscurecida abajo para que el texto se lea).
 */
export function Portada({ ciudad: c, foto, children }: { ciudad: Ciudad; foto?: string; children: ReactNode }) {
  return (
    <div
      className={`portada-color ${foto ? 'con-foto' : ''}`}
      style={{ '--c': c.color, backgroundImage: foto ? `linear-gradient(to top, rgb(0 0 0 / 0.7), rgb(0 0 0 / 0.05) 70%), url("${foto}")` : undefined } as CSSProperties}
    >
      {!foto && (
        <span className="kanji" aria-hidden="true">
          {c.kanji}
        </span>
      )}
      <div className="portada-texto">{children}</div>
    </div>
  );
}

/** Botón visible para añadir algo (al final de cada lista). */
export function BotonAnadir({ to, texto }: { to: string; texto: string }) {
  return (
    <Link to={to} className="boton anadir">
      <Icono nombre="mas" tamano={18} /> {texto}
    </Link>
  );
}

export function Cargando() {
  return <p className="vacio">Cargando…</p>;
}
