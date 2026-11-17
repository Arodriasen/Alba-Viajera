import { useEffect, useState, type CSSProperties } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { diasEntre, fechaCorta, ordenarAlojamientos, type Alojamiento, type EstadoAlojamiento, fechasParaIncluir, nochesParaHotel, nochesSinHotel } from '@/domain/viaje';

import { useAlba, useConsulta } from '../AlbaViajera';
import { BotonAnadir, Cabecera, Cargando, TarjetaAlojamiento } from '../componentes/comunes';
import { Campo, confirmarBorrado, Opciones } from '../componentes/formulario';
import { Icono } from '../componentes/Icono';
import { CampoFecha } from '../componentes/CampoFecha';
import { CampoCiudad, useGuardarCiudad } from '../componentes/CampoCiudad';
import { ciudad } from '../ciudades';

const ESTADOS: { valor: EstadoAlojamiento; texto: string; clase: string }[] = [
  { valor: 'reservado', texto: 'Reservado', clase: 'matcha' },
  { valor: 'pendiente', texto: 'Por decidir', clase: 'ocre' },
  { valor: 'cancelar', texto: 'Cancelar', clase: 'shu' },
  { valor: 'cancelado', texto: 'Cancelado', clase: '' },
];
const estado = (e: EstadoAlojamiento) => ESTADOS.find((x) => x.valor === e)!;

function noches(a: Alojamiento): string | undefined {
  if (!a.entrada || !a.salida) return undefined;
  const n = diasEntre(a.entrada, a.salida);
  return `${fechaCorta(a.entrada)} → ${fechaCorta(a.salida)} · ${n} ${n === 1 ? 'noche' : 'noches'}`;
}

export function AlojamientosPage() {
  const { config } = useAlba();
  const lista = useConsulta(({ viaje }) => viaje.alojamientos(), []);
  return (
    <>
      <Cabecera titulo="Hoteles" />
      <main className="contenido">
        {!lista ? (
          <Cargando />
        ) : lista.length === 0 ? (
          <p className="vacio">Aún no hay alojamientos.</p>
        ) : (
          <div className="lista">
            {ordenarAlojamientos(lista).map((a) => (
              <Link
                key={a.id}
                to={`/alojamiento/${a.id}`}
                className="fila con-franja"
                style={{ '--c': ciudad(a.ciudad, config.ciudades).color, ...(a.estado === 'cancelado' ? { opacity: 0.5 } : {}) } as CSSProperties}
              >
                <span className="texto">
                  <span className="negrita">{a.nombre}</span>
                  <span className="pequeno secundario">{[a.ciudad, noches(a)].filter(Boolean).join(' · ')}</span>
                </span>
                {a.estado !== 'reservado' && <span className={`pastilla ${estado(a.estado).clase}`}>{estado(a.estado).texto}</span>}
                <span className="flecha">
                  <Icono nombre="chevron" tamano={18} />
                </span>
              </Link>
            ))}
          </div>
        )}
        <BotonAnadir to="/alojamiento/nuevo" texto="Añadir alojamiento" />
      </main>
    </>
  );
}

export function AlojamientoPage() {
  const { id = '' } = useParams();
  const a = useConsulta(async ({ viaje }) => ({ a: await viaje.alojamiento(id) }), [id]);
  if (!a) return <Cargando />;
  if (!a.a) {
    return (
      <>
        <Cabecera titulo="Alojamiento" atras />
        <p className="vacio">Este alojamiento ya no existe.</p>
      </>
    );
  }
  const al = a.a;
  return (
    <>
      <Cabecera titulo={al.ciudad ?? 'Alojamiento'} atras>
        <Link to={`/alojamiento/${al.id}/editar`} className="accion-texto">
          <Icono nombre="editar" tamano={18} /> Editar
        </Link>
      </Cabecera>
      <main className="contenido">
        <div className="portada">
          <p className="titulo-dia">{al.nombre}</p>
          <div className="pastillas">
            <span className={`pastilla ${estado(al.estado).clase}`}>{estado(al.estado).texto}</span>
            {noches(al) && <span className="pastilla">{noches(al)}</span>}
            {al.checkin && <span className="pastilla">check-in {al.checkin}</span>}
            {al.checkout && <span className="pastilla">check-out {al.checkout}</span>}
          </div>
        </div>
        <TarjetaAlojamiento alojamiento={al} />
        {al.notas && (
          <div className="tarjeta">
            <p className="pre" style={{ margin: 0 }}>{al.notas}</p>
          </div>
        )}
        {al.enlace && (
          <a className="boton claro" href={al.enlace} target="_blank" rel="noreferrer">
            <Icono nombre="enlace" tamano={18} /> Abrir la reserva
          </a>
        )}
      </main>
    </>
  );
}

type Form = Omit<Alojamiento, 'id'>;

