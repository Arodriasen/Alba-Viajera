import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { tiene } from '@/domain/config';
import {
  aEuros,
  euros,
  eurosExactos,
  gastadoEl,
  ICONOS_CATEGORIA,
  importeEnSuMoneda,
  nuevaCategoriaId,
  resumir,
  simboloMoneda,
  type Categoria,
  type CategoriaPresupuesto,
  type Gasto,
  type Moneda,
} from '@/domain/gastos';
import { fase, fechaCorta } from '@/domain/viaje';
import { cambioDeHoy, ultimoCambio, type Cambio } from '@/infrastructure/cambio';

import { useAlba, useConsulta } from '../AlbaViajera';
import { PALETA } from '../ciudades';
import { Cabecera, Cargando } from '../componentes/comunes';
import { Campo, confirmarBorrado, Opciones } from '../componentes/formulario';
import { Icono } from '../componentes/Icono';
import { CampoFecha } from '../componentes/CampoFecha';
import { useUrlFoto, VisorFoto } from '../componentes/FotoDelDia';
import { TarjetaTaxFree } from './TaxFreePage';

/** El cambio del día (o el último guardado) de esa moneda; undefined si no hay ninguno. */
export function useCambio(moneda: Moneda): Cambio | undefined {
  const [c, setC] = useState<{ moneda: Moneda; cambio: Cambio | undefined }>(() => ({ moneda, cambio: ultimoCambio(moneda) }));
  useEffect(() => {
    let vigente = true;
    setC({ moneda, cambio: ultimoCambio(moneda) });
    void cambioDeHoy(moneda).then((x) => vigente && setC({ moneda, cambio: x }));
    return () => {
      vigente = false;
    };
  }, [moneda]);
  return c.moneda === moneda ? c.cambio : ultimoCambio(moneda);
}

const cifra = (n: number) => n.toLocaleString('es-ES', { maximumFractionDigits: 4 });
const cambioTexto = (c: Cambio) => `1 € = ${cifra(c.porEuro)} ${simboloMoneda(c.moneda)}`;

function Barra({ valor, maximo, color }: { valor: number; maximo: number; color: string }) {
  const pasado = maximo > 0 && valor > maximo;
  const ancho = maximo > 0 ? Math.min(100, (valor / maximo) * 100) : valor > 0 ? 100 : 0;
  return (
    <span className="barra" aria-hidden="true">
      <span style={{ width: `${ancho}%`, background: pasado ? 'var(--shu)' : color }} />
    </span>
  );
}

