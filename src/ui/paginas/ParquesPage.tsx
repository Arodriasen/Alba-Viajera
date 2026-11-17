import { useEffect, useState, type CSSProperties } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import {
  aptitud,
  delParque,
  emparejar,
  parque as buscarParque,
  parquesDe,
  resumen,
  type Aptitud,
  type Atraccion,
  type EntidadEnVivo,
  type Horario,
  type IdParque,
  type Parque,
  type ParqueEnVivo,
  type TipoAtraccion,
} from '@/domain/parques';
import { fechaCorta, fechaLarga } from '@/domain/viaje';
import { parqueEnVivo, ultimoGuardado } from '@/infrastructure/parquesEnVivo';

import { useAlba, useConsulta } from '../AlbaViajera';
import { BotonAnadir, Cabecera, Cargando, Portada } from '../componentes/comunes';
import { Campo, confirmarBorrado, Opciones } from '../componentes/formulario';
import { Icono } from '../componentes/Icono';
import { enJapon, RelojJapon, useMinuto } from '../componentes/tiempo';

const aCiudad = (p: Parque) => ({ nombre: p.nombre, kanji: p.kanji, color: p.color });

/** Acceso a los tres parques (desde Hoy y desde cada día de parque). */
export function TarjetasParques() {
  const { config } = useAlba();
  const datos = useConsulta(async ({ viaje }) => ({ atracciones: await viaje.atracciones(), altura: await viaje.alturaAlba() }), []);
  return (
    <div className="parques-tarjetas">
      {parquesDe(config).map((p) => {
        const r = datos ? resumen(delParque(datos.atracciones, p.id), datos.altura) : undefined;
        return (
          <Link key={p.id} to={`/parque/${p.id}`} className="parque-mini" style={{ '--c': p.color } as CSSProperties}>
            <span className="kanji-peq">{p.kanji}</span>
            <span className="negrita">{p.nombre.replace('Universal Studios Japan', 'USJ').replace('Tokyo ', '')}</span>
            <span className="muy-pequeno">{r ? `Alba: ${r.puede} de ${r.abiertas}` : '…'}</span>
          </Link>
        );
      })}
    </div>
  );
}

const ETIQUETA: Record<Aptitud, { texto: (a: Atraccion) => string; clase: string }> = {
  puede: { texto: (a) => (a.alturaMin ? `≥ ${a.alturaMin} cm ✓` : 'sin altura'), clase: 'matcha' },
  swap: { texto: (a) => `≥ ${a.alturaMin} cm · Rider Swap`, clase: 'ocre' },
  cerrada: { texto: () => 'cerrada', clase: '' },
};

type Filtro = 'alba' | 'swap' | 'todo';

