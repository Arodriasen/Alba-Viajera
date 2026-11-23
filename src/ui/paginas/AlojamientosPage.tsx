import { useEffect, useState, type CSSProperties } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { diasEntre, fechaCorta, ordenarAlojamientos, type Alojamiento, type EstadoAlojamiento, fechasParaIncluir, nochesParaHotel, nochesSinHotel } from '@/domain/viaje';
import { sinViaje } from '@/domain/viajes';

import { useAlba, useConsulta } from '../AlbaViajera';
import { BotonAnadir, Cabecera, Cargando, TarjetaAlojamiento } from '../componentes/comunes';
import { Campo, confirmarBorrado, Opciones } from '../componentes/formulario';
import { Icono } from '../componentes/Icono';
import { CampoFecha } from '../componentes/CampoFecha';
import { CampoCiudad, useGuardarCiudad } from '../componentes/CampoCiudad';
import { ciudad } from '../ciudades';
import { aEuros, enMoneda, euros, gastoDelHotel, hotelConPrecio, hotelDelGasto, idGastoDeHotel, simboloMoneda, type Gasto } from '@/domain/gastos';
import { useCambio } from './GastosPage';

/**
 * Deja el gasto del hotel como toca: lo crea o lo actualiza si está pagado y lo quita si no (sin precio,
 * sin pagar, cancelado o borrado). `porEuro` = 1 € = N de la moneda del hotel.
 */
function useGastoDelHotel() {
  const { viaje, hoy, fotos } = useAlba();
  /** `enlazar`: un gasto apuntado a mano antes que pasa a ser el del hotel (se conserva lo suyo y deja de existir suelto). */
  return async (a: Alojamiento | undefined, alojamientoId: string, porEuro: number, enlazar?: Gasto) => {
    const gastoId = idGastoDeHotel(alojamientoId);
    const existente = (await viaje.gasto(gastoId)) ?? enlazar;
    const categorias = (await viaje.presupuesto()).categorias.map((c) => c.id);
    const g = a && gastoDelHotel(a, { existente, porEuro, hoy, categorias });
    if (g) {
      await viaje.guardarGasto(g);
      // El suelto, fuera (su foto ya es la del gasto del hotel).
      if (enlazar && enlazar.id !== g.id) await viaje.borrarGasto(enlazar.id);
    } else if (existente && existente.id === gastoId) {
      await viaje.borrarGasto(gastoId);
      if (existente.foto) await fotos.olvidar(existente.foto);
    }
  };
}

