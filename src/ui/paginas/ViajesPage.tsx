import { useState, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { CONFIG_POR_DEFECTO, type ConfigViaje } from '@/domain/config';
import { fase, sumarDias, type Fecha } from '@/domain/viaje';
import type { ResumenViaje } from '@/domain/ViajesRepositorio';
import type { Lista } from '@/domain/listas';
import { ciudadesDelPais } from '@/domain/ciudadesPais';
import { CAPITALES_ESPANA, IDIOMAS, zonaDeSalida } from '@/domain/idiomas';
import { apartadosDe, apartadosPorDefecto, capitalDe, idiomaDelPais, bandera, paisDe, PAISES, type Apartado } from '@/domain/viajes';

import { cerrarSesion } from '@/infrastructure/api';
import { useAlba } from '../AlbaViajera';
import { CampoFecha } from '../componentes/CampoFecha';
import { PALETA } from '../ciudades';
import { Cabecera, Cargando } from '../componentes/comunes';
import { Campo } from '../componentes/formulario';
import { Icono } from '../componentes/Icono';
import { EditarListas } from './ListasPage';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
const corta = (f: Fecha) => `${Number(f.slice(8, 10))} ${MESES[Number(f.slice(5, 7)) - 1]}`;

/** "11 ene – 2 feb 2027" (o con los dos años si cambia). */
export function fechasDelViaje(c: ConfigViaje): string {
  const [a1, a2] = [c.inicio.slice(0, 4), c.fin.slice(0, 4)];
  return a1 === a2 ? `${corta(c.inicio)} – ${corta(c.fin)} ${a2}` : `${corta(c.inicio)} ${a1} – ${corta(c.fin)} ${a2}`;
}

function estado(c: ConfigViaje, hoy: Fecha): string {
  const f = fase(hoy, c);
  if (f.tipo === 'antes') return f.faltan === 1 ? 'Mañana' : `Faltan ${f.faltan} días`;
  if (f.tipo === 'durante') return `En curso · día ${f.dia} de ${f.total}`;
  return 'Terminado';
}

/** Pantalla inicial: los viajes que estamos preparando (y los ya hechos). */
export function ViajesPage() {
  const { listaViajes, hoy, elegirViaje } = useAlba();
  const navegar = useNavigate();
  if (!listaViajes) return <Cargando />;
  const proximos = listaViajes.filter((v) => v.config.fin >= hoy);
  const hechos = listaViajes.filter((v) => v.config.fin < hoy).reverse();
  const abrir = (v: ResumenViaje) => {
    elegirViaje(v.id);
    navegar('/hoy');
  };

  const tarjeta = (v: ResumenViaje) => (
    <button
      key={v.id}
      className="portada-color tarjeta-viaje"
      style={{ '--c': v.config.color } as CSSProperties}
      onClick={() => abrir(v)}
    >
      <span className="kanji" aria-hidden="true">
        {v.config.simbolo}
      </span>
      <span className="portada-texto">
        <span className="titulo-dia">Alba en {v.config.destino}</span>
        <span className="sub">{fechasDelViaje(v.config)}</span>
        <span className="pastilla">{estado(v.config, hoy)}</span>
      </span>
    </button>
  );

  return (
    <>
      <Cabecera titulo="Alba Viajera" despues={<BotonCerrarSesion />} />
      <main className="contenido">
        {proximos.length === 0 && hechos.length === 0 && <p className="vacio">Aún no hay ningún viaje. ¡A planear el primero!</p>}
        {proximos.map(tarjeta)}
        <Link to="/nuevo-viaje" className="boton anadir">
          <Icono nombre="mas" tamano={18} /> Nuevo viaje
        </Link>
        {hechos.length > 0 && (
          <section className="seccion">
            <p className="etiqueta">Viajes hechos</p>
            {hechos.map(tarjeta)}
          </section>
        )}
      </main>
    </>
  );
}

/** Cerrar la sesión de Cloudflare Access (para empezar una sesión nueva, p. ej. justo antes de un viaje). */
function BotonCerrarSesion() {
  const { pendientes } = useAlba();
  const [saliendo, setSaliendo] = useState(false);
  const salir = () => {
    const aviso = pendientes
      ? `Hay ${pendientes} ${pendientes === 1 ? 'cambio' : 'cambios'} sin subir: no se pierden, se subirán al volver a entrar.

`
      : '';
    if (!window.confirm(`${aviso}¿Cerrar sesión? Para volver a entrar os pedirá el correo y el código. Lo guardado en este móvil se queda.`)) return;
    setSaliendo(true);
    void cerrarSesion();
  };
  return (
    <button className="accion" aria-label="Cerrar sesión" title="Cerrar sesión" disabled={saliendo} onClick={salir}>
      <Icono nombre="salir" />
    </button>
  );
}

/** Interruptores de los apartados que tiene el viaje (solo los que valen para ese país). */
export function ElegirApartados({ pais, valor, alCambiar }: { pais: string; valor: Apartado[]; alCambiar: (a: Apartado[]) => void }) {
  return (
    <div className="lista-apartados">
      {apartadosDe(pais).map((a) => (
        <label key={a.id} className="interruptor apartado">
          <span>
            <span className="negrita" style={{ display: 'block' }}>
              {a.nombre}
            </span>
            <span className="muy-pequeno secundario">{a.detalle}</span>
          </span>
          <input
            type="checkbox"
            checked={valor.includes(a.id)}
            onChange={(e) => alCambiar(e.target.checked ? [...valor, a.id] : valor.filter((x) => x !== a.id))}
          />
        </label>
      ))}
    </div>
  );
}

/** Selector de país; al cambiarlo, el formulario ajusta moneda, hora y apartados. */
export function ElegirPais({ valor, alCambiar }: { valor: string; alCambiar: (codigo: string) => void }) {
  const conocido = paisDe(valor);
  return (
    <select className="entrada" value={valor} onChange={(e) => alCambiar(e.target.value)}>
      {!conocido && <option value={valor}>{valor || 'Elige el país'}</option>}
      {[...PAISES]
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
        .map((p) => (
          <option key={p.codigo} value={p.codigo}>
            {bandera(p.codigo)} {p.nombre}
          </option>
        ))}
    </select>
  );
}

export function ElegirColor({ valor, alCambiar, etiqueta }: { valor: string; alCambiar: (c: string) => void; etiqueta: string }) {
  return (
    <div className="paleta" role="radiogroup" aria-label={etiqueta}>
      {PALETA.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={valor === color}
          aria-label={color}
          className={`muestra ${valor === color ? 'elegida' : ''}`}
          style={{ background: color }}
          onClick={() => alCambiar(color)}
        />
      ))}
    </div>
  );
}

