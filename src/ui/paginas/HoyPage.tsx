import { useState } from 'react';

import { horaEn } from '@/domain/clima';
import { tiene } from '@/domain/config';
import { tituloDelViaje } from '@/domain/viajes';
import { Link } from 'react-router-dom';

import {
  alojamientoDeLaNoche,
  ciudadDelDia,
  delDia,
  diaJrPass,
  enlaceGoogleMaps,
  fase,
  fechaCorta,
  fechaLarga,
  instanteDe,
  ordenarReservas,
  porComprar,
  proximoConHora,
  salida,
  sumarDias,
  trayectosDelDia,
  type Fecha,
} from '@/domain/viaje';

import { useAlba, useConsulta } from '../AlbaViajera';
import { BotonAnadir, Cabecera, Cargando, FilaReserva, Portada, TarjetaAlojamiento, TarjetaTrayecto } from '../componentes/comunes';
import { ChipTiempo, ConsejoTiempo, FranjaAvisos } from '../componentes/clima';
import { EnlaceParque } from '../componentes/EnlaceParque';
import { FotoDelDia } from '../componentes/FotoDelDia';
import { Icono } from '../componentes/Icono';
import { PortadaDia } from '../componentes/PortadaDia';
import { CuentaAtras, RelojDestino, Restante } from '../componentes/tiempo';
import { TarjetaGastosHoy } from './GastosPage';
import { TarjetaTaxFree } from './TaxFreePage';

export function HoyPage() {
  const { hoy, simulando, config } = useAlba();
  const f = fase(hoy, config);
  return (
    <>
      <Cabecera titulo={tituloDelViaje(config.destino)} atras="/" iconoAtras="viajes" textoAtras="Todos los viajes">
        <Link to="/ajustes" className="accion" aria-label="Ajustes del viaje">
          <Icono nombre="ajustes" />
        </Link>
      </Cabecera>
      <main className="contenido">
        {simulando && (
          <div className="aviso ai">
            Viendo el {fechaLarga(hoy)}
            <a href="/hoy?hoy=">Volver a hoy</a>
          </div>
        )}
        {f.tipo === 'antes' && <Antes />}
        {f.tipo === 'durante' && <Durante fecha={hoy} dia={f.dia} total={f.total} />}
        {f.tipo === 'despues' && (
          <div className="portada">
            <p className="grande">{config.pais === 'JP' ? 'おかえり' : '¡De vuelta!'}</p>
            <p className="secundario">Bienvenidos a casa. El viaje queda guardado aquí.</p>
            {tiene(config, 'album') && (
              <Link to="/album" className="boton shu">
                Ver el álbum
              </Link>
            )}
            <Link to="/viaje" className="boton claro">
              Ver el viaje
            </Link>
          </div>
        )}
      </main>
    </>
  );
}