/** "90.000" o "312,50" → número (NaN si no lo es). */
const aNumero = (t: string) => {
  const n = Number(t.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};

/** "¥90.000 · pagado" / "¥90.000 · se paga allí" (o undefined sin precio). */
function textoPrecio(a: Alojamiento): string | undefined {
  if (!a.precio) return undefined;
  return `${enMoneda(a.precio, a.moneda ?? 'EUR')} · ${a.pagado ? 'pagado' : 'se paga allí'}`;
}

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
                  {hotelConPrecio(a) && <span className="muy-pequeno secundario">{textoPrecio(a)}</span>}
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
  const { viaje } = useAlba();
  const a = useConsulta(async ({ viaje }) => ({ a: await viaje.alojamiento(id) }), [id]);
  const moneda = a?.a?.moneda ?? 'EUR';
  const cambio = useCambio(moneda);
  const guardarGasto = useGastoDelHotel();
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
            {hotelConPrecio(al) && al.pagado && <span className="pastilla">{textoPrecio(al)}</span>}
          </div>
        </div>
        {hotelConPrecio(al) && !al.pagado && (
          <div className="tarjeta fila-tarjeta">
            <span className="icono-redondo">
              <Icono nombre="cartera" tamano={20} />
            </span>
            <span className="texto">
              <span className="etiqueta">Se paga en el hotel</span>
              <span className="negrita">
                {enMoneda(al.precio!, moneda)}
                {moneda !== 'EUR' && cambio && <span className="pequeno secundario"> ≈ {euros(aEuros(al.precio!, moneda, cambio.porEuro))}</span>}
              </span>
            </span>
            {moneda === 'EUR' || cambio ? (
              <button
                type="button"
                className="accion-texto"
                onClick={async () => {
                  const pagado = { ...al, pagado: true };
                  await viaje.guardarAlojamiento(pagado);
                  await guardarGasto(pagado, al.id, moneda === 'EUR' ? 1 : cambio!.porEuro);
                }}
              >
                <Icono nombre="check" tamano={16} /> Pagado
              </button>
            ) : (
              // Sin cambio guardado para esa moneda: se escribe en el formulario.
              <Link to={`/alojamiento/${al.id}/editar`} className="accion-texto">
                Pagado…
              </Link>
            )}
          </div>
        )}
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
    async ({ viaje: v }) => ({
      a: nuevo ? undefined : await v.alojamiento(id!),
      dias: await v.dias(),
      alojamientos: await v.alojamientos(),
      gastos: await v.gastos(),
    }),
    [id],
  );
  const [form, setForm] = useState<Form>();
  /** Gasto apuntado a mano antes que pasará a ser el del hotel al guardar. */
  const [enlazar, setEnlazar] = useState<Gasto>();
  /** El precio tal como se escribe ("90.000", "312,50"). */
  const [precioTexto, setPrecioTexto] = useState('');
  /** 1 € = N, escrito a mano solo si no hay cambio automático para esa moneda. */
  const [cambioTexto, setCambioTexto] = useState('');
  const guardarCiudad = useGuardarCiudad();
  const guardarGasto = useGastoDelHotel();
  const moneda = form?.moneda ?? config.moneda;
  const cambioAuto = useCambio(moneda);

  useEffect(() => {
    if (form || !cargado) return;
    setForm(cargado.a ?? { nombre: '', estado: 'pendiente' });
    if (cargado.a?.precio) setPrecioTexto(String(cargado.a.precio).replace('.', ','));
  }, [cargado, form]);

  if (!form || !cargado) return <Cargando />;
  const cambiar = (c: Partial<Form>) => setForm({ ...form, ...c });
  const precio = precioTexto.trim() ? aNumero(precioTexto) : undefined;
  const precioMal = precio !== undefined && !(precio > 0);
  const porEuro = moneda === 'EUR' ? 1 : (cambioAuto?.porEuro ?? aNumero(cambioTexto));
  const sinCambio = moneda !== 'EUR' && !(porEuro > 0);
  // Pagado sin cambio para pasarlo a euros: hay que escribirlo.
  const faltaCambio = Boolean(precio && form.pagado && sinCambio);
  const monedas = [...new Set([config.moneda, 'EUR', moneda])];
  // Gastos de alojamiento apuntados a mano (para no contar dos veces), si este hotel aún no tiene el suyo.
  const yaTieneGasto = Boolean(cargado.a && cargado.gastos.some((g) => hotelDelGasto(g.id) === sinViaje(cargado.a!.id)));
  const sueltos = yaTieneGasto ? [] : cargado.gastos.filter((g) => g.categoria === 'alojamiento' && !hotelDelGasto(g.id));
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
            if (!form.nombre.trim() || precioMal || faltaCambio) return;
            const nuevoId = cargado.a?.id ?? crypto.randomUUID();
            await guardarCiudad(form.ciudad);
            const guardado: Alojamiento = {
              ...form,
              ciudad: form.ciudad?.trim() || undefined,
              id: nuevoId,
              precio,
              moneda: precio ? moneda : undefined,
              pagado: Boolean(precio && form.pagado),
            };
            await viaje.guardarAlojamiento(guardado);
            // Pagado: su gasto en el presupuesto (creado, actualizado o quitado).
            await guardarGasto(guardado, nuevoId, porEuro, guardado.pagado ? enlazar : undefined);
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
          <Campo etiqueta="Precio" ayuda="De toda la estancia (opcional). Pagado, cuenta como gasto en Presupuesto → Alojamiento.">
            <span className="euros-entrada">
              <input
                className="entrada"
                inputMode="decimal"
                placeholder="0"
                value={precioTexto}
                onChange={(e) => setPrecioTexto(e.target.value.replace(/[^\d.,]/g, ''))}
              />
              <span>{simboloMoneda(moneda)}</span>
            </span>
          </Campo>
          {precioMal && <p className="error">El precio no es un número.</p>}
          {monedas.length > 1 && (
            <Opciones
              valor={moneda}
              alCambiar={(m) => {
                cambiar({ moneda: m });
                setCambioTexto('');
              }}
              opciones={monedas.map((m) => ({ valor: m, texto: m === 'EUR' ? 'Euros €' : `${m} ${simboloMoneda(m)}` }))}
            />
          )}
          {Boolean(precio && precio > 0) && (
            <>
              {moneda !== 'EUR' && (
                <p className="muy-pequeno secundario" style={{ margin: 0 }}>
                  {cambioAuto ? (
                    <>
                      ≈ {euros(aEuros(precio!, moneda, cambioAuto.porEuro))} con el cambio de hoy
                    </>
                  ) : (
                    <>
                      Sin cambio automático para {moneda}: 1 € ={' '}
                      <input
                        className="cambio"
                        inputMode="decimal"
                        aria-label={`${moneda} por euro`}
                        placeholder="?"
                        value={cambioTexto}
                        onChange={(e) => setCambioTexto(e.target.value.replace(/[^\d.,]/g, ''))}
                      />{' '}
                      {simboloMoneda(moneda)}
                    </>
                  )}
                </p>
              )}
              <label className="interruptor tarjeta" style={{ flexDirection: 'row' }}>
                <span>
                  <span className="negrita" style={{ display: 'block' }}>
                    Ya está pagado
                  </span>
                  <span className="muy-pequeno secundario">
                    {form.pagado ? 'Cuenta como gasto en Presupuesto.' : 'Sale en Presupuesto como «por pagar en el hotel».'}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={Boolean(form.pagado)}
                  onChange={(e) => {
                    cambiar({ pagado: e.target.checked });
                    if (!e.target.checked) setEnlazar(undefined);
                  }}
                />
              </label>
              {faltaCambio && <p className="error">Escribe el cambio para pasarlo a euros.</p>}
              {form.pagado && enlazar && (
                <div className="sugerencia">
                  <span className="muy-pequeno secundario">
                    Al guardar, «{enlazar.concepto}» pasa a ser el gasto de este hotel (con su día, notas y ticket): no contará dos veces.
                  </span>
                  <button type="button" className="accion-texto" onClick={() => setEnlazar(undefined)}>
                    Deshacer
                  </button>
                </div>
              )}
              {form.estado === 'cancelado' && (
                <p className="muy-pequeno secundario" style={{ margin: 0 }}>
                  Cancelado: no cuenta en el presupuesto. Si os cobran algo por cancelar, apuntadlo como gasto.
                </p>
              )}
            </>
          )}
          {sueltos.length > 0 && !enlazar && (precio === undefined || form.pagado) && (
            <div className="sugerencia">
              <span className="muy-pequeno secundario">¿Ya lo tenéis apuntado en Presupuesto? Tocadlo para enlazarlo y que no cuente dos veces:</span>
              <div className="opciones compactas">
                {sueltos.slice(0, 6).map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className="opcion sugerida"
                    onClick={() => {
                      setEnlazar(g);
                      setPrecioTexto(String(g.importe).replace('.', ','));
                      setCambioTexto('');
                      cambiar({ moneda: g.moneda, pagado: true });
                    }}
                  >
                    {g.concepto} · {enMoneda(g.importe, g.moneda)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {texto('direccion', 'Dirección', 'La que se busca en Google Maps.')}
          {config.pais === 'JP'
            ? texto('direccionJa', 'Dirección en japonés', 'La que se enseña al taxista.', { lang: 'ja' })
            : texto('direccionJa', 'Dirección en el idioma de allí', 'La que se enseña al taxista (opcional).')}
          {texto('enlace', 'Enlace de la reserva', undefined, { placeholder: 'https://…' })}
          <Campo etiqueta="Notas">
            <textarea className="entrada" rows={4} value={form.notas ?? ''} onChange={(e) => cambiar({ notas: e.target.value || undefined })} />
          </Campo>
          <button className="boton shu" disabled={precioMal || faltaCambio}>
            Guardar
          </button>
          {!nuevo && (
            <button
              type="button"
              className="boton peligro"
              onClick={async () => {
                if (!confirmarBorrado(form.nombre)) return;
                await viaje.borrarAlojamiento(cargado.a!.id);
                // Y su gasto, si estaba pagado.
                await guardarGasto(undefined, cargado.a!.id, 1);
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
