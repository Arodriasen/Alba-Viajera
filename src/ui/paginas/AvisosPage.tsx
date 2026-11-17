import { useState, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  avisosActivos,
  ESCALA_SHINDO,
  lugarLegible,
  NOMBRE_NIVEL,
  nosAfecta,
  shindo,
  TEXTO_NIVEL_TSUNAMI,
  TEXTO_TSUNAMI,
} from '@/domain/clima';
import { avisosJma, ENLACES, terremotos, tifones, tsunamis } from '@/infrastructure/clima';

import { useAlba } from '../AlbaViajera';
import { Cabecera } from '../componentes/comunes';
import { useDato, useUbicacion } from '../componentes/clima';
import { Icono, type NombreIcono } from '../componentes/Icono';
import { ElegirCiudad } from './TiempoPage';

const fmt = new Intl.DateTimeFormat('es-ES', { timeZone: 'Asia/Tokyo', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const QUE_HACER: { icono: NombreIcono; titulo: string; puntos: string[] }[] = [
  {
    icono: 'terremoto',
    titulo: 'Terremoto',
    puntos: [
      'Agacharse, cubrirse (bajo una mesa) y agarrarse. Proteger la cabeza de Alba.',
      'No salir corriendo a la calle mientras tiembla: caen cristales y carteles.',
      'Lejos de ventanas, estanterías y máquinas expendedoras.',
      'En el tren o metro: agarrarse y seguir las instrucciones del personal.',
      'Después: puertas abiertas para que no se atasquen, y atentos a las réplicas.',
    ],
  },
  {
    icono: 'tsunami',
    titulo: 'Tsunami',
    puntos: [
      'Si estáis en la costa y tiembla fuerte o suena la alarma: subir a un sitio alto YA, sin esperar.',
      'Seguir los carteles de evacuación (津波避難) o subir a un edificio alto de hormigón.',
      'No volver hasta que se levante el aviso: llegan varias olas.',
    ],
  },
  {
    icono: 'viento',
    titulo: 'Tifón, lluvia o nieve fuerte',
    puntos: [
      'Quedarse en el hotel si hay aviso (警報): trenes y vuelos suelen pararse.',
      'Mirar el estado de los trenes antes de salir (NAVITIME o la web de JR).',
      'Agua, algo de comida y el móvil cargado.',
    ],
  },
];

export function AvisosPage() {
  const { config } = useAlba();
  const [busqueda] = useSearchParams();
  const nombre = busqueda.get('ciudad') || config.ciudades[0]?.nombre;
  const u = useUbicacion(nombre);
  const meteo = useDato(u?.oficina ? () => avisosJma(u.oficina!) : undefined, [u?.oficina], 5 * 60_000);
  const sismos = useDato(terremotos, [], 2 * 60_000);
  const olas = useDato(tsunamis, [], 2 * 60_000);
  const tif = useDato(tifones, [], 30 * 60_000);
  const [verEscala, setVerEscala] = useState(false);

  const avisos = meteo.dato ? avisosActivos(meteo.dato.valor.areas, u?.zona) : undefined;
  const prefsViaje = config.ciudades.map((c) => c.pref).filter((p): p is string => !!p);

  return (
    <>
      <Cabecera titulo="Avisos" atras />
      <main className="contenido">
        <ElegirCiudad actual={u?.nombre} />

        <section className="seccion">
          <p className="etiqueta">Avisos meteorológicos · {u?.nombre}</p>
          {!avisos ? (
            <p className="tarjeta pequeno secundario" style={{ margin: 0 }}>
              {meteo.error || (u && !u.oficina) ? 'No se han podido consultar ahora.' : 'Consultando la JMA…'}
            </p>
          ) : avisos.length === 0 ? (
            <div className="estado-ok tarjeta">
              <Icono nombre="check" tamano={20} /> Sin avisos ahora mismo
            </div>
          ) : (
            <div className="lista">
              {avisos.map((a) => (
                <div key={a.codigo} className={`fila aviso-meteo ${a.nivel}`}>
                  <span className="icono-categoria">
                    <Icono nombre="aviso" tamano={20} />
                  </span>
                  <span className="texto">
                    <span className="negrita">{a.nombre}</span>
                    <span className="muy-pequeno secundario">{NOMBRE_NIVEL[a.nivel]}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="seccion">
          <p className="etiqueta">Tsunami y tifones</p>
          <div className="lista">
            <div className="fila">
              <span className="icono-categoria" style={{ '--c': '#2f7f86' } as CSSProperties}>
                <Icono nombre="tsunami" tamano={20} />
              </span>
              <span className="texto">
                {olas.dato?.valor.length ? (
                  olas.dato.valor.map((t) => (
                    <span key={t.nivel} className="error negrita">
                      {TEXTO_NIVEL_TSUNAMI[t.nivel]}: {t.zonas.join(', ')}
                    </span>
                  ))
                ) : (
                  <span>{olas.dato ? 'Ningún aviso de tsunami' : olas.error ? 'No se ha podido consultar' : 'Consultando…'}</span>
                )}
              </span>
            </div>
            <a className="fila" href={ENLACES.tifones} target="_blank" rel="noreferrer">
              <span className="icono-categoria" style={{ '--c': '#3d5a80' } as CSSProperties}>
                <Icono nombre="viento" tamano={20} />
              </span>
              <span className="texto">
                <span>
                  {tif.dato === undefined
                    ? tif.error
                      ? 'No se ha podido consultar'
                      : 'Consultando…'
                    : tif.dato.valor === 0
                      ? 'Ningún tifón activo'
                      : `${tif.dato.valor} ${tif.dato.valor === 1 ? 'tifón activo' : 'tifones activos'} (ver mapa de la JMA)`}
                </span>
                <span className="muy-pequeno secundario">En enero son muy raros: la temporada va de junio a octubre.</span>
              </span>
              <Icono nombre="enlace" tamano={16} />
            </a>
          </div>
        </section>

        <section className="seccion">
          <div className="seccion-cabecera">
            <p className="etiqueta">Terremotos recientes</p>
            <button onClick={() => setVerEscala(!verEscala)}>{verEscala ? 'Ocultar escala' : '¿Qué es la intensidad?'}</button>
          </div>
          {verEscala && (
            <div className="tarjeta">
              <p className="pequeno" style={{ margin: 0 }}>
                En Japón se mide la <span className="negrita">intensidad</span> (shindo, de 0 a 7): lo que se nota en cada sitio. La magnitud es la energía
                del terremoto.
              </p>
              {ESCALA_SHINDO.map((e) => (
                <p key={e.nivel} className="pequeno" style={{ margin: 0 }}>
                  <span className="negrita">{e.nivel}</span> · {e.texto}
                </p>
              ))}
            </div>
          )}
          {!sismos.dato ? (
            <p className="tarjeta pequeno secundario" style={{ margin: 0 }}>
              {sismos.error ? 'No se han podido consultar ahora.' : 'Consultando…'}
            </p>
          ) : (
            <div className="lista">
              {sismos.dato.valor.slice(0, 10).map((t) => {
                const nuestro = nosAfecta(t, prefsViaje, 10);
                const enCiudad = u?.pref ? t.prefecturas[u.pref] : undefined;
                return (
                  <div key={t.id} className={`fila terremoto ${t.maxima >= 40 ? 'fuerte' : ''}`}>
                    <span className="intensidad">{shindo(t.maxima)}</span>
                    <span className="texto">
                      {(() => {
                        const l = lugarLegible(t.lugar);
                        return (
                          <span>
                            {l.es && <span className="negrita">{l.es} · </span>}
                            <span className={l.es ? 'pequeno secundario' : 'negrita'}>{l.ja}</span>
                          </span>
                        );
                      })()}
                      <span className="muy-pequeno secundario">
                        {fmt.format(t.hora)}
                        {t.magnitud !== undefined && ` · M${t.magnitud.toFixed(1)}`}
                        {t.tsunami !== 'ninguno' && ` · ${TEXTO_TSUNAMI[t.tsunami]}`}
                      </span>
                      {nuestro && (
                        <span className="muy-pequeno negrita" style={{ color: 'var(--shu)' }}>
                          {enCiudad ? `En ${u?.nombre}: intensidad ${shindo(enCiudad)}` : 'Se notó en alguna ciudad del viaje'}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <p className="muy-pequeno secundario" style={{ margin: 0 }}>
            El número es la intensidad máxima. Japón tiene terremotos pequeños casi todos los días: lo normal es no notarlos.
          </p>
        </section>

        <section className="seccion">
          <p className="etiqueta">Qué hacer</p>
          {QUE_HACER.map((q) => (
            <details key={q.titulo} className="tarjeta que-hacer">
              <summary>
                <Icono nombre={q.icono} tamano={20} /> <span className="negrita">{q.titulo}</span>
              </summary>
              <ul className="recordatorios" style={{ padding: 0 }}>
                {q.puntos.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </details>
          ))}
          <div className="botones">
            <a className="boton claro pequeno" href="tel:119">
              <Icono nombre="telefono" tamano={18} /> 119 ambulancia
            </a>
            <a className="boton claro pequeno" href="tel:110">
              <Icono nombre="sirena" tamano={18} /> 110 policía
            </a>
          </div>
          <a className="boton claro pequeno" href={ENLACES.refugios} target="_blank" rel="noreferrer">
            <Icono nombre="pin" tamano={18} /> Refugios cerca (避難所)
          </a>
          <a className="tarjeta enlace fila-tarjeta" href={ENLACES.safetyTips} target="_blank" rel="noreferrer">
            <span className="icono-redondo">
              <Icono nombre="sirena" tamano={20} />
            </span>
            <span className="texto">
              <span className="negrita">Safety tips (app oficial)</span>
              <span className="pequeno secundario">La alerta de terremoto de segundos antes llega al móvil por la red japonesa. Esta app del Gobierno, en español, como respaldo.</span>
            </span>
            <Icono nombre="enlace" tamano={18} />
          </a>
        </section>

        <p className="muy-pequeno secundario centrado" style={{ margin: 0 }}>
          Fuentes: Agencia Meteorológica de Japón (JMA) y P2PQuake. Se actualiza solo con la pantalla abierta.
        </p>
      </main>
    </>
  );
}