export function GastosPage() {
  const { hoy, config } = useAlba();
  const cambio = useCambio(config.moneda);
  const [abierta, setAbierta] = useState<Categoria>();
  const datos = useConsulta(async ({ viaje }) => ({ gastos: await viaje.gastos(), presupuesto: await viaje.presupuesto() }), []);
  if (!datos) return <Cargando />;
  const r = resumir(datos.gastos, datos.presupuesto);
  const enViaje = fase(hoy, config).tipo === 'durante';
  const deHoy = gastadoEl(datos.gastos, hoy);

  return (
    <>
      <Cabecera titulo="Presupuesto" atras="/mas" />
      <main className="contenido">
        <div className="resumen-gastos">
          <p className="etiqueta">Llevamos gastado</p>
          <p className="total">
            {euros(r.gastado)} <span>de {euros(r.previsto)}</span>
          </p>
          <Barra valor={r.gastado} maximo={r.previsto} color="#fff" />
          <div className="resumen-pie">
            <span>{r.queda >= 0 ? `Quedan ${euros(r.queda)}` : `Nos hemos pasado ${euros(-r.queda)}`}</span>
            {enViaje && <span>Hoy: {euros(deHoy)}</span>}
          </div>
        </div>

        <Link to="/gasto/nuevo" className="boton shu grande">
          <Icono nombre="mas" tamano={20} /> Añadir gasto
        </Link>
        {config.moneda !== 'EUR' && (
          <Link to="/conversor" className="boton claro">
            <Icono nombre="conversor" tamano={18} /> Conversor {simboloMoneda(config.moneda)} ⇄ €
          </Link>
        )}

        {tiene(config, 'taxfree') && <TarjetaTaxFree />}

        <section className="seccion">
          <div className="seccion-cabecera">
            <p className="etiqueta">Por categorías</p>
            <Link to="/presupuesto">Cambiar categorías</Link>
          </div>
          <div className="lista">
            {r.categorias.map((c) => {
              const cat = c.categoria;
              const abiertaEsta = abierta === cat.id;
              return (
                <div key={cat.id} className="categoria" style={{ '--c': cat.color } as CSSProperties}>
                  <button className="fila" aria-expanded={abiertaEsta} onClick={() => setAbierta(abiertaEsta ? undefined : cat.id)}>
                    <span className="icono-categoria">
                      <Icono nombre={cat.icono} tamano={20} />
                    </span>
                    <span className="texto">
                      <span className="fila-cifras">
                        <span className="negrita">{cat.nombre}</span>
                        <span className={c.previsto > 0 && c.gastado > c.previsto ? 'error negrita' : 'negrita'}>{euros(c.gastado)}</span>
                      </span>
                      <Barra valor={c.gastado} maximo={c.previsto} color={cat.color} />
                      <span className="muy-pequeno secundario">
                        {c.previsto > 0 ? `de ${euros(c.previsto)} previstos` : 'sin previsto'} · {c.gastos.length} {c.gastos.length === 1 ? 'gasto' : 'gastos'}
                      </span>
                    </span>
                    <span className={`flecha giro ${abiertaEsta ? 'abierta' : ''}`}>
                      <Icono nombre="chevron" tamano={18} />
                    </span>
                  </button>
                  {abiertaEsta && (
                    <div className="gastos-categoria">
                      {c.gastos.map((g) => (
                        <FilaGasto key={g.id} g={g} />
                      ))}
                      <Link to={`/gasto/nuevo?categoria=${encodeURIComponent(cat.id)}`} className="boton anadir pequeno">
                        <Icono nombre="mas" tamano={16} /> Añadir en {cat.nombre.toLowerCase()}
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {config.moneda !== 'EUR' && (
          <p className="muy-pequeno secundario centrado" style={{ margin: 0 }}>
            {cambio
              ? `Cambio ${cambio.guardado ? 'guardado (sin conexión)' : 'último publicado'}: ${cambioTexto(cambio)} (${fechaCorta(cambio.fecha)}). `
              : `No hay cambio automático para ${config.moneda}: se escribe en cada gasto. `}
            Cada gasto guarda el cambio del día en que se apuntó.
          </p>
        )}
      </main>
    </>
  );
}

function FilaGasto({ g }: { g: Gasto }) {
  return (
    <Link to={`/gasto/${g.id}`} className="fila-gasto">
      <span className="texto">
        <span className="recorte">{g.concepto}</span>
        <span className="muy-pequeno secundario">
          {fechaCorta(g.fecha)}
          {g.moneda !== 'EUR' && ` · ${importeEnSuMoneda(g)}`}
          {g.taxFree && ' · Tax Free'}
        </span>
      </span>
      {g.foto && (
        <span className="secundario" title="Con foto del ticket" aria-label="Con foto del ticket">
          <Icono nombre="recibo" tamano={15} />
        </span>
      )}
      <span className="negrita">{eurosExactos(g.euros)}</span>
      <Icono nombre="chevron" tamano={16} />
    </Link>
  );
}

/** En Hoy, durante el viaje: lo gastado hoy y un acceso rápido para apuntar. */
export function TarjetaGastosHoy({ fecha }: { fecha: string }) {
  const datos = useConsulta(({ viaje }) => viaje.gastos(), []);
  const hoy = datos ? gastadoEl(datos, fecha) : 0;
  return (
    <div className="tarjeta fila-tarjeta">
      <span className="icono-redondo">
        <Icono nombre="cartera" tamano={20} />
      </span>
      <Link to="/gastos" className="texto" style={{ color: 'inherit', textDecoration: 'none' }}>
        <span className="etiqueta">Gastado hoy</span>
        <span className="negrita">{euros(hoy)}</span>
      </Link>
      <Link to={`/gasto/nuevo?fecha=${fecha}`} className="accion-texto">
        <Icono nombre="mas" tamano={16} /> Gasto
      </Link>
    </div>
  );
}

interface Form {
  importe: string;
  moneda: Moneda;
  concepto: string;
  categoria: Categoria;
  fecha: string;
  taxFree: boolean;
  notas: string;
  /** 1 € = N (moneda) con el que se pasa a euros. */
  cambio: string;
  /** El cambio lo ha escrito la persona: ya no se sustituye por el que llegue de la API. */
  cambioAMano?: boolean;
  /** Foto del ticket ya guardada (su nombre). */
  foto?: string;
  /** Foto del ticket elegida ahora; se guarda al pulsar Guardar. */
  fotoNueva?: Blob;
}

const numero = (t: string) => {
  const n = Number(t.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};
const textoCambio = (n: number | undefined) => (n === undefined ? '' : String(Math.round(n * 10_000) / 10_000).replace('.', ','));

export function EditarGastoPage() {
  const { id } = useParams();
  const [busqueda] = useSearchParams();
  const nuevo = !id || id === 'nuevo';
  const { viaje, hoy, config, fotos } = useAlba();
  const navegar = useNavigate();
  const cambioViaje = useCambio(config.moneda);
  const cargado = useConsulta(async ({ viaje: v }) => ({ g: nuevo ? undefined : await v.gasto(id!), presupuesto: await v.presupuesto() }), [id]);
  const [form, setForm] = useState<Form>();
  const monedaDelForm = form?.moneda ?? config.moneda;
  const cambioForm = useCambio(monedaDelForm);

  useEffect(() => {
    if (form || !cargado) return;
    const g = cargado.g;
    const enViaje = fase(hoy, config).tipo === 'durante';
    const monedaParam = busqueda.get('moneda');
    const moneda = g?.moneda ?? (monedaParam && /^[A-Z]{3}$/.test(monedaParam) ? monedaParam : enViaje ? config.moneda : 'EUR');
    const categoriaParam = busqueda.get('categoria');
    const ids = cargado.presupuesto.categorias.map((c) => c.id);
    const porDefecto = enViaje && ids.includes('comida') ? 'comida' : ids.includes('otros') ? 'otros' : ids[0];
    setForm({
      importe: g ? String(g.importe).replace('.', ',') : (busqueda.get('importe') ?? '').replace('.', ','),
      moneda,
      concepto: g?.concepto ?? busqueda.get('concepto') ?? '',
      categoria: g?.categoria ?? (categoriaParam && ids.includes(categoriaParam) ? categoriaParam : porDefecto) ?? 'otros',
      fecha: g?.fecha ?? busqueda.get('fecha') ?? hoy,
      taxFree: g?.taxFree ?? busqueda.get('taxfree') === '1',
      notas: g?.notas ?? '',
      foto: g?.foto,
      // Un gasto ya apuntado conserva su cambio; uno nuevo usa el de hoy.
      cambio: textoCambio(g && g.moneda !== 'EUR' && g.euros > 0 ? g.importe / g.euros : moneda === config.moneda ? cambioViaje?.porEuro : undefined),
    });
  }, [cargado, form, busqueda, hoy, config, cambioViaje]);

  // En un gasto nuevo el cambio sigue al último que llegue (primero el guardado en el móvil y luego el de
  // la API), salvo que se haya escrito a mano.
  useEffect(() => {
    if (!form || !nuevo || form.moneda === 'EUR' || form.cambioAMano || !cambioForm) return;
    const t = textoCambio(cambioForm.porEuro);
    if (form.cambio !== t) setForm({ ...form, cambio: t });
  }, [form, nuevo, cambioForm]);

  if (!form || !cargado) return <Cargando />;
  if (!nuevo && !cargado.g) {
    return (
      <>
        <Cabecera titulo="Gasto" atras />
        <p className="vacio">Este gasto ya no existe.</p>
      </>
    );
  }
  const cambiar = (c: Partial<Form>) => setForm({ ...form, ...c });
  const importe = numero(form.importe);
  const cambio = form.moneda === 'EUR' ? 1 : numero(form.cambio);
  const enEuros = Number.isFinite(importe) && Number.isFinite(cambio) && cambio > 0 ? aEuros(importe, form.moneda, cambio) : NaN;
  const valido = Number.isFinite(enEuros) && importe > 0 && form.concepto.trim() !== '';
  const monedas = [...new Set([config.moneda, 'EUR', form.moneda])];
  const categorias = cargado.presupuesto.categorias;
  const sueltaActual = !categorias.some((c) => c.id === form.categoria);

  return (
    <>
      <Cabecera titulo={nuevo ? 'Nuevo gasto' : 'Editar gasto'} atras />
      <main className="contenido">
        <form
          className="formulario"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!valido) return;
            const gastoId = cargado.g?.id ?? crypto.randomUUID();
            // Desde una lista propia: el elemento queda hecho y enlazado a su gasto.
            const elementoId = busqueda.get('elemento');
            const elemento = elementoId ? await viaje.elemento(elementoId) : undefined;
            if (elemento) await viaje.guardarElemento({ ...elemento, hecho: true, gasto: gastoId });
            // Primero la foto nueva (el motor la sube antes que el gasto); la que había se olvida después.
            const foto = form.fotoNueva ? await fotos.nueva(form.fotoNueva) : form.foto;
            const anterior = cargado.g?.foto;
            await viaje.guardarGasto({
              id: gastoId,
              concepto: form.concepto,
              categoria: form.categoria,
              importe,
              moneda: form.moneda,
              euros: enEuros,
              fecha: form.fecha,
              taxFree: form.taxFree,
              notas: form.notas,
              foto,
            });
            if (anterior && anterior !== foto) await fotos.olvidar(anterior);
            navegar(-1);
          }}
        >
          <div className="tarjeta importe-grande">
            <div className="fila-importe">
              <span className="simbolo">{simboloMoneda(form.moneda)}</span>
              <input
                className="importe"
                inputMode="decimal"
                placeholder="0"
                aria-label="Importe"
                size={Math.max(1, form.importe.length || 1)}
                autoFocus={nuevo}
                value={form.importe}
                onChange={(e) => cambiar({ importe: e.target.value.replace(/[^\d.,]/g, '') })}
              />
            </div>
            {monedas.length > 1 && (
              <Opciones
                valor={form.moneda}
                alCambiar={(moneda) => cambiar({ moneda, cambio: '', cambioAMano: false })}
                opciones={monedas.map((m) => ({ valor: m, texto: m === 'EUR' ? 'Euros €' : `${m} ${simboloMoneda(m)}` }))}
              />
            )}
            {form.moneda !== 'EUR' && (
              <p className="conversion">
                {Number.isFinite(enEuros) && importe > 0 ? <>≈ {eurosExactos(enEuros)}</> : 'Se pasa a euros solo'}
                <span className="muy-pequeno secundario">
                  {' '}
                  · 1 € ={' '}
                  <input
                    className="cambio"
                    inputMode="decimal"
                    aria-label={`${form.moneda} por euro`}
                    placeholder="?"
                    value={form.cambio}
                    onChange={(e) => cambiar({ cambio: e.target.value.replace(/[^\d.,]/g, ''), cambioAMano: true })}
                  />{' '}
                  {simboloMoneda(form.moneda)}
                </span>
              </p>
            )}
          </div>

          <Campo etiqueta="Qué es">
            <input className="entrada" required value={form.concepto} onChange={(e) => cambiar({ concepto: e.target.value })} placeholder="Comida, transporte, recuerdos…" />
          </Campo>

          <div className="campo">
            <span>Categoría</span>
            <div className="rejilla-categorias" role="radiogroup">
              {[...categorias, ...(sueltaActual ? [{ id: form.categoria, nombre: 'Sin categoría', icono: 'otros', color: '#6b705c', previsto: 0 } as CategoriaPresupuesto] : [])].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={form.categoria === c.id}
                  className={`cat ${form.categoria === c.id ? 'activa' : ''}`}
                  style={{ '--c': c.color } as CSSProperties}
                  onClick={() => cambiar({ categoria: c.id })}
                >
                  <Icono nombre={c.icono} tamano={20} />
                  <span>{c.nombre.replace(' (eSIM)', '').replace('Parques y entradas', 'Entradas')}</span>
                </button>
              ))}
            </div>
          </div>

          <Campo etiqueta="Día">
            <CampoFecha etiqueta="Día" valor={form.fecha} alCambiar={(fecha) => fecha && cambiar({ fecha })} />
          </Campo>

          {(tiene(config, 'taxfree') || form.taxFree) && (
            <label className="interruptor tarjeta" style={{ flexDirection: 'row' }}>
              <span>
                <span className="negrita" style={{ display: 'block' }}>
                  Compra con Tax Free
                </span>
                <span className="muy-pequeno secundario">Para recuperar el impuesto en el aeropuerto (pasaporte al pagar).</span>
              </span>
              <input type="checkbox" checked={form.taxFree} onChange={(e) => cambiar({ taxFree: e.target.checked })} />
            </label>
          )}

          <Campo etiqueta="Notas">
            <textarea className="entrada" rows={2} value={form.notas} onChange={(e) => cambiar({ notas: e.target.value })} />
          </Campo>

          <FotoTicket
            foto={form.foto}
            nueva={form.fotoNueva}
            titulo={form.concepto.trim() || 'Ticket'}
            alElegir={(fotoNueva) => cambiar({ fotoNueva })}
            alQuitar={() => cambiar({ foto: undefined, fotoNueva: undefined })}
          />

          <button className="boton shu" disabled={!valido}>
            Guardar
          </button>
          {!nuevo && (
            <button
              type="button"
              className="boton peligro"
              onClick={async () => {
                if (!confirmarBorrado(`«${form.concepto}»`)) return;
                await viaje.borrarGasto(cargado.g!.id);
                if (cargado.g!.foto) await fotos.olvidar(cargado.g!.foto);
                navegar(-1);
              }}
            >
              Borrar gasto
            </button>
          )}
        </form>
      </main>
    </>
  );
}

interface FilaCategoria extends Omit<CategoriaPresupuesto, 'previsto'> {
  previsto: string;
  /** Al borrarla: a qué categoría pasan sus gastos (sin destino: se borran con ella). */
  borrada?: { destino?: Categoria };
}

/** Las categorías del presupuesto: añadir, renombrar, cambiar icono y color, lo previsto y quitar. */
export function EditarPresupuestoPage() {
  const { viaje, fotos } = useAlba();
  const navegar = useNavigate();
  const [filas, setFilas] = useState<FilaCategoria[]>();
  const [abierta, setAbierta] = useState<string>();
  const gastos = useConsulta(({ viaje: v }) => v.gastos(), []);
  useEffect(() => {
    void viaje.presupuesto().then((p) => setFilas((f) => f ?? p.categorias.map((c) => ({ ...c, previsto: c.previsto ? String(c.previsto).replace('.', ',') : '' }))));
  }, [viaje]);
  if (!filas || !gastos) return <Cargando />;

  const cambiar = (i: number, c: Partial<FilaCategoria>) => setFilas(filas.map((f, j) => (j === i ? { ...f, ...c } : f)));
  /** Sube (-1) o baja (+1) una categoría: el orden es el de la pantalla de Presupuesto y el del gasto. */
  const mover = (i: number, paso: -1 | 1) => {
    const j = i + paso;
    if (j < 0 || j >= filas.length) return;
    const nuevas = [...filas];
    [nuevas[i], nuevas[j]] = [nuevas[j], nuevas[i]];
    setFilas(nuevas);
  };
  const vivas = filas.filter((f) => !f.borrada);
  const total = vivas.reduce((s, f) => s + Math.max(0, numero(f.previsto || '0') || 0), 0);
  const cuantos = (id: string) => gastos.filter((g) => g.categoria === id).length;
  const sinNombre = vivas.some((f) => !f.nombre.trim());

  const guardar = async () => {
    if (sinNombre || !vivas.length) return;
    // Primero los gastos de las borradas: a su nueva categoría, o fuera si no se pasan a ninguna.
    for (const f of filas.filter((x) => x.borrada)) {
      const destino = f.borrada!.destino;
      for (const g of gastos.filter((x) => x.categoria === f.id)) {
        if (destino) await viaje.guardarGasto({ ...g, categoria: destino });
        else {
          await viaje.borrarGasto(g.id);
          if (g.foto) await fotos.olvidar(g.foto);
        }
      }
    }
    await viaje.guardarPresupuesto({
      categorias: vivas.map((f) => ({ ...f, nombre: f.nombre.trim(), previsto: Math.max(0, numero(f.previsto || '0') || 0), borrada: undefined })),
    });
    navegar(-1);
  };

  return (
    <>
      <Cabecera titulo="Categorías" atras />
      <main className="contenido">
        <form
          className="formulario"
          onSubmit={(e) => {
            e.preventDefault();
            void guardar();
          }}
        >
          <p className="muy-pequeno secundario" style={{ margin: 0 }}>
            Lo previsto va en euros. Ordénalas con las flechas; toca el icono para cambiarlo, y también el color.
          </p>
          <section className="tarjeta" style={{ gap: 0 }}>
            {filas.map((f, i) => {
              const n = cuantos(f.id);
              if (f.borrada) {
                return (
                  <div key={f.id} className="categoria-editar">
                    <div className="mover-gastos">
                      <span>
                        <span className="negrita">{f.nombre || 'Categoría'}</span> se borrará al guardar. Sus {n} {n === 1 ? 'gasto pasa' : 'gastos pasan'} a:
                      </span>
                      <select className="entrada" value={f.borrada.destino ?? ''} onChange={(e) => cambiar(i, { borrada: { destino: e.target.value || undefined } })}>
                        {vivas.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.nombre || 'Sin nombre'}
                          </option>
                        ))}
                        <option value="">Ninguna: borrar {n === 1 ? 'el gasto' : 'los gastos'}</option>
                      </select>
                      {!f.borrada.destino && (
                        <span className="error" style={{ margin: 0 }}>
                          {n === 1 ? 'El gasto se borrará' : `Los ${n} gastos se borrarán`} al guardar, y no se pueden recuperar.
                        </span>
                      )}
                      <button type="button" className="accion-texto" onClick={() => cambiar(i, { borrada: undefined })}>
                        No borrarla
                      </button>
                    </div>
                  </div>
                );
              }
              return (
                <div key={f.id} className="categoria-editar" style={{ '--c': f.color } as CSSProperties}>
                  <div className="fila-ciudad">
                    <span className="mover">
                      <button type="button" aria-label={`Subir ${f.nombre}`} disabled={i === 0} onClick={() => mover(i, -1)}>
                        <Icono nombre="subir" tamano={18} />
                      </button>
                      <button type="button" aria-label={`Bajar ${f.nombre}`} disabled={i === filas.length - 1} onClick={() => mover(i, 1)}>
                        <Icono nombre="bajar" tamano={18} />
                      </button>
                    </span>
                    <button
                      type="button"
                      className="icono-categoria"
                      aria-label="Icono y color"
                      aria-expanded={abierta === f.id}
                      onClick={() => setAbierta(abierta === f.id ? undefined : f.id)}
                    >
                      <Icono nombre={f.icono} tamano={20} />
                    </button>
                    <input className="entrada" value={f.nombre} placeholder="Nombre" aria-label="Nombre de la categoría" onChange={(e) => cambiar(i, { nombre: e.target.value })} />
                    <span className="euros-entrada">
                      <input
                        className="entrada"
                        inputMode="decimal"
                        placeholder="0"
                        aria-label={`Previsto en ${f.nombre}`}
                        value={f.previsto}
                        onChange={(e) => cambiar(i, { previsto: e.target.value.replace(/[^\d.,]/g, '') })}
                      />
                      <span>€</span>
                    </span>
                    <button
                      type="button"
                      className="accion-foto peligro"
                      aria-label={`Quitar ${f.nombre}`}
                      disabled={vivas.length === 1}
                      onClick={() => {
                        if (!n) return setFilas(filas.filter((_, j) => j !== i));
                        const destino = vivas.find((v) => v.id !== f.id && v.id === 'otros') ?? vivas.find((v) => v.id !== f.id);
                        if (destino) cambiar(i, { borrada: { destino: destino.id } });
                      }}
                    >
                      <Icono nombre="papelera" tamano={20} />
                    </button>
                  </div>
                  {abierta === f.id && (
                    <>
                      <div className="rejilla-iconos" role="radiogroup" aria-label="Icono">
                        {ICONOS_CATEGORIA.map((ic) => (
                          <button key={ic} type="button" role="radio" aria-checked={f.icono === ic} aria-label={ic} onClick={() => cambiar(i, { icono: ic })}>
                            <Icono nombre={ic} tamano={20} />
                          </button>
                        ))}
                      </div>
                      <div className="paleta" role="radiogroup" aria-label="Color">
                        {PALETA.map((color) => (
                          <button
                            key={color}
                            type="button"
                            role="radio"
                            aria-checked={f.color === color}
                            aria-label={color}
                            className={`muestra ${f.color === color ? 'elegida' : ''}`}
                            style={{ background: color }}
                            onClick={() => cambiar(i, { color })}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              className="boton anadir"
              style={{ marginTop: 10 }}
              onClick={() => {
                const id = nuevaCategoriaId();
                setFilas([...filas, { id, nombre: '', previsto: '', icono: 'otros', color: PALETA[filas.length % PALETA.length] }]);
                setAbierta(id);
              }}
            >
              <Icono nombre="mas" tamano={18} /> Añadir categoría
            </button>
          </section>
          <p className="centrado negrita" style={{ margin: 0 }}>
            Total previsto: {euros(total)}
          </p>
          {sinNombre && <p className="error">Hay una categoría sin nombre.</p>}
          <button className="boton shu" disabled={sinNombre}>
            Guardar
          </button>
        </form>
      </main>
    </>
  );
}


/**
 * Foto del ticket del gasto: hacerla o subirla, verla en grande, cambiarla o quitarla. Nada se guarda hasta
 * pulsar Guardar en el gasto (así, si se sale sin guardar, no queda una foto suelta).
 */
function FotoTicket({
  foto,
  nueva,
  titulo,
  alElegir,
  alQuitar,
}: {
  foto?: string;
  nueva?: Blob;
  titulo: string;
  alElegir: (b: Blob) => void;
  alQuitar: () => void;
}) {
  const camara = useRef<HTMLInputElement>(null);
  const galeria = useRef<HTMLInputElement>(null);
  const [grande, setGrande] = useState(false);
  const guardada = useUrlFoto(nueva ? undefined : foto);
  const [previa, setPrevia] = useState<string>();
  useEffect(() => {
    if (!nueva) return setPrevia(undefined);
    const u = URL.createObjectURL(nueva);
    setPrevia(u);
    return () => URL.revokeObjectURL(u);
  }, [nueva]);
  const url = nueva ? previa : guardada;
  const hay = Boolean(nueva || foto);

  const alCambiar = (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (archivo) alElegir(archivo);
  };

  return (
    <div className={`tarjeta ${hay ? 'foto-compacta' : 'foto-vacia'}`}>
      <input ref={camara} type="file" accept="image/*" capture="environment" hidden onChange={alCambiar} />
      <input ref={galeria} type="file" accept="image/*" hidden onChange={alCambiar} />
      {!hay ? (
        <>
          <p className="etiqueta">Foto del ticket</p>
          <div className="botones">
            <button type="button" className="boton claro pequeno" onClick={() => camara.current?.click()}>
              <Icono nombre="camara" tamano={18} /> Hacerla
            </button>
            <button type="button" className="boton claro pequeno" onClick={() => galeria.current?.click()}>
              <Icono nombre="galeria" tamano={18} /> Subirla
            </button>
          </div>
        </>
      ) : (
        <div className="fila-foto">
          <button type="button" className="miniatura-foto" onClick={() => url && setGrande(true)} aria-label="Ver el ticket en grande">
            {url && <img src={url} alt={`Ticket de ${titulo}`} />}
          </button>
          <span className="negrita" style={{ flex: 1 }}>
            Foto del ticket
            {nueva && <span className="muy-pequeno secundario" style={{ display: 'block', fontWeight: 400 }}>Se guarda al pulsar Guardar</span>}
          </span>
          <button type="button" className="accion-foto" onClick={() => camara.current?.click()} aria-label="Hacer otra foto">
            <Icono nombre="camara" tamano={20} />
          </button>
          <button type="button" className="accion-foto" onClick={() => galeria.current?.click()} aria-label="Cambiar por otra de la galería">
            <Icono nombre="galeria" tamano={20} />
          </button>
          <button type="button" className="accion-foto peligro" aria-label="Quitar la foto del ticket" onClick={alQuitar}>
            <Icono nombre="papelera" tamano={20} />
          </button>
        </div>
      )}
      {grande && url && <VisorFoto url={url} titulo={titulo} alCerrar={() => setGrande(false)} />}
    </div>
  );
}