function Antes() {
  const { config } = useAlba();
  const datos = useConsulta(async ({ viaje }) => ({ reservas: await viaje.reservas(), alojamientos: await viaje.alojamientos() }), []);
  if (!datos) return <Cargando />;
  const compras = porComprar(datos.reservas);
  const conVenta = compras.filter((r) => r.venta);
  const sinVenta = compras.filter((r) => !r.venta);
  const porDecidir = datos.alojamientos.filter((a) => a.estado === 'pendiente' || a.estado === 'cancelar');

  return (
    <>
      <Portada ciudad={{ nombre: config.destino, kanji: config.simbolo, color: config.color }}>
        <p className="etiqueta">
          {config.destino} · {config.simbolo} · faltan
        </p>
        <CuentaAtras hasta={salida(config)} />
        <p className="sub">
          Vuelo el {fechaCorta(config.inicio)} a las {config.horaSalida} (hora de {config.salida.ciudad})
        </p>
        <p className="sub muy-pequeno">
          <RelojDestino />
        </p>
        {tiene(config, 'tiempo') && <ChipTiempo ciudad={config.ciudades[0]?.nombre} texto={`${config.ciudades[0]?.nombre ?? config.destino} ahora:`} />}
      </Portada>

      {tiene(config, 'reservas') && conVenta.length > 0 && (
        <section className="seccion">
          <div className="seccion-cabecera">
            <p className="etiqueta">Salen a la venta</p>
            <Link to="/reservas">Todas</Link>
          </div>
          <div className="lista">
            {conVenta.map((r) => (
              <FilaReserva key={r.id} reserva={r} />
            ))}
          </div>
          <p className="muy-pequeno secundario" style={{ margin: 0 }}>
            Horas de este móvil.
          </p>
        </section>
      )}

      {tiene(config, 'reservas') && sinVenta.length > 0 && (
        <section className="seccion">
          <p className="etiqueta">También pendiente</p>
          <div className="lista">
            {sinVenta.map((r) => (
              <FilaReserva key={r.id} reserva={r} />
            ))}
          </div>
        </section>
      )}
      {tiene(config, 'reservas') && <BotonAnadir to="/reserva/nueva" texto="Añadir reserva o entrada" />}

      {porDecidir.length > 0 && (
        <section className="seccion">
          <p className="etiqueta">Alojamientos por decidir</p>
          <div className="lista">
            {porDecidir.map((a) => (
              <Link key={a.id} to={`/alojamiento/${a.id}`} className="fila">
                <span className="texto">
                  <span className="negrita recorte">{a.nombre}</span>
                  <span className="pequeno secundario">{a.ciudad}</span>
                </span>
                <span className={`pastilla ${a.estado === 'cancelar' ? 'shu' : 'ocre'}`}>{a.estado === 'cancelar' ? 'cancelar' : 'por decidir'}</span>
                <Icono nombre="chevron" tamano={18} />
              </Link>
            ))}
          </div>
        </section>
      )}

      <a className="boton claro" href={`/hoy?hoy=${sumarDias(config.inicio, 3)}`}>
        <Icono nombre="sol" tamano={18} /> Ver cómo será un día del viaje
      </a>
    </>
  );
}