const mismaCiudad = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Las ciudades más visitadas del país como pastillas: las elegidas, rellenas; las demás, con "+".
 * Tocar una la pone o la quita. Las escritas a mano (que no están en la lista) también salen.
 */
export function ChipsCiudades({ pais, elegidas, alCambiar }: { pais: string; elegidas: string[]; alCambiar: (c: string[]) => void }) {
  const delPais = ciudadesDelPais(pais);
  const todas = [...delPais, ...elegidas.filter((e) => !delPais.some((c) => mismaCiudad(c, e)))];
  if (!todas.length) return null;
  return (
    <div className="opciones compactas" role="group" aria-label="Ciudades">
      {todas.map((c) => {
        const si = elegidas.some((e) => mismaCiudad(e, c));
        return (
          <button
            key={c}
            type="button"
            aria-pressed={si}
            className={`opcion ${si ? 'activa' : 'sugerida'}`}
            onClick={() => alCambiar(si ? elegidas.filter((e) => !mismaCiudad(e, c)) : [...elegidas, c])}
          >
            {si ? c : `+ ${c}`}
          </button>
        );
      })}
    </div>
  );
}

/** Las del país que aún no están, como pastillas "+ Ciudad" (en Ajustes). */
export function SugerirCiudades({ pais, excluir, alElegir }: { pais: string; excluir: string[]; alElegir: (ciudad: string) => void }) {
  const lista = ciudadesDelPais(pais).filter((c) => !excluir.some((e) => mismaCiudad(e, c)));
  if (!lista.length) return null;
  return (
    <div className="opciones compactas" role="group" aria-label={`Ciudades de ${paisDe(pais)?.nombre ?? 'este país'}`}>
      {lista.map((c) => (
        <button key={c} type="button" className="opcion sugerida" onClick={() => alElegir(c)}>
          + {c}
        </button>
      ))}
    </div>
  );
}

