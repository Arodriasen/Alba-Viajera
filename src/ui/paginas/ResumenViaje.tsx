import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { EnlaceDiario } from './DiarioPage';

import { tiene } from '@/domain/config';
import { euros } from '@/domain/gastos';
import { resumenDelViaje } from '@/domain/resumen';
import { fechaCorta, fechaLarga, type Fecha } from '@/domain/viaje';
import { tituloDelViaje } from '@/domain/viajes';

import { useAlba, useConsulta } from '../AlbaViajera';
import { ciudad } from '../ciudades';
import { Cargando, Portada } from '../componentes/comunes';
import { useUrlFoto } from '../componentes/FotoDelDia';
import { ExportarExcel } from './AjustesPage';

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

function Cifra({ n, texto }: { n: number | string; texto: string }) {
  return (
    <div className="cifra">
      <span className="numero">{n}</span>
      <span className="muy-pequeno">{texto}</span>
    </div>
  );
}

function MiniFoto({ fecha, foto }: { fecha: Fecha; foto: string }) {
  const url = useUrlFoto(foto);
  return <Link to={`/dia/${fecha}`}>{url && <img src={url} alt={`Foto del ${fechaLarga(fecha)}`} loading="lazy" />}</Link>;
}

/** En Hoy, cuando el viaje ha terminado: el viaje en cifras, por ciudades y con las fotos del día. */
export function ResumenViaje() {
  const { config } = useAlba();
  const datos = useConsulta(
    async ({ viaje }) => ({
      config,
      dias: await viaje.dias(),
      alojamientos: await viaje.alojamientos(),
      trayectos: await viaje.trayectos(),
      reservas: await viaje.reservas(),
      gastos: await viaje.gastos(),
      presupuesto: await viaje.presupuesto(),
    }),
    [config],
  );
  if (!datos) return <Cargando />;
  const r = resumenDelViaje(datos);
  const japon = config.pais === 'JP';

  return (
    <>
      <Portada ciudad={{ nombre: config.destino, kanji: config.simbolo, color: config.color }}>
        <p className="etiqueta">{tituloDelViaje(config.destino)}</p>
        <p className="titulo-dia">{japon ? 'おかえり' : '¡De vuelta!'}</p>
        <p className="sub">
          {fechaCorta(config.inicio)} – {fechaCorta(config.fin)} {config.fin.slice(0, 4)} · {plural(r.dias, 'día', 'días')}
        </p>
      </Portada>

      <div className="cifras-viaje">
        <Cifra n={r.noches} texto={r.noches === 1 ? 'noche fuera' : 'noches fuera'} />
        <Cifra n={r.ciudades.length} texto={r.ciudades.length === 1 ? 'ciudad' : 'ciudades'} />
        <Cifra n={r.hoteles} texto={r.hoteles === 1 ? 'hotel' : 'hoteles'} />
        {r.trayectos > 0 && <Cifra n={r.trayectos} texto={r.trayectosJr ? `trayectos (${r.trayectosJr} con JR Pass)` : 'trayectos'} />}
        {r.entradas > 0 && <Cifra n={r.entradas} texto={r.entradas === 1 ? 'entrada' : 'entradas'} />}
        {r.fotos.length > 0 && <Cifra n={r.fotos.length} texto={r.fotos.length === 1 ? 'foto del día' : 'fotos del día'} />}
      </div>

      {r.gastado !== undefined && (
        <Link to="/gastos" className="tarjeta enlace fila-tarjeta">
          <span className="texto">
            <span className="etiqueta">Lo que costó</span>
            <span className="negrita">
              {euros(r.gastado)}
              {r.previsto ? <span className="secundario" style={{ fontWeight: 400 }}> de {euros(r.previsto)} previstos</span> : null}
            </span>
            {r.masGasto && (
              <span className="pequeno secundario">
                Donde más: {r.masGasto.nombre.toLowerCase()}, {euros(r.masGasto.euros)} · {plural(r.gastos, 'gasto', 'gastos')}
              </span>
            )}
          </span>
        </Link>
      )}

      {r.fotos.length > 0 && (
        <section className="seccion">
          <div className="seccion-cabecera">
            <p className="etiqueta">Un día, una foto</p>
            <Link to="/album">Álbum</Link>
          </div>
          <div className="tira-fotos">
            {r.fotos.map((f) => (
              <MiniFoto key={f.fecha} {...f} />
            ))}
          </div>
        </section>
      )}

      {r.ciudades.length > 0 && (
        <section className="seccion">
          <p className="etiqueta">Por dónde pasasteis</p>
          <div className="tarjeta" style={{ gap: 0, paddingTop: 4, paddingBottom: 4 }}>
            {r.ciudades.map((c) => {
              const estilo = ciudad(c.nombre, config.ciudades, config.simbolo, config.salida.ciudad);
              return (
                <div key={c.nombre} className="ciudad-resumen" style={{ '--c': estilo.color } as CSSProperties}>
                  <span className="kanji-ciudad" aria-hidden="true">
                    {estilo.kanji}
                  </span>
                  <span className="texto" style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="negrita">{c.nombre}</span>
                    <span className="pequeno secundario">
                      {c.noches ? plural(c.noches, 'noche', 'noches') : 'de paso'} · {plural(c.dias, 'día', 'días')}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {r.parques.length > 0 && (
        <div className="pastillas">
          {r.parques.map((p) => (
            <span key={p} className="pastilla shu">
              {p}
            </span>
          ))}
        </div>
      )}

      <div className="botones">
        {tiene(config, 'album') && (
          <Link to="/album" className="boton shu">
            Ver el álbum
          </Link>
        )}
        <EnlaceDiario className="boton claro" texto="Leer el diario" />
        <Link to="/viaje" className="boton claro">
          Ver el viaje día a día
        </Link>
      </div>

      <ExportarExcel />
    </>
  );
}