export function ParquePage() {
  const { id = 'tdl' } = useParams();
  const { viaje, config } = useAlba();
  const p = buscarParque(id, config) ?? parquesDe(config)[0];
  const [filtro, setFiltro] = useState<Filtro>('alba');
  const datos = useConsulta(async ({ viaje: v }) => ({ atracciones: await v.atracciones(), altura: await v.alturaAlba() }), []);
  const vivo = useParqueEnVivo(p.id, p.fecha);
  if (!datos) return <Cargando />;
  const enVivo = (a: Atraccion) => (vivo.datos && a.tipo !== 'zona' ? emparejar(a.nombre, vivo.datos.entidades) : undefined);
  const abiertoAhora = !!vivo.datos?.hoy && Date.now() >= vivo.datos.hoy.abre.getTime() && Date.now() < vivo.datos.hoy.cierra.getTime();

  const todas = delParque(datos.atracciones, p.id);
  const altura = datos.altura;
  const r = resumen(todas, altura);
  const visibles = todas.filter((a) => {
    const ap = aptitud(a, altura);
    return filtro === 'todo' || (filtro === 'alba' ? ap === 'puede' : ap === 'swap');
  });
  const imprescindibles = visibles.filter((a) => a.imprescindible);
  const resto = visibles.filter((a) => !a.imprescindible);
  const zonas = [...new Set(resto.map((a) => a.zona ?? 'Otras'))];

  return (
    <>
      <Cabecera titulo={p.nombre} atras />
      <main className="contenido" style={{ '--c': p.color } as CSSProperties}>
        <Portada ciudad={aCiudad(p)}>
          <p className="etiqueta">{fechaLarga(p.fecha)}</p>
          <p className="titulo-dia">{p.nombre}</p>
          <div className="pastillas">
            <span className="pastilla blanca">
              Alba puede en {r.puede} de {r.abiertas}
            </span>
            {r.hechas > 0 && <span className="pastilla">{r.hechas} hechas</span>}
          </div>
        </Portada>

        <div className="tarjeta altura-alba">
          <div style={{ flex: 1 }}>
            <p className="etiqueta">Altura de Alba</p>
            <p className="muy-pequeno secundario" style={{ margin: '2px 0 0' }}>En el parque manda el medidor de cada atracción.</p>
          </div>
          <button className="paso" aria-label="Un centímetro menos" onClick={() => void viaje.guardarAlturaAlba(altura - 1)}>
            <Icono nombre="menos" tamano={20} />
          </button>
          <span className="cm">
            {altura}
            <small> cm</small>
          </span>
          <button className="paso" aria-label="Un centímetro más" onClick={() => void viaje.guardarAlturaAlba(altura + 1)}>
            <Icono nombre="mas" tamano={20} />
          </button>
        </div>

        <EnDirecto parque={p} vivo={vivo} />

        <div className="aviso ai">
          <span>
            <span className="negrita">Al entrar:</span> {p.primero}
          </span>
        </div>

        <Opciones<Filtro>
          valor={filtro}
          alCambiar={setFiltro}
          opciones={[
            { valor: 'alba', texto: 'Para Alba' },
            { valor: 'swap', texto: 'Rider Swap' },
            { valor: 'todo', texto: 'Todo' },
          ]}
        />

        {visibles.length === 0 && <p className="vacio">Nada en esta lista.</p>}
        {imprescindibles.length > 0 && <Grupo titulo="Imprescindibles" atracciones={imprescindibles} altura={altura} enVivo={enVivo} abierto={abiertoAhora} />}
        {zonas.map((z) => (
          <Grupo key={z} titulo={z} atracciones={resto.filter((a) => (a.zona ?? 'Otras') === z)} altura={altura} enVivo={enVivo} abierto={abiertoAhora} />
        ))}
        <BotonAnadir to={`/atraccion/nueva?parque=${p.id}`} texto="Añadir atracción o show" />
        <p className="muy-pequeno secundario centrado" style={{ margin: 0 }}>
          La fecha del parque y el consejo de «Al entrar» se cambian en Ajustes del viaje.
        </p>
      </main>
    </>
  );
}

interface PropsVivo {
  enVivo: (a: Atraccion) => EntidadEnVivo | undefined;
  abierto: boolean;
}

function Grupo({ titulo, atracciones, altura, enVivo, abierto }: { titulo: string; atracciones: Atraccion[]; altura: number } & PropsVivo) {
  return (
    <section className="seccion">
      <p className="etiqueta">{titulo}</p>
      <div className="lista">
        {atracciones.map((a) => (
          <FilaAtraccion key={a.id} a={a} altura={altura} vivo={enVivo(a)} abierto={abierto} />
        ))}
      </div>
    </section>
  );
}

interface EstadoVivo {
  datos?: ParqueEnVivo;
  error?: string;
}

/** Refresca cada minuto mientras la pantalla está a la vista. Sin conexión, enseña el último dato guardado. */
function useParqueEnVivo(id: IdParque, fecha: string): EstadoVivo {
  const [estado, setEstado] = useState<EstadoVivo>(() => ({ datos: ultimoGuardado(id) }));
  useEffect(() => {
    let vigente = true;
    setEstado({ datos: ultimoGuardado(id) });
    const cargar = () => {
      if (document.visibilityState !== 'visible') return;
      parqueEnVivo(id, fecha).then(
        (datos) => vigente && setEstado({ datos }),
        (e) => vigente && setEstado((s) => ({ ...s, error: navigator.onLine ? String(e instanceof Error ? e.message : e) : 'sin conexión' })),
      );
    };
    cargar();
    const t = setInterval(cargar, 60_000);
    document.addEventListener('visibilitychange', cargar);
    return () => {
      vigente = false;
      clearInterval(t);
      document.removeEventListener('visibilitychange', cargar);
    };
  }, [id, fecha]);
  return estado;
}

const rango = (h: Horario) => `${enJapon(h.abre)} – ${enJapon(h.cierra)}`;