/** De dónde se sale: país y ciudad (capitales en la lista, o la que se escriba). */
export function ElegirSalida({ valor, alCambiar }: { valor: ConfigViaje['salida']; alCambiar: (s: ConfigViaje['salida']) => void }) {
  const lista = valor.pais === 'ES' ? CAPITALES_ESPANA : [capitalDe(valor.pais)].filter((c): c is string => !!c);
  const enLista = lista.includes(valor.ciudad);
  const [otra, setOtra] = useState(!enLista);
  return (
    <>
      <Campo etiqueta="País de salida">
        <ElegirPais valor={valor.pais} alCambiar={(pais) => {
          const capital = pais === 'ES' ? 'Madrid' : (capitalDe(pais) ?? '');
          setOtra(!capital);
          alCambiar({ pais, ciudad: capital });
        }} />
      </Campo>
      <Campo etiqueta="Ciudad de salida" ayuda={otra ? 'Escribe la población.' : undefined}>
        <select
          className="entrada"
          value={otra ? '__otra' : valor.ciudad}
          onChange={(e) => {
            if (e.target.value === '__otra') {
              setOtra(true);
              alCambiar({ ...valor, ciudad: '' });
            } else {
              setOtra(false);
              alCambiar({ ...valor, ciudad: e.target.value });
            }
          }}
        >
          {lista.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          <option value="__otra">Otra…</option>
        </select>
      </Campo>
      {otra && (
        <input className="entrada" value={valor.ciudad} placeholder="Población" aria-label="Población de salida" onChange={(e) => alCambiar({ ...valor, ciudad: e.target.value })} />
      )}
    </>
  );
}

export function ElegirIdioma({ valor, alCambiar, etiqueta }: { valor: string; alCambiar: (codigo: string) => void; etiqueta: string }) {
  return (
    <select className="entrada" aria-label={etiqueta} value={valor} onChange={(e) => alCambiar(e.target.value)}>
      {IDIOMAS.map((i) => (
        <option key={i.codigo} value={i.codigo}>
          {i.nombre}
        </option>
      ))}
    </select>
  );
}

/** La hora de casa según la salida. */
export const zonaOrigenDe = (s: ConfigViaje['salida']) => zonaDeSalida(s.pais, s.ciudad, paisDe(s.pais)?.zona);

/** Lo que cambia al elegir país: moneda, hora, símbolo y apartados. */
export function segunPais(codigo: string): Pick<ConfigViaje, 'pais' | 'moneda' | 'zona' | 'simbolo' | 'apartados' | 'idiomaDestino'> {
  const p = paisDe(codigo);
  return {
    pais: codigo,
    idiomaDestino: idiomaDelPais(codigo),
    moneda: p?.moneda ?? 'EUR',
    zona: p?.zona ?? 'Europe/Madrid',
    simbolo: codigo === 'JP' ? '日本' : bandera(codigo),
    apartados: apartadosPorDefecto(codigo),
  };
}

interface FormNuevo {
  destino: string;
  pais: string;
  inicio: Fecha;
  horaSalida: string;
  vueltaFecha: Fecha;
  horaVuelta: string;
  color: string;
  apartados: Apartado[];
  /** Ciudades que se van a visitar (luego se eligen en hoteles y días). */
  ciudades: string[];
  listas: Lista[];
  salida: ConfigViaje['salida'];
  idiomaOrigen: string;
  idiomaDestino: string;
}

export function NuevoViajePage() {
  const { viajes, hoy, elegirViaje, listaViajes } = useAlba();
  const navegar = useNavigate();
  const [form, setForm] = useState<FormNuevo>(() => ({
    destino: '',
    pais: 'ES',
    inicio: sumarDias(hoy, 30),
    horaSalida: '10:00',
    vueltaFecha: sumarDias(hoy, 37),
    horaVuelta: '18:00',
    color: PALETA[(listaViajes?.length ?? 0) % PALETA.length],
    apartados: apartadosPorDefecto('ES'),
    ciudades: [],
    listas: [],
    salida: { pais: 'ES', ciudad: 'Madrid' },
    idiomaOrigen: 'es',
    idiomaDestino: idiomaDelPais('ES'),
  }));
  const [ciudadNueva, setCiudadNueva] = useState('');
  const anadirCiudad = () => {
    const n = ciudadNueva.trim();
    if (n && !form.ciudades.some((c) => c.toLowerCase() === n.toLowerCase())) cambiar({ ciudades: [...form.ciudades, n] });
    setCiudadNueva('');
  };
  const [error, setError] = useState<string>();
  const cambiar = (c: Partial<FormNuevo>) => setForm({ ...form, ...c });

  const crear = async () => {
    if (!form.destino.trim()) return setError('Falta el destino.');
    if (form.vueltaFecha < form.inicio) return setError('La vuelta no puede ser antes de la salida.');
    if (!form.salida.ciudad.trim()) return setError('Falta la ciudad de salida.');
    // Una ciudad escrita y sin pulsar "Añadir" también cuenta.
    const nombres = [...form.ciudades, ...(ciudadNueva.trim() && !form.ciudades.includes(ciudadNueva.trim()) ? [ciudadNueva.trim()] : [])];
    const p = segunPais(form.pais);
    const config: ConfigViaje = {
      ...CONFIG_POR_DEFECTO,
      ...p,
      apartados: form.apartados,
      listas: form.listas.filter((l) => l.nombre.trim()).map((l) => ({ ...l, nombre: l.nombre.trim() })),
      destino: form.destino.trim(),
      color: form.color,
      salida: { ...form.salida, ciudad: form.salida.ciudad.trim() },
      zonaOrigen: zonaOrigenDe(form.salida),
      idiomaOrigen: form.idiomaOrigen,
      idiomaDestino: form.idiomaDestino,
      inicio: form.inicio,
      horaSalida: form.horaSalida,
      vueltaFecha: form.vueltaFecha,
      horaVuelta: form.horaVuelta,
      fin: form.vueltaFecha,
      jrPass: { inicio: form.inicio, dias: 7 },
      parques: {
        tdl: { ...CONFIG_POR_DEFECTO.parques.tdl, fecha: form.inicio },
        tds: { ...CONFIG_POR_DEFECTO.parques.tds, fecha: form.inicio },
        usj: { ...CONFIG_POR_DEFECTO.parques.usj, fecha: form.inicio },
      },
      // Las escritas, con color de la paleta; en Japón, las de siempre traen ya su kanji y su posición.
      ciudades: nombres.map((nombre, i) => {
        const deSiempre = form.pais === 'JP' ? CONFIG_POR_DEFECTO.ciudades.find((c) => c.nombre.toLowerCase() === nombre.toLowerCase()) : undefined;
        return deSiempre ?? { nombre, kanji: form.pais === 'JP' ? '旅' : p.simbolo, color: PALETA[i % PALETA.length] };
      }),
    };
    const id = await viajes.crear(config);
    elegirViaje(id);
    navegar('/hoy', { replace: true });
  };

  const pais = paisDe(form.pais);
  return (
    <>
      <Cabecera titulo="Nuevo viaje" atras="/" />
      <main className="contenido">
        <form
          className="formulario"
          onSubmit={(e) => {
            e.preventDefault();
            void crear();
          }}
        >
          <section className="tarjeta">
            <Campo etiqueta="País" ayuda={pais ? `Moneda: ${pais.moneda}. Se puede cambiar después en Ajustes.` : undefined}>
              <ElegirPais valor={form.pais} alCambiar={(c) => cambiar({ pais: c, apartados: apartadosPorDefecto(c), idiomaDestino: idiomaDelPais(c), ciudades: [] })} />
            </Campo>
            <Campo etiqueta="Destino" ayuda={form.destino.trim() ? `Se llamará «Alba en ${form.destino.trim()}».` : 'El país, una ciudad o una región: toca una sugerencia o escríbelo.'}>
              <input className="entrada" value={form.destino} placeholder={pais?.nombre ?? 'Destino'} onChange={(e) => cambiar({ destino: e.target.value })} />
            </Campo>
            {pais && (
              <div className="opciones compactas" role="group" aria-label="Sugerencias de destino">
                {[pais.nombre, ...ciudadesDelPais(form.pais).slice(0, 7)].map((d) => (
                  <button key={d} type="button" className={`opcion ${mismaCiudad(form.destino, d) ? 'activa' : 'sugerida'}`} onClick={() => cambiar({ destino: d })}>
                    {d}
                  </button>
                ))}
              </div>
            )}
            <div className="campo">
              <span>Ciudades que vais a visitar</span>
              <small>Toca para añadirlas o quitarlas. Luego se eligen al meter hoteles y días, y el itinerario se colorea solo.</small>
            </div>
            <ChipsCiudades pais={form.pais} elegidas={form.ciudades} alCambiar={(ciudades) => cambiar({ ciudades })} />
            <div className="fila-ciudad">
              <input
                className="entrada"
                value={ciudadNueva}
                placeholder="Otra ciudad"
                enterKeyHint="done"
                onChange={(e) => setCiudadNueva(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    anadirCiudad();
                  }
                }}
              />
              <button type="button" className="boton claro" onClick={anadirCiudad} disabled={!ciudadNueva.trim()}>
                Añadir
              </button>
            </div>
          </section>

          <section className="tarjeta">
            <p className="etiqueta">Desde dónde salís</p>
            <ElegirSalida valor={form.salida} alCambiar={(salida) => cambiar({ salida })} />
          </section>

          <section className="tarjeta">
            <p className="etiqueta">Vuelos</p>
            <div className="dos-columnas">
              <Campo etiqueta="Salida">
                <CampoFecha etiqueta="Salida" valor={form.inicio} alCambiar={(inicio) => inicio && cambiar({ inicio })} />
              </Campo>
              <Campo etiqueta={`Hora (${form.salida.ciudad.trim() || 'salida'})`}>
                <input className="entrada" type="time" value={form.horaSalida} onChange={(e) => e.target.value && cambiar({ horaSalida: e.target.value })} />
              </Campo>
              <Campo etiqueta="Vuelta">
                <CampoFecha etiqueta="Vuelta" valor={form.vueltaFecha} alCambiar={(vueltaFecha) => vueltaFecha && cambiar({ vueltaFecha })} />
              </Campo>
              <Campo etiqueta="Hora (allí)">
                <input className="entrada" type="time" value={form.horaVuelta} onChange={(e) => e.target.value && cambiar({ horaVuelta: e.target.value })} />
              </Campo>
            </div>
          </section>

          <section className="tarjeta">
            <p className="etiqueta">Color</p>
            <ElegirColor valor={form.color} alCambiar={(color) => cambiar({ color })} etiqueta="Color del viaje" />
          </section>

          <section className="tarjeta">
            <p className="etiqueta">Qué queréis tener en este viaje</p>
            <p className="muy-pequeno secundario" style={{ margin: 0 }}>
              Hoy, el itinerario y los hoteles van siempre. Lo demás se puede añadir o quitar luego en Ajustes.
            </p>
            <ElegirApartados pais={form.pais} valor={form.apartados} alCambiar={(apartados) => cambiar({ apartados })} />
            {form.apartados.includes('frases') && (
              <div className="dos-columnas">
                <Campo etiqueta="Frases desde">
                  <ElegirIdioma etiqueta="Vuestro idioma" valor={form.idiomaOrigen} alCambiar={(idiomaOrigen) => cambiar({ idiomaOrigen })} />
                </Campo>
                <Campo etiqueta="Traducidas al">
                  <ElegirIdioma etiqueta="Idioma de allí" valor={form.idiomaDestino} alCambiar={(idiomaDestino) => cambiar({ idiomaDestino })} />
                </Campo>
              </div>
            )}
          </section>

          <section className="tarjeta">
            <p className="etiqueta">Apartados vuestros</p>
            <p className="muy-pequeno secundario" style={{ margin: 0 }}>
              Listas con casilla, precio orientativo, tienda y ciudad: equipaje, compras, recados… Salen en Más.
            </p>
            <EditarListas listas={form.listas} alCambiar={(listas) => cambiar({ listas })} />
          </section>

          {error && <p className="error">{error}</p>}
          <button className="boton shu">Crear el viaje</button>
        </form>
      </main>
    </>
  );
}
