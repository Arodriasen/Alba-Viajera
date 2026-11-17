import { Fragment, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';

import { tiene } from '@/domain/config';
import { nombreEnFrase } from '@/domain/idiomas';
import { euros, resumir } from '@/domain/gastos';
import { porComprar } from '@/domain/viaje';

import { useAlba, useConsulta } from '../AlbaViajera';
import { Cabecera, Cargando } from '../componentes/comunes';
import { Icono, type NombreIcono } from '../componentes/Icono';
import { TarjetasFrases } from './FrasesPage';
import { TarjetasParques } from './ParquesPage';

/** Todo lo que no cabe en la barra de abajo. */
export function MasPage() {
  const { config } = useAlba();
  const datos = useConsulta(
    async ({ viaje }) => ({
      reservas: await viaje.reservas(),
      gastos: await viaje.gastos(),
      presupuesto: await viaje.presupuesto(),
      fotos: (await viaje.dias()).filter((d) => d.foto).length,
      altura: await viaje.alturaAlba(),
      elementos: await viaje.elementos(),
    }),
    [],
  );
  if (!datos) return <Cargando />;
  const pendientes = porComprar(datos.reservas).length;
  const r = resumir(datos.gastos, datos.presupuesto);

  const baldosa = (to: string, icono: NombreIcono, titulo: string, detalle: string, color: string) => (
    <Link to={to} className="baldosa" style={{ '--c': color } as CSSProperties}>
      <span className="icono-categoria">
        <Icono nombre={icono} tamano={22} />
      </span>
      <span className="negrita">{titulo}</span>
      <span className="muy-pequeno secundario">{detalle}</span>
    </Link>
  );

  return (
    <>
      <Cabecera titulo="Más" />
      <main className="contenido">
        <div className="baldosas">
          {tiene(config, 'reservas') && baldosa('/reservas', 'ticket', 'Reservas', pendientes ? `${pendientes} pendientes` : 'Todo comprado', '#b5476b')}
          {tiene(config, 'presupuesto') && baldosa('/gastos', 'cartera', 'Presupuesto', `${euros(r.gastado)} de ${euros(r.previsto)}`, '#2d4b73')}
          {tiene(config, 'tiempo') && baldosa('/tiempo', 't_nubes', 'El tiempo', 'Ahora, por horas y 10 días', '#2f7f86')}
          {tiene(config, 'avisos') && baldosa('/avisos', 'aviso', 'Avisos', 'Terremotos, tsunamis, tifones y qué hacer', '#c8641f')}
          {config.listas.map((l) => {
            const suyos = datos.elementos.filter((e) => e.lista === l.id);
            const quedan = suyos.filter((e) => !e.hecho).length;
            return (
              <Fragment key={l.id}>
                {baldosa(`/lista/${l.id}`, l.icono, l.nombre, !suyos.length ? 'Vacía' : quedan ? `${quedan} por hacer` : 'Todo hecho', l.color)}
              </Fragment>
            );
          })}
        </div>

        {tiene(config, 'parques') && (
        <section className="apartado-parques">
          <div className="seccion-cabecera">
            <p className="etiqueta">Parques con Alba</p>
            <span className="muy-pequeno secundario">Alba mide {datos.altura} cm</span>
          </div>
          <TarjetasParques />
        </section>
        )}

        {tiene(config, 'frases') && (
        <section className="apartado-parques">
          <div className="seccion-cabecera">
            <p className="etiqueta">Frases útiles en {nombreEnFrase(config.idiomaDestino)}</p>
            <span className="muy-pequeno secundario">Para enseñar o escuchar</span>
          </div>
          <TarjetasFrases />
        </section>
        )}

        {tiene(config, 'album') && (
        <Link to="/album" className="tarjeta enlace fila-tarjeta">
          <span className="icono-redondo verde">
            <Icono nombre="galeria" tamano={20} />
          </span>
          <span className="texto">
            <span className="negrita">Álbum</span>
            <span className="pequeno secundario">{datos.fotos === 1 ? '1 foto del día' : `${datos.fotos} fotos del día`}</span>
          </span>
          <Icono nombre="chevron" tamano={20} />
        </Link>
        )}

        <Link to="/ajustes" className="tarjeta enlace fila-tarjeta">
          <span className="icono-redondo gris">
            <Icono nombre="ajustes" tamano={20} />
          </span>
          <span className="texto">
            <span className="negrita">Ajustes del viaje</span>
            <span className="pequeno secundario">Destino, fechas, vuelos, ciudades y qué apartados tiene</span>
          </span>
          <Icono nombre="chevron" tamano={20} />
        </Link>

        <Link to="/" className="tarjeta enlace fila-tarjeta">
          <span className="icono-redondo gris">
            <Icono nombre="viajes" tamano={20} />
          </span>
          <span className="texto">
            <span className="negrita">Todos los viajes</span>
            <span className="pequeno secundario">Volver a la lista o empezar otro</span>
          </span>
          <Icono nombre="chevron" tamano={20} />
        </Link>
      </main>
    </>
  );
}