function EnDirecto({ parque: p, vivo }: { parque: Parque; vivo: EstadoVivo }) {
  const ahora = useMinuto();
  const d = vivo.datos;
  if (!d) {
    return (
      <div className="tarjeta en-directo">
        <p className="etiqueta">En directo</p>
        <p className="pequeno secundario" style={{ margin: 0 }}>{vivo.error ? `No se ha podido consultar (${vivo.error}).` : 'Consultando…'}</p>
      </div>
    );
  }
  const abierto = d.hoy && ahora >= d.hoy.abre && ahora < d.hoy.cierra;
  const obras = d.entidades.filter((e) => e.estado === 'obras');
  const minutos = Math.floor((ahora.getTime() - d.actualizado.getTime()) / 60_000);
  const hace = minutos < 1 ? 'ahora mismo' : minutos < 60 ? `hace ${minutos} min` : minutos < 48 * 60 ? `hace ${Math.floor(minutos / 60)} h` : `hace ${Math.floor(minutos / 1440)} días`;
  return (
    <div className="tarjeta en-directo">
      <div className="seccion-cabecera">
        <p className="etiqueta">
          <span className={`punto-vivo ${abierto ? 'on' : ''}`} /> En directo
        </p>
        <RelojJapon texto="Japón" />
      </div>
      <div className="dato-vivo">
        <span className="secundario">Nuestro día ({fechaCorta(p.fecha)})</span>
        <span className="negrita">{d.diaVisita ? rango(d.diaVisita) : 'horario aún sin publicar'}</span>
      </div>
      <div className="dato-vivo">
        <span className="secundario">Hoy en Japón</span>
        <span className="negrita">
          {!d.hoy ? 'cerrado' : abierto ? `abierto hasta las ${enJapon(d.hoy.cierra)}` : ahora < d.hoy.abre ? `abre a las ${enJapon(d.hoy.abre)}` : `cerrado (${rango(d.hoy)})`}
        </span>
      </div>
      {obras.length > 0 && (
        <div className="dato-vivo">
          <span className="secundario">En obras ahora</span>
          <span className="negrita" style={{ textAlign: 'right' }}>{obras.map((o) => o.nombre).join(', ')}</span>
        </div>
      )}
      {vivo.error ? (
        <p className="muy-pequeno" style={{ margin: 0, color: 'var(--ocre)' }}>
          {vivo.error === 'sin conexión' ? 'Sin conexión' : 'No se ha podido actualizar'}: dato guardado {hace}.
        </p>
      ) : (
        <p className="muy-pequeno secundario" style={{ margin: 0 }}>
          Datos de las apps oficiales vía ThemeParks.wiki · {hace}
        </p>
      )}
    </div>
  );
}

const TIPO: Record<TipoAtraccion, string> = { atraccion: '', show: 'show', zona: 'zona' };

/** Lo que dice el directo de una atracción: espera, funciones, parada, en obras… */
function EtiquetaVivo({ v, abierto }: { v: EntidadEnVivo; abierto: boolean }) {
  if (v.estado === 'obras') return <span className="pastilla shu">en obras</span>;
  if (v.estado === 'parada') return <span className="pastilla ocre">parada ahora</span>;
  if (v.funciones.length) return <span className="pastilla ai">{v.funciones.slice(0, 3).map(enJapon).join(' · ')}</span>;
  if (v.estado === 'abierta' && v.espera !== undefined) return <span className="pastilla ai">espera {v.espera} min</span>;
  if (v.estado === 'abierta') return <span className="pastilla ai">abierta</span>;
  if (abierto) return <span className="pastilla">cerrada ahora</span>;
  return null;
}

function FilaAtraccion({ a, altura, vivo, abierto }: { a: Atraccion; altura: number; vivo?: EntidadEnVivo; abierto: boolean }) {
  const { viaje } = useAlba();
  const ap = aptitud(a, altura);
  const e = ETIQUETA[ap];
  return (
    <div className="fila" style={ap === 'cerrada' ? { opacity: 0.5 } : undefined}>
      <button
        className={`check ${a.hecha ? 'hecho' : ''}`}
        aria-label={a.hecha ? 'Marcar como no hecha' : 'Marcar como hecha'}
        disabled={ap === 'cerrada'}
        onClick={() => void viaje.guardarAtraccion({ ...a, hecha: !a.hecha })}
      >
        <Icono nombre="check" tamano={16} />
      </button>
      <Link to={`/atraccion/${a.id}`} className="texto" style={{ color: 'inherit', textDecoration: 'none' }}>
        <span className="negrita">
          {a.nombre}
          {a.unica && <span title="Solo existe en este parque"> ★</span>}
        </span>
        {(a.notas || TIPO[a.tipo]) && (
          <span className="pequeno secundario">{[TIPO[a.tipo], a.notas].filter(Boolean).join(' · ')}</span>
        )}
      </Link>
      <span className="etiquetas-fila">
        <span className={`pastilla ${e.clase}`}>{e.texto(a)}</span>
        {vivo && <EtiquetaVivo v={vivo} abierto={abierto} />}
      </span>
    </div>
  );
}

