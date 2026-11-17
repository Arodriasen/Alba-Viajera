import { useEffect, useState, type CSSProperties } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { tiene } from '@/domain/config';
import { aEuros, enMoneda, euros, simboloMoneda } from '@/domain/gastos';
import { ICONOS_LISTA, nuevaListaId, ordenarElementos, precioPropuesto, resumirLista, type Elemento, type Lista } from '@/domain/listas';

import { useAlba, useConsulta } from '../AlbaViajera';
import { PALETA } from '../ciudades';
import { BotonAnadir, Cabecera, Cargando } from '../componentes/comunes';
import { CampoCiudad, useGuardarCiudad } from '../componentes/CampoCiudad';
import { Campo, confirmarBorrado, Opciones, useGuardadoSolo } from '../componentes/formulario';
import { Icono } from '../componentes/Icono';
import { useCambio } from './GastosPage';

const numero = (t: string) => {
  const n = Number(t.replace(/\./g, '').replace(',', '.'));
  return t.trim() && Number.isFinite(n) && n >= 0 ? n : undefined;
};
const texto = (n: number | undefined) => (n === undefined ? '' : String(n).replace('.', ','));

/** "¥3.900 – ¥9.500" o "¥7.980". */
export function rangoPrecio(min: number | undefined, max: number | undefined, moneda: string): string | undefined {
  if (min === undefined && max === undefined) return undefined;
  if (min === undefined || max === undefined || min === max) return enMoneda((min ?? max)!, moneda);
  return `${enMoneda(min, moneda)} – ${enMoneda(max, moneda)}`;
}

/** Una lista propia del viaje: pendientes arriba, hechos abajo, filtro por ciudad y lo que costaría lo pendiente. */
export function ListaPage() {
  const { id = '' } = useParams();
  const { viaje, config } = useAlba();
  const lista = config.listas.find((l) => l.id === id);
  const elementos = useConsulta(({ viaje: v }) => v.elementos(id), [id]);
  const cambio = useCambio(config.moneda);
  const [ciudad, setCiudad] = useState<string>();
  const [verHechos, setVerHechos] = useState(false);
  if (!elementos) return <Cargando />;
  if (!lista) {
    return (
      <>
        <Cabecera titulo="Lista" atras="/mas" />
        <p className="vacio">Esta lista ya no existe.</p>
      </>
    );
  }

  const ciudades = [...new Set(elementos.map((e) => e.ciudad).filter((c): c is string => !!c))];
  const visibles = ordenarElementos(elementos.filter((e) => !ciudad || e.ciudad === ciudad));
  const pendientes = visibles.filter((e) => !e.hecho);
  const hechos = visibles.filter((e) => e.hecho);
  const r = resumirLista(visibles, config.moneda);
  const rangos = Object.entries(r.pendientePorMoneda);
  const enEuros = rangos.reduce(
    (s, [m, [a, b]]) => {
      const porEuro = m === 'EUR' ? 1 : m === config.moneda ? cambio?.porEuro : undefined;
      return porEuro ? [s[0] + aEuros(a, m, porEuro), s[1] + aEuros(b, m, porEuro)] : s;
    },
    [0, 0],
  );

  const fila = (e: Elemento) => {
    const precio = rangoPrecio(e.precioMin, e.precioMax, e.moneda ?? config.moneda);
    const detalle = [precio, e.tienda, ciudad ? undefined : e.ciudad].filter(Boolean).join(' · ');
    return (
      <div key={e.id} className={`fila elemento ${e.hecho ? 'hecho' : ''}`}>
        <button
          type="button"
          className={`check ${e.hecho ? 'hecho' : ''}`}
          role="checkbox"
          aria-checked={e.hecho}
          aria-label={e.hecho ? `Desmarcar ${e.nombre}` : `Marcar ${e.nombre}`}
          onClick={() => void viaje.guardarElemento({ ...e, hecho: !e.hecho })}
        >
          {e.hecho && <Icono nombre="check" tamano={16} />}
        </button>
        <Link to={`/elemento/${e.id}`} className="texto" style={{ color: 'inherit', textDecoration: 'none' }}>
          <span className="negrita recorte">{e.nombre}</span>
          {detalle && <span className="muy-pequeno secundario">{detalle}</span>}
          {e.gasto && <span className="muy-pequeno secundario">Apuntado en el presupuesto</span>}
        </Link>
        <Link to={`/elemento/${e.id}`} className="flecha" aria-label={`Editar ${e.nombre}`}>
          <Icono nombre="chevron" tamano={18} />
        </Link>
      </div>
    );
  };

  return (
    <>
      <Cabecera titulo={lista.nombre} atras="/mas" />
      <main className="contenido">
        {rangos.length > 0 && (
          <div className="resumen-gastos" style={{ '--c': lista.color, background: lista.color } as CSSProperties}>
            <p className="etiqueta">Lo pendiente costaría</p>
            {rangos.map(([m, [a, b]]) => (
              <p key={m} className="total" style={{ fontSize: 26 }}>
                {rangoPrecio(a, b, m)}
              </p>
            ))}
            <div className="resumen-pie">
              <span>
                {pendientes.length} por hacer · {hechos.length} hechos
              </span>
              {enEuros[1] > 0 && <span>≈ {enEuros[0] === enEuros[1] ? euros(enEuros[0]) : `${euros(enEuros[0])} – ${euros(enEuros[1])}`}</span>}
            </div>
          </div>
        )}

        {ciudades.length > 0 && (
          <div className="opciones" role="radiogroup" aria-label="Filtrar por ciudad">
            <button type="button" role="radio" aria-checked={!ciudad} className={`opcion ${!ciudad ? 'activa' : ''}`} onClick={() => setCiudad(undefined)}>
              Todas
            </button>
            {ciudades.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={ciudad === c} className={`opcion ${ciudad === c ? 'activa' : ''}`} onClick={() => setCiudad(c)}>
                {c}
              </button>
            ))}
          </div>
        )}

        {pendientes.length > 0 ? <div className="lista">{pendientes.map(fila)}</div> : <p className="vacio">{hechos.length ? '¡Todo hecho!' : 'Aún no hay nada.'}</p>}
        <BotonAnadir to={`/lista/${lista.id}/nuevo${ciudad ? `?ciudad=${encodeURIComponent(ciudad)}` : ''}`} texto="Añadir" />

        {hechos.length > 0 && (
          <section className="seccion">
            <button type="button" className="seccion-cabecera boton-plano" aria-expanded={verHechos} onClick={() => setVerHechos(!verHechos)}>
              <span className="etiqueta">Hechos ({hechos.length})</span>
              <span className={`flecha giro ${verHechos ? 'abierta' : ''}`}>
                <Icono nombre="chevron" tamano={18} />
              </span>
            </button>
            {verHechos && <div className="lista">{hechos.map(fila)}</div>}
          </section>
        )}
      </main>
    </>
  );
}

