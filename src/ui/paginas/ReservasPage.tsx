import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { ordenarReservas, porComprar, type EstadoReserva, type Reserva } from '@/domain/viaje';

import { useAlba, useConsulta } from '../AlbaViajera';
import { BotonAnadir, Cabecera, Cargando, FilaReserva } from '../componentes/comunes';
import { aFechaHoraLocal, Campo, confirmarBorrado, deFechaHoraLocal, Opciones } from '../componentes/formulario';
import { Icono } from '../componentes/Icono';
import { CampoFecha } from '../componentes/CampoFecha';

export function ReservasPage() {
  const lista = useConsulta(({ viaje }) => viaje.reservas(), []);
  const [verDescartadas, setVerDescartadas] = useState(false);
  if (!lista) return <Cargando />;
  const pendientes = porComprar(lista);
  const hechas = ordenarReservas(lista.filter((r) => r.estado === 'comprada'));
  const descartadas = ordenarReservas(lista.filter((r) => r.estado === 'descartada'));

  return (
    <>
      <Cabecera titulo="Reservas y entradas" atras="/mas" />
      <main className="contenido">
        <section className="seccion">
          <p className="etiqueta">Pendientes · {pendientes.length}</p>
          {pendientes.length ? (
            <div className="lista">
              {pendientes.map((r) => (
                <FilaReserva key={r.id} reserva={r} />
              ))}
            </div>
          ) : (
            <p className="vacio">Todo comprado 🎉</p>
          )}
          <BotonAnadir to="/reserva/nueva" texto="Añadir reserva o entrada" />
        </section>
        {hechas.length > 0 && (
          <section className="seccion">
            <p className="etiqueta">Hechas · {hechas.length}</p>
            <div className="lista">
              {hechas.map((r) => (
                <FilaReserva key={r.id} reserva={r} />
              ))}
            </div>
          </section>
        )}
        {descartadas.length > 0 && (
          <section className="seccion">
            <div className="seccion-cabecera">
              <p className="etiqueta">Descartadas · {descartadas.length}</p>
              <button onClick={() => setVerDescartadas(!verDescartadas)}>{verDescartadas ? 'Ocultar' : 'Ver'}</button>
            </div>
            {verDescartadas && (
              <div className="lista">
                {descartadas.map((r) => (
                  <FilaReserva key={r.id} reserva={r} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}

interface Form {
  titulo: string;
  fechaUso: string;
  horaUso: string;
  venta: string;
  estado: EstadoReserva;
  enlace: string;
  notas: string;
}

export function EditarReservaPage() {
  const { id } = useParams();
  const nueva = !id || id === 'nueva';
  const [busqueda] = useSearchParams();
  const { viaje, config } = useAlba();
  const navegar = useNavigate();
  const cargado = useConsulta(async ({ viaje: v }) => ({ r: nueva ? undefined : await v.reserva(id!) }), [id]);
  const [form, setForm] = useState<Form>();

  useEffect(() => {
    if (form || !cargado) return;
    const r = cargado.r;
    setForm({
      titulo: r?.titulo ?? '',
      fechaUso: r?.fechaUso ?? busqueda.get('fecha') ?? '',
      horaUso: r?.horaUso ?? '',
      venta: aFechaHoraLocal(r?.venta),
      estado: r?.estado ?? 'pendiente',
      enlace: r?.enlace ?? '',
      notas: r?.notas ?? '',
    });
  }, [cargado, form, busqueda]);

  if (!form || !cargado) return <Cargando />;
  if (!nueva && !cargado.r) {
    return (
      <>
        <Cabecera titulo="Reserva" atras />
        <p className="vacio">Esta reserva ya no existe.</p>
      </>
    );
  }
  const cambiar = (c: Partial<Form>) => setForm({ ...form, ...c });

  return (
    <>
      <Cabecera titulo={nueva ? 'Nueva reserva' : 'Editar reserva'} atras />
      <main className="contenido">
        <form
          className="formulario"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!form.titulo.trim()) return;
            const r: Reserva = {
              id: cargado.r?.id ?? crypto.randomUUID(),
              titulo: form.titulo,
              fechaUso: form.fechaUso || undefined,
              horaUso: form.horaUso || undefined,
              venta: deFechaHoraLocal(form.venta),
              estado: form.estado,
              enlace: form.enlace,
              notas: form.notas,
            };
            await viaje.guardarReserva(r);
            navegar(-1);
          }}
        >
          <Campo etiqueta="Qué es">
            <input className="entrada" required value={form.titulo} onChange={(e) => cambiar({ titulo: e.target.value })} placeholder="Entradas, tren, restaurante…" />
          </Campo>
          <div className="campo">
            <span>Estado</span>
            <Opciones
              valor={form.estado}
              alCambiar={(estado) => cambiar({ estado })}
              opciones={[
                { valor: 'pendiente', texto: 'Pendiente' },
                { valor: 'comprada', texto: 'Hecha' },
                { valor: 'descartada', texto: 'Descartada' },
              ]}
            />
          </div>
          <div className="dos-columnas">
            <Campo etiqueta="Día">
              <CampoFecha opcional etiqueta="Día" min={config.inicio} max={config.fin} valor={form.fechaUso || undefined} alCambiar={(fechaUso) => cambiar({ fechaUso: fechaUso ?? '' })} />
            </Campo>
            <Campo etiqueta="Hora">
              <input className="entrada" type="time" value={form.horaUso} onChange={(e) => cambiar({ horaUso: e.target.value })} />
            </Campo>
          </div>
          <Campo etiqueta="Sale a la venta" ayuda="En la hora de este móvil. Sale arriba en Hoy con la cuenta atrás.">
            <input className="entrada" type="datetime-local" value={form.venta} onChange={(e) => cambiar({ venta: e.target.value })} />
          </Campo>
          <Campo etiqueta="Enlace">
            <input className="entrada" type="url" value={form.enlace} onChange={(e) => cambiar({ enlace: e.target.value })} placeholder="https://…" />
          </Campo>
          <Campo etiqueta="Notas">
            <textarea className="entrada" rows={4} value={form.notas} onChange={(e) => cambiar({ notas: e.target.value })} />
          </Campo>
          <button className="boton shu">Guardar</button>
          {form.enlace && (
            <a className="boton claro" href={form.enlace} target="_blank" rel="noreferrer">
              <Icono nombre="enlace" tamano={18} /> Abrir el enlace
            </a>
          )}
          {!nueva && (
            <button
              type="button"
              className="boton peligro"
              onClick={async () => {
                if (!confirmarBorrado(`«${form.titulo}»`)) return;
                await viaje.borrarReserva(cargado.r!.id);
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