interface Form {
  nombre: string;
  zona: string;
  tipo: TipoAtraccion;
  alturaMin: string;
  cerrada: boolean;
  imprescindible: boolean;
  unica: boolean;
  notas: string;
}

export function EditarAtraccionPage() {
  const { id } = useParams();
  const [busqueda] = useSearchParams();
  const nueva = !id || id === 'nueva';
  const { viaje } = useAlba();
  const navegar = useNavigate();
  const cargado = useConsulta(async ({ viaje: v }) => ({ a: nueva ? undefined : await v.atraccion(id!), todas: await v.atracciones() }), [id]);
  const [form, setForm] = useState<Form>();

  useEffect(() => {
    if (form || !cargado) return;
    const a = cargado.a;
    setForm({
      nombre: a?.nombre ?? '',
      zona: a?.zona ?? '',
      tipo: a?.tipo ?? 'atraccion',
      alturaMin: a?.alturaMin ? String(a.alturaMin) : '',
      cerrada: a?.cerrada ?? false,
      imprescindible: a?.imprescindible ?? false,
      unica: a?.unica ?? false,
      notas: a?.notas ?? '',
    });
  }, [cargado, form]);

  if (!form || !cargado) return <Cargando />;
  if (!nueva && !cargado.a) {
    return (
      <>
        <Cabecera titulo="Atracción" atras />
        <p className="vacio">Ya no existe.</p>
      </>
    );
  }
  const idParque = (cargado.a?.parque ?? busqueda.get('parque') ?? 'tdl') as IdParque;
  const cambiar = (c: Partial<Form>) => setForm({ ...form, ...c });
  const casilla = (campo: 'cerrada' | 'imprescindible' | 'unica', texto: string) => (
    <label className="interruptor">
      <span>{texto}</span>
      <input type="checkbox" checked={form[campo]} onChange={(e) => cambiar({ [campo]: e.target.checked })} />
    </label>
  );

  return (
    <>
      <Cabecera titulo={nueva ? 'Nueva atracción' : 'Editar atracción'} atras />
      <main className="contenido">
        <form
          className="formulario"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!form.nombre.trim()) return;
            const altura = parseInt(form.alturaMin, 10);
            const delParque = cargado.todas.filter((x) => x.parque === idParque);
            await viaje.guardarAtraccion({
              id: cargado.a?.id ?? crypto.randomUUID(),
              parque: idParque,
              nombre: form.nombre,
              zona: form.zona,
              tipo: form.tipo,
              alturaMin: altura >= 50 && altura <= 200 ? altura : undefined,
              cerrada: form.cerrada,
              imprescindible: form.imprescindible,
              unica: form.unica,
              notas: form.notas,
              hecha: cargado.a?.hecha ?? false,
              orden: cargado.a?.orden ?? Math.max(0, ...delParque.map((x) => x.orden)) + 1,
            });
            navegar(-1);
          }}
        >
          <Campo etiqueta="Nombre">
            <input className="entrada" required value={form.nombre} onChange={(e) => cambiar({ nombre: e.target.value })} />
          </Campo>
          <div className="campo">
            <span>Tipo</span>
            <Opciones
              valor={form.tipo}
              alCambiar={(tipo) => cambiar({ tipo })}
              opciones={[
                { valor: 'atraccion', texto: 'Atracción' },
                { valor: 'show', texto: 'Show' },
                { valor: 'zona', texto: 'Zona' },
              ]}
            />
          </div>
          <div className="dos-columnas">
            <Campo etiqueta="Zona">
              <input className="entrada" value={form.zona} onChange={(e) => cambiar({ zona: e.target.value })} />
            </Campo>
            <Campo etiqueta="Altura mínima" ayuda="En cm. Vacío = sin altura.">
              <input className="entrada" inputMode="numeric" value={form.alturaMin} onChange={(e) => cambiar({ alturaMin: e.target.value.replace(/\D/g, '') })} />
            </Campo>
          </div>
          <div className="tarjeta" style={{ gap: 14 }}>
            {casilla('imprescindible', 'Imprescindible')}
            {casilla('unica', 'Solo existe en este parque ★')}
            {casilla('cerrada', 'Cerrada en nuestras fechas')}
          </div>
          <Campo etiqueta="Notas">
            <textarea className="entrada" rows={3} value={form.notas} onChange={(e) => cambiar({ notas: e.target.value })} />
          </Campo>
          <button className="boton shu">Guardar</button>
          {!nueva && (
            <button
              type="button"
              className="boton peligro"
              onClick={async () => {
                if (!confirmarBorrado(`«${form.nombre}»`)) return;
                await viaje.borrarAtraccion(cargado.a!.id);
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