interface FormElemento {
  nombre: string;
  notas: string;
  precioMin: string;
  precioMax: string;
  moneda: string;
  tienda: string;
  ciudad: string;
  hecho: boolean;
}

export function EditarElementoPage() {
  const { id, lista: listaParam } = useParams();
  const [busqueda] = useSearchParams();
  const nuevo = !id;
  const { viaje, config } = useAlba();
  const navegar = useNavigate();
  const guardarCiudad = useGuardarCiudad();
  const cargado = useConsulta(async ({ viaje: v }) => ({ e: nuevo ? undefined : await v.elemento(id!), todos: await v.elementos() }), [id]);
  const [form, setForm] = useState<FormElemento>();

  useEffect(() => {
    if (form || !cargado) return;
    const e = cargado.e;
    setForm({
      nombre: e?.nombre ?? '',
      notas: e?.notas ?? '',
      precioMin: texto(e?.precioMin),
      precioMax: texto(e?.precioMax),
      moneda: e?.moneda ?? config.moneda,
      tienda: e?.tienda ?? '',
      ciudad: e?.ciudad ?? busqueda.get('ciudad') ?? '',
      hecho: e?.hecho ?? false,
    });
  }, [cargado, form, config.moneda, busqueda]);

  if (!form || !cargado) return <Cargando />;
  if (!nuevo && !cargado.e) {
    return (
      <>
        <Cabecera titulo="Elemento" atras />
        <p className="vacio">Ya no existe.</p>
      </>
    );
  }
  const listaId = cargado.e?.lista ?? listaParam ?? '';
  const lista = config.listas.find((l) => l.id === listaId);
  const cambiar = (c: Partial<FormElemento>) => setForm({ ...form, ...c });
  const monedas = [...new Set([config.moneda, 'EUR', form.moneda])];

  const aElemento = (): Elemento => ({
    id: cargado.e?.id ?? crypto.randomUUID(),
    lista: listaId,
    nombre: form.nombre,
    hecho: form.hecho,
    notas: form.notas,
    precioMin: numero(form.precioMin),
    precioMax: numero(form.precioMax),
    moneda: form.moneda,
    tienda: form.tienda,
    ciudad: form.ciudad.trim() || undefined,
    gasto: cargado.e?.gasto,
    orden: cargado.e?.orden ?? Math.max(0, ...cargado.todos.filter((x) => x.lista === listaId).map((x) => x.orden + 1)),
  });
  const guardar = async () => {
    const e = aElemento();
    await guardarCiudad(e.ciudad);
    await viaje.guardarElemento(e);
    return e;
  };

  return (
    <>
      <Cabecera titulo={nuevo ? `Añadir en ${lista?.nombre ?? 'la lista'}` : 'Editar'} atras />
      <main className="contenido">
        <form
          className="formulario"
          onSubmit={async (ev) => {
            ev.preventDefault();
            if (!form.nombre.trim()) return;
            await guardar();
            navegar(-1);
          }}
        >
          <Campo etiqueta="Qué">
            <input className="entrada" required autoFocus={nuevo} value={form.nombre} onChange={(e) => cambiar({ nombre: e.target.value })} />
          </Campo>

          <div className="tarjeta">
            <p className="etiqueta">Precio orientativo (opcional)</p>
            <div className="dos-columnas">
              <Campo etiqueta={`Mínimo (${simboloMoneda(form.moneda)})`}>
                <input className="entrada" inputMode="decimal" value={form.precioMin} onChange={(e) => cambiar({ precioMin: e.target.value.replace(/[^\d.,]/g, '') })} />
              </Campo>
              <Campo etiqueta={`Máximo (${simboloMoneda(form.moneda)})`}>
                <input className="entrada" inputMode="decimal" value={form.precioMax} onChange={(e) => cambiar({ precioMax: e.target.value.replace(/[^\d.,]/g, '') })} />
              </Campo>
            </div>
            {monedas.length > 1 && (
              <Opciones valor={form.moneda} alCambiar={(moneda) => cambiar({ moneda })} opciones={monedas.map((m) => ({ valor: m, texto: m === 'EUR' ? 'Euros €' : `${m} ${simboloMoneda(m)}` }))} />
            )}
          </div>

          <Campo etiqueta="Dónde (tienda o sitio)">
            <input className="entrada" value={form.tienda} onChange={(e) => cambiar({ tienda: e.target.value })} placeholder="Opcional" />
          </Campo>
          <CampoCiudad valor={form.ciudad} alCambiar={(ciudad) => cambiar({ ciudad })} />
          <Campo etiqueta="Notas">
            <textarea className="entrada" rows={3} value={form.notas} onChange={(e) => cambiar({ notas: e.target.value })} />
          </Campo>

          <label className="interruptor tarjeta" style={{ flexDirection: 'row' }}>
            <span className="negrita">Hecho</span>
            <input type="checkbox" checked={form.hecho} onChange={(e) => cambiar({ hecho: e.target.checked })} />
          </label>

          <button className="boton shu" disabled={!form.nombre.trim()}>
            Guardar
          </button>

          {tiene(config, 'presupuesto') && !cargado.e?.gasto && (
            <button
              type="button"
              className="boton claro"
              disabled={!form.nombre.trim()}
              onClick={async () => {
                // Se guarda tal cual y se abre el gasto ya rellenado; al guardarlo, queda marcado como hecho.
                const e = await guardar();
                const q = new URLSearchParams({ concepto: e.nombre, categoria: 'compras', elemento: e.id, moneda: e.moneda ?? config.moneda });
                const importe = precioPropuesto(e);
                if (importe !== undefined) q.set('importe', String(importe));
                navegar(`/gasto/nuevo?${q}`, { replace: true });
              }}
            >
              <Icono nombre="cartera" tamano={18} /> Comprado: apuntar el gasto
            </button>
          )}
          {cargado.e?.gasto && (
            <Link to={`/gasto/${cargado.e.gasto}`} className="boton claro">
              <Icono nombre="cartera" tamano={18} /> Ver el gasto apuntado
            </Link>
          )}

          {!nuevo && (
            <button
              type="button"
              className="boton peligro"
              onClick={async () => {
                if (!confirmarBorrado(`«${form.nombre}»`)) return;
                await viaje.borrarElemento(cargado.e!.id);
                navegar(-1);
              }}
            >
              Borrar
            </button>
          )}
        </form>
      </main>
    </>
  );
}

