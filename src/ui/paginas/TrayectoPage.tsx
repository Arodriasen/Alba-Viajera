import { tiene } from '@/domain/config';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { fechaCorta, type Trayecto } from '@/domain/viaje';

import { useAlba, useConsulta } from '../AlbaViajera';
import { CampoFecha } from '../componentes/CampoFecha';
import { Cabecera, Cargando } from '../componentes/comunes';
import { Campo, confirmarBorrado, Opciones } from '../componentes/formulario';

interface Form {
  fecha: string;
  hora: string;
  titulo: string;
  origen: string;
  destino: string;
  pasos: string;
  duracion: string;
  jrPass: 'si' | 'no' | '?';
  notas: string;
}

/** Nuevo (/trayecto/nuevo?fecha=…) o editar (/trayecto/:id). */
export function EditarTrayectoPage() {
  const { id } = useParams();
  const [busqueda] = useSearchParams();
  const nuevo = !id || id === 'nuevo';
  const { viaje, config } = useAlba();
  const navegar = useNavigate();
  const cargado = useConsulta(async ({ viaje: v }) => ({ t: nuevo ? undefined : await v.trayecto(id!), todos: await v.trayectos() }), [id]);
  const [form, setForm] = useState<Form>();

  useEffect(() => {
    if (form || !cargado) return;
    const t = cargado.t;
    setForm({
      fecha: t?.fecha ?? busqueda.get('fecha') ?? config.inicio,
      hora: t?.hora ?? '',
      titulo: t?.titulo ?? '',
      origen: t?.origen ?? '',
      destino: t?.destino ?? '',
      pasos: t?.pasos.join('\n') ?? '',
      duracion: t?.duracion ?? '',
      jrPass: t?.jrPass === true ? 'si' : t?.jrPass === false ? 'no' : '?',
      notas: t?.notas ?? '',
    });
  }, [cargado, form, busqueda, config.inicio]);

  if (!form || !cargado) return <Cargando />;
  if (!nuevo && !cargado.t) {
    return (
      <>
        <Cabecera titulo="Trayecto" atras />
        <p className="vacio">Este trayecto ya no existe.</p>
      </>
    );
  }

  const cambiar = (c: Partial<Form>) => setForm({ ...form, ...c });
  const guardar = async () => {
    const otrosDelDia = cargado.todos.filter((x) => x.fecha === form.fecha && x.id !== cargado.t?.id);
    const t: Trayecto = {
      id: cargado.t?.id ?? crypto.randomUUID(),
      fecha: form.fecha,
      hora: form.hora || undefined,
      titulo: form.titulo.trim() || [form.origen, form.destino].filter(Boolean).join(' → ') || 'Trayecto',
      origen: form.origen,
      destino: form.destino,
      pasos: form.pasos.split('\n'),
      duracion: form.duracion,
      jrPass: form.jrPass === 'si' ? true : form.jrPass === 'no' ? false : undefined,
      notas: form.notas,
      orden: cargado.t?.orden ?? Math.max(0, ...otrosDelDia.map((x) => x.orden)) + 1,
    };
    await viaje.guardarTrayecto(t);
    navegar(-1);
  };

  return (
    <>
      <Cabecera titulo={nuevo ? 'Nuevo trayecto' : 'Editar trayecto'} atras />
      <main className="contenido">
        <form
          className="formulario"
          onSubmit={(e) => {
            e.preventDefault();
            void guardar();
          }}
        >
          <Campo etiqueta="Título" ayuda="Si lo dejas vacío: «origen → destino».">
            <input className="entrada" value={form.titulo} onChange={(e) => cambiar({ titulo: e.target.value })} />
          </Campo>
          <div className="dos-columnas">
            <Campo etiqueta="Día">
              <CampoFecha etiqueta="Día" min={config.inicio} max={config.fin} valor={form.fecha} alCambiar={(fecha) => fecha && cambiar({ fecha })} />
            </Campo>
            <Campo etiqueta="Hora">
              <input className="entrada" type="time" value={form.hora} onChange={(e) => cambiar({ hora: e.target.value })} />
            </Campo>
          </div>
          <Campo etiqueta="Desde" ayuda="Vacío = desde donde esté el móvil.">
            <input className="entrada" value={form.origen} onChange={(e) => cambiar({ origen: e.target.value })} placeholder="Estación, hotel, dirección…" />
          </Campo>
          <Campo etiqueta="Hasta" ayuda="Lo que se busca en Google Maps / NAVITIME.">
            <input className="entrada" value={form.destino} onChange={(e) => cambiar({ destino: e.target.value })} />
          </Campo>
          <Campo etiqueta="Pasos" ayuda="Uno por línea: línea de tren, transbordos, salidas…">
            <textarea className="entrada" rows={5} value={form.pasos} onChange={(e) => cambiar({ pasos: e.target.value })} />
          </Campo>
          <Campo etiqueta="Duración">
            <input className="entrada" value={form.duracion} onChange={(e) => cambiar({ duracion: e.target.value })} placeholder="~45 min" />
          </Campo>
          {tiene(config, 'jrpass') && (
          <div className="campo">
            <span>¿Lo cubre el JR Pass?</span>
            <Opciones
              valor={form.jrPass}
              alCambiar={(jrPass) => cambiar({ jrPass })}
              opciones={[
                { valor: 'si', texto: 'Sí' },
                { valor: 'no', texto: 'No' },
                { valor: '?', texto: 'Sin decir' },
              ]}
            />
          </div>
          )}
          <Campo etiqueta="Notas">
            <textarea className="entrada" rows={3} value={form.notas} onChange={(e) => cambiar({ notas: e.target.value })} />
          </Campo>
          <button className="boton shu">Guardar</button>
          {!nuevo && (
            <button
              type="button"
              className="boton peligro"
              onClick={async () => {
                if (!confirmarBorrado(`el trayecto del ${fechaCorta(form.fecha)}`)) return;
                await viaje.borrarTrayecto(cargado.t!.id);
                navegar(-1);
              }}
            >
              Borrar trayecto
            </button>
          )}
        </form>
      </main>
    </>
  );
}