export function EditarAlojamientoPage() {
  const { id } = useParams();
  const nuevo = !id || id === 'nuevo';
  const { viaje, config } = useAlba();
  const navegar = useNavigate();
  const cargado = useConsulta(
    async ({ viaje: v }) => ({ a: nuevo ? undefined : await v.alojamiento(id!), dias: await v.dias(), alojamientos: await v.alojamientos() }),
    [id],
  );
  const [form, setForm] = useState<Form>();
  const guardarCiudad = useGuardarCiudad();

  useEffect(() => {
    if (form || !cargado) return;
    setForm(cargado.a ?? { nombre: '', estado: 'pendiente' });
  }, [cargado, form]);

  if (!form || !cargado) return <Cargando />;
  const cambiar = (c: Partial<Form>) => setForm({ ...form, ...c });
  const texto = (campo: keyof Form, etiqueta: string, ayuda?: string, extra?: { placeholder?: string; lang?: string }) => (
    <Campo etiqueta={etiqueta} ayuda={ayuda}>
      <input className="entrada" value={(form[campo] as string) ?? ''} onChange={(e) => cambiar({ [campo]: e.target.value || undefined })} {...extra} />
    </Campo>
  );

  return (
    <>
      <Cabecera titulo={nuevo ? 'Nuevo alojamiento' : 'Editar alojamiento'} atras />
      <main className="contenido">
        <form
          className="formulario"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!form.nombre.trim()) return;
            const nuevoId = cargado.a?.id ?? crypto.randomUUID();
            await guardarCiudad(form.ciudad);
            await viaje.guardarAlojamiento({ ...form, ciudad: form.ciudad?.trim() || undefined, id: nuevoId });
            // Que el viaje incluya las noches del hotel.
            const actual = await viaje.config();
            const ampliar = form.estado !== 'cancelado' ? fechasParaIncluir(actual, form) : undefined;
            if (
              ampliar &&
              window.confirm(
                `El hotel cae fuera del viaje (${fechaCorta(actual.inicio)} – ${fechaCorta(actual.fin)}). ¿Ampliar el viaje del ${fechaCorta(ampliar.inicio)} al ${fechaCorta(ampliar.fin)}?`,
              )
            )
              await viaje.guardarConfig({ ...actual, ...ampliar });
            navegar(`/alojamiento/${nuevoId}`, { replace: true });
          }}
        >
          <Campo etiqueta="Nombre">
            <input className="entrada" required value={form.nombre} onChange={(e) => cambiar({ nombre: e.target.value })} />
          </Campo>
          <div className="campo">
            <span>Estado</span>
            <Opciones valor={form.estado} alCambiar={(e) => cambiar({ estado: e })} opciones={ESTADOS} />
          </div>
          <CampoCiudad
            valor={form.ciudad ?? ''}
            alCambiar={(ciudad) => cambiar({ ciudad: ciudad || undefined })}
            ayuda="Los días de sus noches salen en esta ciudad si no tienen otra."
          />
          <div className="dos-columnas">
            <Campo etiqueta="Llegada">
              <CampoFecha opcional etiqueta="Llegada" valor={form.entrada} alCambiar={(entrada) => cambiar({ entrada })} />
            </Campo>
            <Campo etiqueta="Salida">
              <CampoFecha opcional etiqueta="Salida" valor={form.salida} alCambiar={(salida) => cambiar({ salida })} />
            </Campo>
            <Campo etiqueta="Check-in">
              <input className="entrada" type="time" value={form.checkin ?? ''} onChange={(e) => cambiar({ checkin: e.target.value || undefined })} />
            </Campo>
            <Campo etiqueta="Check-out">
              <input className="entrada" type="time" value={form.checkout ?? ''} onChange={(e) => cambiar({ checkout: e.target.value || undefined })} />
            </Campo>
          </div>
          {!form.entrada &&
            !form.salida &&
            (() => {
              // Las noches que El viaje aún tiene sin hotel (sin contar este), por si coinciden.
              const otros = cargado.alojamientos.filter((x) => x.id !== cargado.a?.id);
              const noches = nochesParaHotel(nochesSinHotel(config, cargado.dias, otros), form.ciudad);
              if (!noches.length) return null;
              return (
                <div className="sugerencia">
                  <span className="muy-pequeno secundario">Noches sin hotel en El viaje:</span>
                  <div className="opciones compactas">
                    {noches.slice(0, 6).map((n) => (
                      <button
                        key={n.entrada}
                        type="button"
                        className="opcion sugerida"
                        onClick={() => cambiar({ entrada: n.entrada, salida: n.salida, ciudad: form.ciudad || n.ciudad })}
                      >
                        {n.ciudad ? `${n.ciudad} · ` : ''}
                        {fechaCorta(n.entrada)} – {fechaCorta(n.salida)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          {texto('direccion', 'Dirección', 'La que se busca en Google Maps.')}
          {config.pais === 'JP'
            ? texto('direccionJa', 'Dirección en japonés', 'La que se enseña al taxista.', { lang: 'ja' })
            : texto('direccionJa', 'Dirección en el idioma de allí', 'La que se enseña al taxista (opcional).')}
          {texto('enlace', 'Enlace de la reserva', undefined, { placeholder: 'https://…' })}
          <Campo etiqueta="Notas">
            <textarea className="entrada" rows={4} value={form.notas ?? ''} onChange={(e) => cambiar({ notas: e.target.value || undefined })} />
          </Campo>
          <button className="boton shu">Guardar</button>
          {!nuevo && (
            <button
              type="button"
              className="boton peligro"
              onClick={async () => {
                if (!confirmarBorrado(form.nombre)) return;
                await viaje.borrarAlojamiento(cargado.a!.id);
                navegar('/hotel', { replace: true });
              }}
            >
              Borrar alojamiento
            </button>
          )}
        </form>
      </main>
    </>
  );
}