/** Editor de las listas propias (en el alta del viaje y en Ajustes): nombre, icono y color. */
export function EditarListas({ listas, alCambiar }: { listas: Lista[]; alCambiar: (l: Lista[]) => void }) {
  const [abierta, setAbierta] = useState<string>();
  const [recien, setRecien] = useState<string>();
  const anadir = () => {
    const id = nuevaListaId();
    alCambiar([...listas, { id, nombre: 'Nuevo apartado', icono: 'lista', color: PALETA[(listas.length + 3) % PALETA.length] }]);
    setRecien(id);
  };
  const cambiar = (i: number, c: Partial<Lista>) => alCambiar(listas.map((l, j) => (j === i ? { ...l, ...c } : l)));
  return (
    <div className="lista-apartados">
      {listas.map((l, i) => (
        <div key={l.id} className="categoria-editar" style={{ '--c': l.color } as CSSProperties}>
          <div className="fila-ciudad">
            <button type="button" className="icono-categoria" aria-label="Icono y color" aria-expanded={abierta === l.id} onClick={() => setAbierta(abierta === l.id ? undefined : l.id)}>
              <Icono nombre={l.icono} tamano={20} />
            </button>
            <input
              className="entrada"
              value={l.nombre}
              placeholder="Equipaje, Compras, Recados…"
              aria-label="Nombre del apartado"
              autoFocus={recien === l.id}
              onFocus={(e) => recien === l.id && e.target.select()}
              onChange={(e) => cambiar(i, { nombre: e.target.value })}
            />
            <button type="button" className="accion-foto peligro" aria-label={`Quitar ${l.nombre}`} onClick={() => alCambiar(listas.filter((_, j) => j !== i))}>
              <Icono nombre="papelera" tamano={20} />
            </button>
          </div>
          {abierta === l.id && (
            <>
              <div className="rejilla-iconos" role="radiogroup" aria-label="Icono">
                {ICONOS_LISTA.map((ic) => (
                  <button key={ic} type="button" role="radio" aria-checked={l.icono === ic} aria-label={ic} onClick={() => cambiar(i, { icono: ic })}>
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
                    aria-checked={l.color === color}
                    aria-label={color}
                    className={`muestra ${l.color === color ? 'elegida' : ''}`}
                    style={{ background: color }}
                    onClick={() => cambiar(i, { color })}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ))}
      <button type="button" className="boton anadir" style={{ marginTop: 10 }} onClick={anadir}>
        <Icono nombre="mas" tamano={18} /> Añadir apartado
      </button>
    </div>
  );
}

/**
 * Los apartados vuestros del viaje abierto, guardados al momento (sin botón de Guardar). Quitar uno
 * que tiene cosas pide confirmación y se las lleva.
 */
export function ListasDelViaje() {
  const { viaje } = useAlba();
  const [listas, setListas] = useState<Lista[]>();
  useEffect(() => {
    void viaje.config().then((c) => setListas((l) => l ?? c.listas));
  }, [viaje]);
  useGuardadoSolo(listas, async (l) => {
    const c = await viaje.config();
    await viaje.guardarConfig({ ...c, listas: l.filter((x) => x.nombre.trim()).map((x) => ({ ...x, nombre: x.nombre.trim() })) });
  });
  if (!listas) return null;

  const alCambiar = async (nuevas: Lista[]) => {
    for (const quitada of listas.filter((l) => !nuevas.some((n) => n.id === l.id))) {
      const suyos = await viaje.elementos(quitada.id);
      if (suyos.length && !window.confirm(`«${quitada.nombre}» tiene ${suyos.length} ${suyos.length === 1 ? 'cosa' : 'cosas'}: se borrarán también en el otro móvil. ¿Quitarlo?`)) return;
      for (const e of suyos) await viaje.borrarElemento(e.id);
    }
    setListas(nuevas);
  };
  return <EditarListas listas={listas} alCambiar={(l) => void alCambiar(l)} />;
}
