import { tiene } from '@/domain/config';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import {
  alojamientoDeLaNoche,
  ciudadDelDia,
  delDia,
  hotelesDelDia,
  textoSinPlan,
  diaJrPass,
  fechaCorta,
  fechaLarga,
  fechasDelViaje,
  ordenarReservas,
  sumarDias,
  trayectosDelDia,
  type Dia,
} from '@/domain/viaje';

import { useAlba, useConsulta } from '../AlbaViajera';
import { ciudad, type Ciudad } from '../ciudades';
import { BotonAnadir, Cabecera, Cargando, FechaBloque, FilaReserva, TarjetaAlojamiento, TarjetaTrayecto } from '../componentes/comunes';
import { MiniTiempo, useTiempoItinerario } from '../componentes/clima';
import { EnlaceParque } from '../componentes/EnlaceParque';
import { Campo, useGuardadoSolo } from '../componentes/formulario';
import { FotoDelDia } from '../componentes/FotoDelDia';
import { TarjetaVuelo } from '../componentes/TarjetaVuelo';
import { Icono } from '../componentes/Icono';
import { CampoCiudad, useGuardarCiudad } from '../componentes/CampoCiudad';
import { PortadaDia } from '../componentes/PortadaDia';

/** El itinerario: un día por fila. */
export function ViajePage() {
  const { hoy, config } = useAlba();
  const [organizar, setOrganizar] = useState(false);
  const datos = useConsulta(async ({ viaje }) => ({ dias: await viaje.dias(), alojamientos: await viaje.alojamientos() }), []);
  const hoyRef = useRef<HTMLAnchorElement>(null);
  const tiempoDe = useTiempoItinerario();
  useEffect(() => hoyRef.current?.scrollIntoView({ block: 'center' }), [datos !== undefined]);
  if (!datos) return <Cargando />;
  const porFecha = new Map(datos.dias.map((d) => [d.fecha, d]));
  const fotos = datos.dias.filter((d) => d.foto).length;

  // Días seguidos en la misma ciudad, juntos (como en Konkon).
  const grupos: { ciudad: Ciudad; fechas: string[] }[] = [];
  for (const fecha of fechasDelViaje(config)) {
    const c = ciudad(ciudadDelDia(fecha, porFecha.get(fecha), datos.alojamientos), config.ciudades, config.pais === 'JP' ? '旅' : config.simbolo, config.salida.ciudad);
    const ultimo = grupos.at(-1);
    if (ultimo && ultimo.ciudad.nombre === c.nombre) ultimo.fechas.push(fecha);
    else grupos.push({ ciudad: c, fechas: [fecha] });
  }

  return (
    <>
      <Cabecera titulo="El viaje">
        <button
          type="button"
          className={`accion ${organizar ? 'activa' : ''}`}
          aria-label={organizar ? 'Terminar de organizar' : 'Organizar el viaje'}
          aria-pressed={organizar}
          onClick={() => setOrganizar(!organizar)}
        >
          <Icono nombre={organizar ? 'check' : 'editar'} />
        </button>
        <Link to="/ajustes" className="accion" aria-label="Ajustes del viaje">
          <Icono nombre="ajustes" />
        </Link>
      </Cabecera>
      <main className="contenido">
        {organizar && (
          <p className="aviso ai" style={{ margin: 0 }}>
            <Icono nombre="editar" tamano={18} /> Escribe directamente en cada día: se guarda solo. Si un día no tiene ciudad, coge la de su hotel.
          </p>
        )}
        {!organizar && tiene(config, 'album') && (
        <Link to="/album" className="tarjeta enlace fila-tarjeta">
          <span className="icono-redondo">
            <Icono nombre="galeria" tamano={20} />
          </span>
          <span className="texto">
            <span className="negrita">Álbum del viaje</span>
            <span className="pequeno secundario">{fotos === 1 ? '1 foto del día' : `${fotos} fotos del día`}</span>
          </span>
          <Icono nombre="chevron" tamano={20} />
        </Link>
        )}

        {grupos.map((g) => (
          <section key={g.fechas[0]} className="grupo" style={{ '--c': g.ciudad.color } as CSSProperties}>
            <div className="grupo-cabecera">
              <span className="kanji-peq">{g.ciudad.kanji}</span>
              <span className="nombre">{g.ciudad.nombre}</span>
              <span className="fechas">
                {g.fechas.length === 1 ? fechaCorta(g.fechas[0]) : `${fechaCorta(g.fechas[0])} – ${fechaCorta(g.fechas.at(-1)!)}`}
              </span>
            </div>
            <div className="lista">
              {g.fechas.map((fecha) => {
                const d = porFecha.get(fecha);
                if (organizar) return <DiaOrganizar key={fecha} fecha={fecha} dia={d} hoteles={hotelesDelDia(datos.alojamientos, fecha)} />;
                const sinPlan = textoSinPlan(hotelesDelDia(datos.alojamientos, fecha));
                const jr = tiene(config, 'jrpass') ? diaJrPass(fecha, config) : undefined;
                const noche = alojamientoDeLaNoche(datos.alojamientos, fecha);
                const hotelNuevo = noche && noche.id !== alojamientoDeLaNoche(datos.alojamientos, sumarDias(fecha, -1))?.id;
                return (
                  <Link
                    key={fecha}
                    ref={fecha === hoy ? hoyRef : undefined}
                    to={`/dia/${fecha}`}
                    className={`fila con-franja ${fecha === hoy ? 'hoy' : fecha < hoy && hoy <= config.fin ? 'pasado' : ''}`}
                  >
                    <FechaBloque fecha={fecha} />
                    <span className="texto">
                      {d?.titulo ? <span className="negrita recorte">{d.titulo}</span> : <span className="secundario recorte">{sinPlan ?? 'Sin plan'}</span>}
                      {(jr || hotelNuevo || d?.foto) && (
                        <span className="pastillas" style={{ marginTop: 3 }}>
                          {jr && (
                            <span className="pastilla ai">
                              JR {jr}/{config.jrPass.dias}
                            </span>
                          )}
                          {hotelNuevo && (
                            <span className="pastilla">
                              <Icono nombre="cama" tamano={13} /> {noche.nombre.split(' ').slice(0, 2).join(' ')}
                            </span>
                          )}
                          {d?.foto && (
                            <span className="pastilla matcha">
                              <Icono nombre="camara" tamano={13} /> foto
                            </span>
                          )}
                        </span>
                      )}
                    </span>
                    {tiene(config, 'tiempo') && <MiniTiempo t={tiempoDe(fecha, ciudadDelDia(fecha, d, datos.alojamientos))} />}
                    <span className="flecha">
                      <Icono nombre="chevron" tamano={18} />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
        <p className="muy-pequeno secundario centrado" style={{ margin: 0 }}>
          El tiempo con «~» es lo típico de esos días (aún sin previsión). Las fechas se cambian en <Link to="/ajustes">Ajustes del viaje</Link>.
        </p>
      </main>
    </>
  );
}

/**
 * Si esa noche hay hotel: una línea discreta con él y, si el día aún no los tiene, pastillas para
 * poner su ciudad o "Llegada a…" como título.
 */
function SugerenciaHotel({
  hoteles,
  titulo,
  ciudad,
  alPonerTitulo,
  alPonerCiudad,
}: {
  hoteles: ReturnType<typeof hotelesDelDia>;
  titulo: string;
  ciudad: string;
  alPonerTitulo: (t: string) => void;
  alPonerCiudad: (c: string) => void;
}) {
  const hotel = hoteles.llegada ?? hoteles.noche ?? hoteles.salida;
  if (!hotel) return null;
  const texto = textoSinPlan(hoteles);
  const ponerCiudad = hotel.ciudad && !ciudad.trim() ? hotel.ciudad : undefined;
  const ponerTitulo = texto && !titulo.trim() ? texto : undefined;
  return (
    <div className="sugerencia">
      <span className="muy-pequeno secundario">
        <Icono nombre="cama" tamano={13} /> {texto}
        {hotel.ciudad ? ` (${hotel.ciudad})` : ''}
      </span>
      {(ponerCiudad || ponerTitulo) && (
        <div className="opciones compactas">
          {ponerCiudad && (
            <button type="button" className="opcion sugerida" onClick={() => alPonerCiudad(ponerCiudad)}>
              + Ciudad: {ponerCiudad}
            </button>
          )}
          {ponerTitulo && (
            <button type="button" className="opcion sugerida" onClick={() => alPonerTitulo(ponerTitulo)}>
              + Título: {ponerTitulo}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Un día en el modo Organizar: título, ciudad y plan editables ahí mismo; se guarda solo. */
function DiaOrganizar({ fecha, dia, hoteles }: { fecha: string; dia: Dia | undefined; hoteles: ReturnType<typeof hotelesDelDia> }) {
  const { viaje } = useAlba();
  const guardarCiudad = useGuardarCiudad();
  const [form, setForm] = useState({ titulo: dia?.titulo ?? '', ciudad: dia?.ciudad ?? '', plan: dia?.plan.join('\n') ?? '' });
  useGuardadoSolo(form, async (v) => {
    await guardarCiudad(v.ciudad);
    // Lo demás del día (notas, foto) tal como esté ahora, por si ha cambiado en el otro móvil.
    const actual = await viaje.dia(fecha);
    await viaje.guardarDia({
      fecha,
      titulo: v.titulo.trim(),
      ciudad: v.ciudad.trim() || undefined,
      plan: v.plan.split('\n'),
      notas: actual?.notas,
      foto: actual?.foto,
      ultimoTren: actual?.ultimoTren,
    });
  });
  const sugerido = textoSinPlan(hoteles);
  return (
    <div className="fila dia-organizar">
      <FechaBloque fecha={fecha} />
      <div className="texto">
        <input
          className="entrada"
          value={form.titulo}
          placeholder={sugerido ?? 'Título del día'}
          aria-label={`Título del ${fechaCorta(fecha)}`}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
        />
        <SugerenciaHotel
          hoteles={hoteles}
          titulo={form.titulo}
          ciudad={form.ciudad}
          alPonerTitulo={(titulo) => setForm({ ...form, titulo })}
          alPonerCiudad={(ciudad) => setForm({ ...form, ciudad })}
        />
        <CampoCiudad valor={form.ciudad} alCambiar={(ciudad) => setForm({ ...form, ciudad })} />
        <textarea
          className="entrada"
          rows={Math.min(8, Math.max(2, form.plan.split('\n').length))}
          value={form.plan}
          placeholder="Plan: una cosa por línea"
          aria-label={`Plan del ${fechaCorta(fecha)}`}
          onChange={(e) => setForm({ ...form, plan: e.target.value })}
        />
        <Link to={`/dia/${fecha}`} className="muy-pequeno">
          Abrir el día (reservas, trayectos, foto…)
        </Link>
      </div>
    </div>
  );
}

/** Un día: el plan, sus reservas, sus trayectos y dónde se duerme. */
export function DiaPage() {
  const { config } = useAlba();
  const { fecha = config.inicio } = useParams();
  const datos = useConsulta(
    async ({ viaje }) => ({
      dia: await viaje.dia(fecha),
      reservas: await viaje.reservas(),
      trayectos: await viaje.trayectos(),
      alojamientos: await viaje.alojamientos(),
    }),
    [fecha],
  );
  const anterior = sumarDias(fecha, -1);
  const siguiente = sumarDias(fecha, 1);
  const jr = tiene(config, 'jrpass') ? diaJrPass(fecha, config) : undefined;

  return (
    <>
      <Cabecera titulo={fechaLarga(fecha)}>
        {anterior >= config.inicio && (
          <Link to={`/dia/${anterior}`} replace className="accion" aria-label="Día anterior">
            <Icono nombre="anterior" />
          </Link>
        )}
        {siguiente <= config.fin && (
          <Link to={`/dia/${siguiente}`} replace className="accion" aria-label="Día siguiente">
            <Icono nombre="adelante" />
          </Link>
        )}
      </Cabecera>
      {!datos ? (
        <Cargando />
      ) : (
        <main className="contenido">
          <PortadaDia dia={datos.dia} fecha={fecha} ciudad={ciudadDelDia(fecha, datos.dia, datos.alojamientos)}>
            <p className="titulo-dia">{datos.dia?.titulo || 'Sin plan'}</p>
            <div className="pastillas">
              {ciudadDelDia(fecha, datos.dia, datos.alojamientos) && <span className="pastilla blanca">{ciudadDelDia(fecha, datos.dia, datos.alojamientos)}</span>}
              {jr && (
                <span className="pastilla">
                  JR Pass · día {jr} de {config.jrPass.dias}
                </span>
              )}
            </div>
          </PortadaDia>

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

          {fecha === config.inicio && <TarjetaVuelo tramo="ida" siHayDatos />}
          {fecha === config.vueltaFecha && <TarjetaVuelo tramo="vuelta" siHayDatos />}

          <section className="seccion">
            <p className="etiqueta">Reservas y entradas</p>
            {(() => {
              const reservas = ordenarReservas(delDia(datos.reservas, fecha));
              return reservas.length ? (
                <div className="lista">
                  {reservas.map((r) => (
                    <FilaReserva key={r.id} reserva={r} mostrarFecha={false} />
                  ))}
                </div>
              ) : null;
            })()}
            <BotonAnadir to={`/reserva/nueva?fecha=${fecha}`} texto="Añadir reserva" />
          </section>

          <section className="seccion">
            <p className="etiqueta">Trayectos</p>
            {trayectosDelDia(datos.trayectos, fecha).map((t) => (
              <TarjetaTrayecto key={t.id} trayecto={t} />
            ))}
            <BotonAnadir to={`/trayecto/nuevo?fecha=${fecha}`} texto="Añadir trayecto" />
          </section>

          {(() => {
            const noche = alojamientoDeLaNoche(datos.alojamientos, fecha);
            return noche ? <TarjetaAlojamiento alojamiento={noche} titulo="Esa noche" /> : null;
          })()}
        </main>
      )}
    </>
  );
}

export function EditarDiaPage() {
  const { config } = useAlba();
  const { fecha = config.inicio } = useParams();
  const { viaje } = useAlba();
  const navegar = useNavigate();
  // Envuelto en un objeto: así "aún cargando" (undefined) no se confunde con "ese día no existe".
  const cargado = useConsulta(async ({ viaje: v }) => ({ dia: await v.dia(fecha), alojamientos: await v.alojamientos() }), [fecha]);
  const dia = cargado?.dia;
  const [form, setForm] = useState<{ titulo: string; ciudad: string; plan: string; notas: string; ultimoTren: string }>();
  const guardarCiudad = useGuardarCiudad();

  useEffect(() => {
    if (form || !cargado) return;
    const d = cargado.dia;
    setForm({ titulo: d?.titulo ?? '', ciudad: d?.ciudad ?? '', plan: d?.plan.join('\n') ?? '', notas: d?.notas ?? '', ultimoTren: d?.ultimoTren ?? '' });
  }, [cargado, form]);

  if (!form) return <Cargando />;
  const guardar = async () => {
    const nuevo: Dia = {
      fecha,
      titulo: form.titulo.trim(),
      ciudad: form.ciudad,
      plan: form.plan.split('\n'),
      notas: form.notas,
      foto: dia?.foto,
      ultimoTren: form.ultimoTren || undefined,
    };
    await guardarCiudad(form.ciudad);
    await viaje.guardarDia(nuevo);
    navegar(`/dia/${fecha}`, { replace: true });
  };

  return (
    <>
      <Cabecera titulo={`Editar ${fechaCorta(fecha)}`} atras />
      <main className="contenido">
        <form
          className="formulario"
          onSubmit={(e) => {
            e.preventDefault();
            void guardar();
          }}
        >
          <Campo etiqueta="Título">
            <input className="entrada" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          </Campo>
          {cargado && (
            <SugerenciaHotel
              hoteles={hotelesDelDia(cargado.alojamientos, fecha)}
              titulo={form.titulo}
              ciudad={form.ciudad}
              alPonerTitulo={(titulo) => setForm({ ...form, titulo })}
              alPonerCiudad={(ciudad) => setForm({ ...form, ciudad })}
            />
          )}
          <CampoCiudad
            valor={form.ciudad}
            alCambiar={(ciudad) => setForm({ ...form, ciudad })}
            ayuda="Vacía = la del hotel de esa noche. Color y símbolo, en Ajustes del viaje."
          />
          <Campo etiqueta="Plan" ayuda="Una cosa por línea.">
            <textarea className="entrada" rows={9} value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} />
          </Campo>
          <Campo etiqueta="Notas">
            <textarea className="entrada" rows={3} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          </Campo>
          <Campo etiqueta="Último tren al hotel" ayuda="Opcional: miradlo en Google Maps o NAVITIME. Sale en Hoy desde 3 h antes, con aviso la última hora.">
            <div className="fila-ciudad">
              <input className="entrada" type="time" value={form.ultimoTren} onChange={(e) => setForm({ ...form, ultimoTren: e.target.value })} />
              {form.ultimoTren && (
                <button type="button" className="accion-foto peligro" aria-label="Quitar la hora del último tren" onClick={() => setForm({ ...form, ultimoTren: '' })}>
                  <Icono nombre="papelera" tamano={20} />
                </button>
              )}
            </div>
          </Campo>
          <button className="boton shu">Guardar</button>
          {dia && (
            <button
              type="button"
              className="boton peligro"
              onClick={async () => {
                if (!window.confirm('¿Vaciar el día? Se borran el título, el plan y las notas (la foto, las reservas y los trayectos se quedan). También en el otro móvil.')) return;
                await viaje.vaciarDia(fecha);
                navegar(`/dia/${fecha}`, { replace: true });
              }}
            >
              <Icono nombre="vaciar" tamano={18} /> Vaciar el día
            </button>
          )}
        </form>
      </main>
    </>
  );
}
