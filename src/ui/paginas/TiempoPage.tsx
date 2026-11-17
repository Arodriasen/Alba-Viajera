import { useSearchParams } from 'react-router-dom';

import { consejoDelDia, describirTiempo, horaEn } from '@/domain/clima';
import { deFecha, diaSemana } from '@/domain/viaje';

import { useAlba } from '../AlbaViajera';
import { Cabecera, Cargando } from '../componentes/comunes';
import { grados, iconoTiempo, usePronostico, useUbicacion } from '../componentes/clima';
import { Icono } from '../componentes/Icono';

const haceCuanto = (d: Date) => {
  const min = Math.floor((Date.now() - d.getTime()) / 60_000);
  return min < 1 ? 'ahora mismo' : min < 60 ? `hace ${min} min` : `hace ${Math.floor(min / 60)} h`;
};

/** Selector de ciudad del viaje (chips). */
export function ElegirCiudad({ actual }: { actual?: string }) {
  const { config } = useAlba();
  const [, setBusqueda] = useSearchParams();
  return (
    <div className="opciones desplazable" role="radiogroup">
      {config.ciudades.map((c) => (
        <button
          key={c.nombre}
          type="button"
          role="radio"
          aria-checked={actual === c.nombre}
          className={`opcion ${actual === c.nombre ? 'activa' : ''}`}
          onClick={() => setBusqueda({ ciudad: c.nombre }, { replace: true })}
        >
          {c.kanji} {c.nombre}
        </button>
      ))}
    </div>
  );
}

export function TiempoPage() {
  const { config } = useAlba();
  const [busqueda] = useSearchParams();
  const nombre = busqueda.get('ciudad') || config.ciudades[0]?.nombre;
  const u = useUbicacion(nombre);
  const { dato, error } = usePronostico(u);

  return (
    <>
      <Cabecera titulo="El tiempo" atras />
      <main className="contenido">
        <ElegirCiudad actual={u?.nombre} />
        {!dato ? (
          error ? (
            <p className="vacio">No se ha podido consultar el tiempo (sin conexión).</p>
          ) : (
            <Cargando />
          )
        ) : (
          (() => {
            const p = dato.valor;
            const d = describirTiempo(p.ahora.codigo, p.ahora.deDia);
            const consejo = consejoDelDia(p.horas, new Date(), config.zona);
            return (
              <>
                <div className="tiempo-ahora tarjeta">
                  <Icono nombre={iconoTiempo(d.icono)} tamano={56} />
                  <div>
                    <p className="temperatura">{grados(p.ahora.temperatura)}</p>
                    <p className="negrita" style={{ margin: 0 }}>
                      {d.texto}
                    </p>
                    <p className="pequeno secundario" style={{ margin: 0 }}>
                      Sensación {grados(p.ahora.sensacion)} · viento {Math.round(p.ahora.viento)} km/h
                    </p>
                    {p.dias[0] && (
                      <p className="pequeno secundario" style={{ margin: 0 }}>
                        Hoy {grados(p.dias[0].maxima)} / {grados(p.dias[0].minima)}
                      </p>
                    )}
                  </div>
                </div>
                {consejo && <div className="aviso ai">{consejo}</div>}

                <section className="seccion">
                  <p className="etiqueta">Próximas horas (hora de {config.destino})</p>
                  <div className="horas tarjeta">
                    {p.horas
                      .filter((h) => h.hora.getTime() > Date.now() - 3600_000)
                      .slice(0, 12)
                      .map((h) => (
                        <div key={h.hora.toISOString()} className="hora">
                          <span className="muy-pequeno secundario">{horaEn(h.hora, config.zona)}</span>
                          <Icono nombre={iconoTiempo(describirTiempo(h.codigo, h.deDia).icono)} tamano={22} />
                          <span className="negrita">{grados(h.temperatura)}</span>
                          <span className={`muy-pequeno ${h.lluvia >= 50 ? 'lluvia-alta' : 'secundario'}`}>{h.lluvia}%</span>
                        </div>
                      ))}
                  </div>
                </section>

                <section className="seccion">
                  <p className="etiqueta">Próximos días</p>
                  <div className="lista">
                    {p.dias.slice(0, 10).map((dia, i) => {
                      const dd = describirTiempo(dia.codigo);
                      return (
                        <div key={dia.fecha} className="fila dia-tiempo">
                          <span className="dia-nombre">{i === 0 ? 'Hoy' : `${diaSemana(dia.fecha).slice(0, 3)} ${deFecha(dia.fecha).getDate()}`}</span>
                          <Icono nombre={iconoTiempo(dd.icono)} tamano={22} />
                          <span className="texto pequeno">{dd.texto}</span>
                          <span className={`muy-pequeno ${dia.lluvia >= 50 ? 'lluvia-alta' : 'secundario'}`}>{dia.lluvia}%</span>
                          <span className="temps">
                            <span className="negrita">{grados(dia.maxima)}</span> <span className="secundario">{grados(dia.minima)}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
                <p className="muy-pequeno secundario centrado" style={{ margin: 0 }}>
                  {dato.guardado ? 'Sin conexión: dato guardado' : 'Open-Meteo (modelo de la JMA)'} · {haceCuanto(dato.cuando)}
                </p>
              </>
            );
          })()
        )}
      </main>
    </>
  );
}
