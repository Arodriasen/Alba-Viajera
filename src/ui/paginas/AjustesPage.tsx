import { useEffect, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';

import { tiene, type ConfigViaje, type IdParque } from '@/domain/config';
import { parquesDe } from '@/domain/parques';
import { diasEntre } from '@/domain/viaje';
import { apartadosDe, tituloDelViaje, zonaValida } from '@/domain/viajes';

import { useAlba } from '../AlbaViajera';
import { PALETA } from '../ciudades';
import { Cabecera, Cargando } from '../componentes/comunes';
import { Campo, Opciones } from '../componentes/formulario';
import { Icono } from '../componentes/Icono';
import { CampoFecha } from '../componentes/CampoFecha';
import { ListasDelViaje } from './ListasPage';
import { ElegirApartados, ElegirColor, ElegirIdioma, ElegirPais, ElegirSalida, segunPais, SugerirCiudades, zonaOrigenDe } from './ViajesPage';

/** Ajustes del viaje abierto: destino, apartados, fechas, vuelos, JR Pass, parques y ciudades. Se comparten entre los dos móviles. */
export function AjustesPage() {
  const { viaje, viajes, fotos } = useAlba();
  const navegar = useNavigate();
  const [form, setForm] = useState<ConfigViaje>();
  const [error, setError] = useState<string>();

  // Se carga una vez; después el formulario es nuestro (no lo pisa un cambio que llegue a medias).
  useEffect(() => {
    void viaje.config().then((c) => setForm((f) => f ?? c));
  }, [viaje]);
  if (!form) return <Cargando />;

  const cambiar = (c: Partial<ConfigViaje>) => setForm({ ...form, ...c });
  const cambiarParque = (id: IdParque, c: Partial<ConfigViaje['parques'][IdParque]>) =>
    cambiar({ parques: { ...form.parques, [id]: { ...form.parques[id], ...c } } });
  const cambiarCiudad = (i: number, c: Partial<ConfigViaje['ciudades'][number]>) =>
    cambiar({ ciudades: form.ciudades.map((x, j) => (j === i ? { ...x, ...c } : x)) });
  const japon = form.pais === 'JP';
  const simboloCiudad = japon ? '旅' : '✈︎';

  const guardar = async () => {
    if (!form.destino.trim()) return setError('Falta el destino.');
    if (form.fin < form.inicio) return setError('La vuelta no puede ser antes de la salida.');
    if (form.ciudades.some((c) => !c.nombre.trim())) return setError('Hay una ciudad sin nombre.');
    if (!/^[A-Z]{3}$/.test(form.moneda)) return setError('La moneda va con su código de 3 letras (EUR, USD, JPY…).');
    if (!zonaValida(form.zona)) return setError('La zona horaria no es válida (por ejemplo, Europe/Rome).');
    if (!form.salida.ciudad.trim()) return setError('Falta la ciudad de salida.');
    setError(undefined);
    // Los apartados vuestros se guardan solos al tocarlos: aquí se respetan tal como estén.
    const { listas } = await viaje.config();
    // Lo que solo vale en Japón se quita si el país ya no es Japón.
    const validos = new Set(apartadosDe(form.pais).map((a) => a.id));
    await viaje.guardarConfig({
      ...form,
      destino: form.destino.trim(),
      salida: { ...form.salida, ciudad: form.salida.ciudad.trim() },
      simbolo: form.simbolo.trim() || (japon ? '日本' : '✈️'),
      apartados: form.apartados.filter((a) => validos.has(a)),
      listas,
      ciudades: form.ciudades.map((c) => ({ ...c, nombre: c.nombre.trim(), kanji: c.kanji.trim() || simboloCiudad })),
    });
    navegar(-1);
  };

  const borrarViaje = async () => {
    if (!window.confirm(`¿Borrar «${tituloDelViaje(form.destino)}» con todo lo que tiene (días, hoteles, reservas, gastos y fotos)? Se borrará también en el otro móvil y no se puede deshacer.`)) return;
    const suyas = await viajes.borrar(viaje.id);
    for (const nombre of suyas) await fotos.olvidar(nombre);
    navegar('/', { replace: true });
  };

  const fecha = (valor: string, al: (v: string) => void) => (
    <CampoFecha valor={valor} alCambiar={(v) => v && al(v)} />
  );
  const hora = (valor: string, al: (v: string) => void) => (
    <input className="entrada" type="time" value={valor} onChange={(e) => e.target.value && al(e.target.value)} />
  );
  const dias = diasEntre(form.inicio, form.fin) + 1;

  return (
    <>
      <Cabecera titulo="Ajustes del viaje" atras />
      <main className="contenido">
        <form
          className="formulario"
          onSubmit={(e) => {
            e.preventDefault();
            void guardar();
          }}
        >
          <section className="tarjeta">
            <p className="etiqueta">El viaje</p>
            <Campo etiqueta="Destino" ayuda={`Se llama «${tituloDelViaje(form.destino)}».`}>
              <input className="entrada" value={form.destino} onChange={(e) => cambiar({ destino: e.target.value })} />
            </Campo>
            <Campo etiqueta="País">
              <ElegirPais
                valor={form.pais}
                alCambiar={(c) => {
                  const p = segunPais(c);
                  // Al cambiar de país se proponen su moneda, su hora y su símbolo; los apartados se respetan si siguen valiendo.
                  const validos = new Set(apartadosDe(c).map((a) => a.id));
                  cambiar({ ...p, apartados: form.apartados.filter((a) => validos.has(a)) });
                }}
              />
            </Campo>
            <div className="dos-columnas">
              <Campo etiqueta="Moneda">
                <input
                  className="entrada"
                  value={form.moneda}
                  maxLength={3}
                  autoCapitalize="characters"
                  onChange={(e) => cambiar({ moneda: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') })}
                />
              </Campo>
              <Campo etiqueta={japon ? 'Kanji de portada' : 'Símbolo de portada'}>
                <input className="entrada" lang={japon ? 'ja' : undefined} value={form.simbolo} maxLength={8} onChange={(e) => cambiar({ simbolo: e.target.value })} />
              </Campo>
            </div>
            <Campo etiqueta="Hora del destino" ayuda="Zona horaria; se pone sola al elegir el país.">
              <input className="entrada" value={form.zona} onChange={(e) => cambiar({ zona: e.target.value.trim() })} />
            </Campo>
            <div className="campo">
              <span>Color</span>
              <ElegirColor valor={form.color} alCambiar={(color) => cambiar({ color })} etiqueta="Color del viaje" />
            </div>
          </section>

          <section className="tarjeta">
            <p className="etiqueta">Apartados</p>
            <p className="muy-pequeno secundario" style={{ margin: 0 }}>
              Hoy, el itinerario y los hoteles van siempre. Quitar un apartado no borra lo que tenga: vuelve al activarlo.
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
            <p className="etiqueta">Desde dónde salís</p>
            <ElegirSalida valor={form.salida} alCambiar={(salida) => cambiar({ salida, zonaOrigen: zonaOrigenDe(salida) })} />
          </section>

          <section className="tarjeta">
            <p className="etiqueta">Apartados vuestros</p>
            <p className="muy-pequeno secundario" style={{ margin: 0 }}>
              Listas con casilla, precio orientativo, tienda y ciudad. Salen en Más. Se guardan al momento.
            </p>
            <ListasDelViaje />
          </section>

          <section className="tarjeta">
            <p className="etiqueta">Vuelos</p>
            <div className="dos-columnas">
              <Campo etiqueta="Salida">{fecha(form.inicio, (inicio) => cambiar({ inicio }))}</Campo>
              <Campo etiqueta={`Hora (${form.salida.ciudad.trim() || 'salida'})`}>{hora(form.horaSalida, (horaSalida) => cambiar({ horaSalida }))}</Campo>
              <Campo etiqueta="Vuelo de vuelta">{fecha(form.vueltaFecha, (vueltaFecha) => cambiar({ vueltaFecha }))}</Campo>
              <Campo etiqueta="Hora (allí)">{hora(form.horaVuelta, (horaVuelta) => cambiar({ horaVuelta }))}</Campo>
            </div>
            <Campo etiqueta="Llegada a casa" ayuda={`El viaje tiene ${dias} ${dias === 1 ? 'día' : 'días'} en la app.`}>
              {fecha(form.fin, (fin) => cambiar({ fin }))}
            </Campo>
          </section>

          {tiene(form, 'jrpass') && (
            <section className="tarjeta">
              <p className="etiqueta">JR Pass</p>
              <Campo etiqueta="Primer día">{fecha(form.jrPass.inicio, (inicio) => cambiar({ jrPass: { ...form.jrPass, inicio } }))}</Campo>
              <div className="campo">
                <span>Días</span>
                <Opciones
                  valor={String(form.jrPass.dias)}
                  alCambiar={(d) => cambiar({ jrPass: { ...form.jrPass, dias: Number(d) } })}
                  opciones={['7', '14', '21'].map((d) => ({ valor: d, texto: `${d} días` }))}
                />
              </div>
            </section>
          )}

          {tiene(form, 'parques') && (
            <section className="tarjeta">
              <p className="etiqueta">Parques</p>
              {parquesDe(form).map((p) => (
                <div key={p.id} className="ajuste-parque" style={{ '--c': p.color } as CSSProperties}>
                  <span className="negrita">
                    <span className="kanji-peq">{p.kanji}</span> {p.nombre}
                  </span>
                  <Campo etiqueta="Día">{fecha(p.fecha, (f) => cambiarParque(p.id, { fecha: f }))}</Campo>
                  <Campo etiqueta="Al entrar">
                    <textarea className="entrada" rows={3} value={p.primero} onChange={(e) => cambiarParque(p.id, { primero: e.target.value })} />
                  </Campo>
                </div>
              ))}
            </section>
          )}

          <section className="tarjeta">
            <p className="etiqueta">Ciudades</p>
            <p className="muy-pequeno secundario" style={{ margin: 0 }}>
              El color y el {japon ? 'kanji' : 'símbolo'} de cada ciudad en las portadas y en el itinerario. Una ciudad que no esté aquí sale con un color
              automático.
            </p>
            {form.ciudades.map((c, i) => (
              <div key={i} className="ajuste-ciudad">
                <div className="fila-ciudad">
                  <input
                    className="entrada kanji-entrada"
                    lang={japon ? 'ja' : undefined}
                    value={c.kanji}
                    aria-label={japon ? 'Kanji' : 'Símbolo'}
                    maxLength={4}
                    onChange={(e) => cambiarCiudad(i, { kanji: e.target.value })}
                    style={{ color: c.color }}
                  />
                  <input
                    className="entrada"
                    value={c.nombre}
                    aria-label="Nombre de la ciudad"
                    placeholder="Ciudad"
                    onChange={(e) => cambiarCiudad(i, { nombre: e.target.value, lat: undefined, lon: undefined, pref: undefined, zona: undefined })}
                  />
                  <button
                    type="button"
                    className="accion-foto peligro"
                    aria-label={`Quitar ${c.nombre}`}
                    onClick={() => cambiar({ ciudades: form.ciudades.filter((_, j) => j !== i) })}
                  >
                    <Icono nombre="papelera" tamano={20} />
                  </button>
                </div>
                <ElegirColor valor={c.color} alCambiar={(color) => cambiarCiudad(i, { color })} etiqueta={`Color de ${c.nombre}`} />
              </div>
            ))}
            <SugerirCiudades
              pais={form.pais}
              excluir={form.ciudades.map((c) => c.nombre)}
              alElegir={(nombre) => cambiar({ ciudades: [...form.ciudades, { nombre, kanji: simboloCiudad, color: PALETA[form.ciudades.length % PALETA.length] }] })}
            />
            <button
              type="button"
              className="boton anadir"
              onClick={() => cambiar({ ciudades: [...form.ciudades, { nombre: '', kanji: simboloCiudad, color: PALETA[form.ciudades.length % PALETA.length] }] })}
            >
              <Icono nombre="mas" tamano={18} /> Añadir ciudad
            </button>
          </section>

          {error && <p className="error">{error}</p>}
          <button className="boton shu">Guardar</button>
          <p className="muy-pequeno secundario centrado" style={{ margin: 0 }}>
            Los cambios se guardan para los dos móviles.
          </p>

          <button type="button" className="boton peligro" onClick={() => void borrarViaje()}>
            Borrar este viaje
          </button>
        </form>
      </main>
    </>
  );
}