function Durante({ fecha, dia, total }: { fecha: Fecha; dia: number; total: number }) {
  const { simulando, config } = useAlba();
  const [destino, setDestino] = useState('');
  const manana = sumarDias(fecha, 1);
  const datos = useConsulta(
    async ({ viaje }) => ({
      dia: await viaje.dia(fecha),
      manana: await viaje.dia(manana),
      reservas: await viaje.reservas(),
      alojamientos: await viaje.alojamientos(),
      trayectos: await viaje.trayectos(),
    }),
    [fecha],
  );
  if (!datos) return <Cargando />;

  const jr = tiene(config, 'jrpass') ? diaJrPass(fecha, config) : undefined;
  const reservas = ordenarReservas(delDia(datos.reservas, fecha)).filter((r) => r.estado !== 'descartada');
  const trayectos = trayectosDelDia(datos.trayectos, fecha);
  const noche = alojamientoDeLaNoche(datos.alojamientos, fecha);
  const ciudadHoy = ciudadDelDia(fecha, datos.dia, datos.alojamientos);
  // Con ?hoy= simulado, "ahora" es esa fecha a la misma hora (para ver la tarjeta de "lo siguiente").
  const ahoraReal = new Date();
  const ahora = simulando ? instanteDe(fecha, horaEn(ahoraReal, config.zona), config) : ahoraReal;
  const proximo = proximoConHora(datos.reservas, datos.trayectos, ahora, config);

  return (
    <>
      <PortadaDia dia={datos.dia} fecha={fecha} ciudad={ciudadHoy}>
        <p className="etiqueta">
          Día {dia} de {total} · {fechaLarga(fecha)}
        </p>
        <p className="titulo-dia">{datos.dia?.titulo || 'Día libre'}</p>
        <div className="pastillas">
          {ciudadHoy && <span className="pastilla blanca">{ciudadHoy}</span>}
          {jr && (
            <span className="pastilla">
              JR Pass · día {jr} de {config.jrPass.dias}
            </span>
          )}
        </div>
        <p className="sub muy-pequeno">
          <RelojDestino texto={`Hora de ${config.destino}:`} />
        </p>
        {tiene(config, 'tiempo') && <ChipTiempo ciudad={ciudadHoy} />}
      </PortadaDia>

      {tiene(config, 'avisos') && <FranjaAvisos ciudad={ciudadHoy} />}
      {tiene(config, 'tiempo') && <ConsejoTiempo ciudad={ciudadHoy} />}

      {proximo && (
        <div className="tarjeta proximo">
          <Icono nombre={proximo.tipo === 'trayecto' ? 'tren' : 'reloj'} tamano={22} />
          <span className="texto">
            <span className="etiqueta">Lo siguiente · {horaEn(proximo.cuando, config.zona)}</span>
            <span className="negrita">{proximo.titulo}</span>
          </span>
          <span className="cuando">
            en <Restante hasta={proximo.cuando} desfase={ahora.getTime() - ahoraReal.getTime()} />
          </span>
        </div>
      )}

      <Link to={`/dia/${fecha}/editar`} className="tarjeta enlace">
        {datos.dia?.plan.length ? (
          <ul className="plan">
            {datos.dia.plan.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        ) : (
          <span className="secundario">Sin plan: toca para escribirlo</span>
        )}
        {datos.dia?.notas && (
          <p className="pequeno secundario pre" style={{ margin: 0 }}>
            {datos.dia.notas}
          </p>
        )}
        <span className="enlace-editar">
          <Icono nombre="editar" tamano={16} /> Editar el día
        </span>
      </Link>

      {tiene(config, 'parques') && <EnlaceParque fecha={fecha} />}

      {tiene(config, 'album') && <FotoDelDia fecha={fecha} foto={datos.dia?.foto} />}

      {tiene(config, 'taxfree') && fecha === config.vueltaFecha && <TarjetaTaxFree destacada />}

      {tiene(config, 'presupuesto') && <TarjetaGastosHoy fecha={fecha} />}

      {tiene(config, 'reservas') && (
      <section className="seccion">
        <p className="etiqueta">Reservas de hoy</p>
        {reservas.length > 0 && (
          <div className="lista">
            {reservas.map((r) => (
              <FilaReserva key={r.id} reserva={r} mostrarFecha={false} />
            ))}
          </div>
        )}
        <BotonAnadir to={`/reserva/nueva?fecha=${fecha}`} texto="Añadir reserva" />
      </section>
      )}

      <section className="seccion">
        <p className="etiqueta">Trayectos</p>
        {trayectos.map((t) => (
          <TarjetaTrayecto key={t.id} trayecto={t} />
        ))}
        <BotonAnadir to={`/trayecto/nuevo?fecha=${fecha}`} texto="Añadir trayecto" />
      </section>

      <section className="seccion">
        <p className="etiqueta">¿Cómo llego a…?</p>
        <form
          className="buscar-ruta"
          onSubmit={(e) => {
            e.preventDefault();
            if (destino.trim()) window.open(enlaceGoogleMaps(destino.trim()), '_blank', 'noreferrer');
          }}
        >
          <input className="entrada" value={destino} onChange={(e) => setDestino(e.target.value)} placeholder="Sitio, estación o dirección" enterKeyHint="go" />
          <button className="boton boton-icono" aria-label="Buscar ruta">
            <Icono nombre="ruta" tamano={20} />
          </button>
        </form>
      </section>

      {noche && <TarjetaAlojamiento alojamiento={noche} titulo="Esta noche" />}

      {datos.manana && (
        <Link to={`/dia/${manana}`} className="tarjeta enlace fila-tarjeta">
          <span className="texto">
            <span className="etiqueta">Mañana</span>
            <span className="negrita">{datos.manana.titulo || 'Sin plan'}</span>
          </span>
          <Icono nombre="chevron" tamano={20} />
        </Link>
      )}
    </>
  );
}
