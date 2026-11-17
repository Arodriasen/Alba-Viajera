import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { CATEGORIAS_FRASES, frasesDe, frasesDeSerie, porTraducir, traduccionVale, type Frase, type IdCategoriaFrases, type TraduccionSerie } from '@/domain/frases';
import { idiomaDe, nombreEnFrase } from '@/domain/idiomas';
import { traducirTextos } from '@/infrastructure/api';

import { useAlba, useConsulta } from '../AlbaViajera';
import { BotonAnadir, Cabecera, Cargando } from '../componentes/comunes';
import { Campo, confirmarBorrado, Opciones } from '../componentes/formulario';
import { Icono } from '../componentes/Icono';

const puedeHablar = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

/**
 * La voz del móvil en el idioma de allí. `sonando` = la frase que se está leyendo (para enseñarlo):
 * se pone al tocar y se quita al acabar. Tocar otra vez la misma la para.
 */
function useVoz() {
  const { config } = useAlba();
  const [sonando, setSonando] = useState<string>();
  const seguro = useRef<ReturnType<typeof setTimeout>>(undefined);
  const voz = idiomaDe(config.idiomaDestino).voz;

  const parar = useCallback(() => {
    if (puedeHablar()) speechSynthesis.cancel();
    clearTimeout(seguro.current);
    setSonando(undefined);
  }, []);

  const hablar = useCallback(
    (id: string, texto: string) => {
      if (!puedeHablar() || !texto.trim()) return;
      if (sonando === id) return parar();
      speechSynthesis.cancel();
      clearTimeout(seguro.current);
      const u = new SpeechSynthesisUtterance(texto);
      u.lang = voz;
      u.rate = 0.85;
      const v = speechSynthesis.getVoices().find((x) => x.lang.replace('_', '-').toLowerCase().startsWith(voz.slice(0, 2).toLowerCase()));
      if (v) u.voice = v;
      const fin = () => {
        clearTimeout(seguro.current);
        setSonando((s) => (s === id ? undefined : s));
      };
      u.onend = fin;
      u.onerror = fin;
      setSonando(id);
      // Por si el navegador no avisa al acabar (pasa en algunos iPhone): se quita sola.
      seguro.current = setTimeout(fin, 2500 + texto.length * 180);
      speechSynthesis.speak(u);
    },
    [sonando, parar, voz],
  );

  useEffect(() => parar, [parar]);
  return { sonando, hablar, parar };
}

/** Botón de escuchar que se ve claramente mientras suena (y entonces para). */
function BotonEscuchar({ id, texto, voz, conTexto }: { id: string; texto: string; voz: ReturnType<typeof useVoz>; conTexto?: boolean }) {
  if (!puedeHablar()) return null;
  const suena = voz.sonando === id;
  return (
    <button
      type="button"
      className={`${conTexto ? 'boton claro' : 'accion-foto'} escuchar ${suena ? 'sonando' : ''}`}
      style={conTexto ? { alignSelf: 'flex-start', width: 'auto' } : undefined}
      aria-pressed={suena}
      aria-label={suena ? 'Parar' : `Escuchar: ${texto}`}
      onClick={() => voz.hablar(id, texto)}
    >
      <Icono nombre={suena ? 'parar' : 'escuchar'} tamano={20} />
      {conTexto && (suena ? ' Sonando… (parar)' : ' Escuchar')}
    </button>
  );
}

/**
 * Las de serie de este viaje. Si son de otros idiomas que español → japonés, se traducen una vez con la
 * IA de Cloudflare y se guardan con el viaje (también para el otro móvil).
 */
function useFrasesSerie(): { serie?: Frase[]; traduciendo: boolean; error?: string; reintentar: () => void } {
  const { config, viaje } = useAlba();
  const traduccion = useConsulta(async ({ viaje: v }) => ({ t: await v.traduccionFrases() }), []);
  const [traduciendo, setTraduciendo] = useState(false);
  const [error, setError] = useState<string>();
  const [intento, setIntento] = useState(0);
  const idiomas = { pais: config.pais, idiomaOrigen: config.idiomaOrigen, idiomaDestino: config.idiomaDestino };
  const falta = !!traduccion && !traduccionVale(idiomas, traduccion.t);

  useEffect(() => {
    if (!falta || traduciendo) return;
    const p = porTraducir(idiomas);
    if (!p) return;
    let vigente = true;
    setTraduciendo(true);
    setError(undefined);
    (async () => {
      const espanol = p.textos.map((x) => x.es);
      const destino = await traducirTextos('es', p.a, espanol);
      const origen = p.de === 'es' ? undefined : await traducirTextos('es', p.de, espanol);
      const t: TraduccionSerie = { de: p.de, a: p.a, frases: Object.fromEntries(p.textos.map((x, i) => [x.id, { t: destino[i], ...(origen ? { o: origen[i] } : {}) }])) };
      await viaje.guardarTraduccionFrases(t);
    })()
      .catch(() => vigente && setError('No se han podido traducir ahora (hace falta conexión).'))
      .finally(() => vigente && setTraduciendo(false));
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [falta, config.idiomaOrigen, config.idiomaDestino, intento]);

  return {
    serie: traduccion ? frasesDeSerie(idiomas, traduccion.t) : undefined,
    traduciendo: traduciendo || (falta && !error),
    error,
    reintentar: () => setIntento((n) => n + 1),
  };
}

/** Las cuatro categorías, con el diseño de las tarjetas de los parques. */
export function TarjetasFrases() {
  const { config } = useAlba();
  const japon = config.pais === 'JP';
  return (
    <div className="frases-tarjetas">
      {CATEGORIAS_FRASES.map((c) => (
        <Link key={c.id} to={`/frases/${c.id}`} className="parque-mini" style={{ '--c': c.color } as CSSProperties}>
          <span className="kanji-peq">{japon ? c.kanji : c.emoji}</span>
          <span className="negrita">{c.nombre}</span>
        </Link>
      ))}
    </div>
  );
}

/** La frase en grande, para enseñarla. */
function FraseGrande({ frase, alCerrar, voz }: { frase: Frase; alCerrar: () => void; voz: ReturnType<typeof useVoz> }) {
  const { config } = useAlba();
  return (
    <div className="velo" role="dialog" aria-modal="true">
      <button className="cerrar" onClick={alCerrar} aria-label="Cerrar">
        <Icono nombre="cerrar" tamano={28} />
      </button>
      <div className="direccion">
        <p className="ja" lang={config.idiomaDestino} style={{ margin: 0 }}>
          {frase.ja}
        </p>
        {frase.romaji && (
          <p className="secundario" style={{ margin: 0 }}>
            {frase.romaji}
          </p>
        )}
        <p className="negrita" style={{ margin: 0 }}>
          {frase.es}
        </p>
        <BotonEscuchar id={frase.id} texto={frase.ja} voz={voz} conTexto />
      </div>
    </div>
  );
}

export function FrasesPage() {
  const { categoria = 'basicas' } = useParams();
  const { config } = useAlba();
  const cat = CATEGORIAS_FRASES.find((c) => c.id === categoria) ?? CATEGORIAS_FRASES[0];
  const propias = useConsulta(({ viaje }) => viaje.frasesPropias(), []);
  const { serie, traduciendo, error, reintentar } = useFrasesSerie();
  const voz = useVoz();
  const [grande, setGrande] = useState<Frase>();
  if (!propias) return <Cargando />;
  const lista = frasesDe(cat.id, propias, serie ?? []);

  return (
    <>
      <Cabecera titulo={cat.nombre} atras="/mas" />
      <main className="contenido">
        <p className="pequeno secundario" style={{ margin: 0 }}>
          En {nombreEnFrase(config.idiomaDestino)}. Toca una frase para enseñarla en grande{puedeHablar() ? ' o el altavoz para escucharla' : ''}.
        </p>
        {traduciendo && <p className="aviso ai">Traduciendo las frases al {nombreEnFrase(config.idiomaDestino)}… (solo la primera vez)</p>}
        {error && (
          <p className="aviso">
            {error}{' '}
            <button type="button" className="accion-texto" onClick={reintentar}>
              Reintentar
            </button>
          </p>
        )}
        <div className="lista frases" style={{ '--c': cat.color } as CSSProperties}>
          {lista.map((f) => (
            <div key={f.id} className={`fila frase ${voz.sonando === f.id ? 'sonando' : ''}`}>
              <button className="texto" onClick={() => setGrande(f)}>
                <span className="negrita">{f.es}</span>
                <span className="ja-lista" lang={config.idiomaDestino}>
                  {f.ja}
                </span>
                {f.romaji && <span className="muy-pequeno secundario">{f.romaji}</span>}
              </button>
              <BotonEscuchar id={f.id} texto={f.ja} voz={voz} />
              {f.propia && (
                <Link to={`/frase/${f.id}`} className="accion-foto" aria-label={`Editar: ${f.es}`}>
                  <Icono nombre="editar" tamano={18} />
                </Link>
              )}
            </div>
          ))}
        </div>
        <BotonAnadir to={`/frase/nueva?categoria=${cat.id}`} texto="Añadir una frase vuestra" />
      </main>
      {grande && (
        <FraseGrande
          frase={grande}
          voz={voz}
          alCerrar={() => {
            voz.parar();
            setGrande(undefined);
          }}
        />
      )}
    </>
  );
}

export function EditarFrasePage() {
  const { id } = useParams();
  const [busqueda] = useSearchParams();
  const nueva = !id || id === 'nueva';
  const { viaje, config } = useAlba();
  const navegar = useNavigate();
  const voz = useVoz();
  const propias = useConsulta(({ viaje: v }) => v.frasesPropias(), []);
  const [form, setForm] = useState<Omit<Frase, 'id' | 'propia'>>();
  const [traduciendo, setTraduciendo] = useState(false);
  const [aviso, setAviso] = useState<string>();
  const japones = config.idiomaDestino === 'ja';

  useEffect(() => {
    if (form || !propias) return;
    const f = nueva ? undefined : propias.find((x) => x.id === id);
    setForm(f ?? { categoria: (busqueda.get('categoria') as IdCategoriaFrases | null) ?? 'basicas', es: '', ja: '', romaji: '' });
  }, [propias, form, id, nueva, busqueda]);

  if (!form || !propias) return <Cargando />;
  if (!nueva && !propias.some((x) => x.id === id)) {
    return (
      <>
        <Cabecera titulo="Frase" atras />
        <p className="vacio">Esta frase ya no existe.</p>
      </>
    );
  }
  const cambiar = (c: Partial<typeof form>) => setForm({ ...form, ...c });
  const valida = form.es.trim() !== '' && form.ja.trim() !== '';
  const traducir = async () => {
    setTraduciendo(true);
    setAviso(undefined);
    try {
      const [t] = await traducirTextos(config.idiomaOrigen, config.idiomaDestino, [form.es.trim()]);
      cambiar({ ja: t });
    } catch {
      setAviso('No se ha podido traducir ahora (hace falta conexión). Podéis escribirla a mano.');
    } finally {
      setTraduciendo(false);
    }
  };

  return (
    <>
      <Cabecera titulo={nueva ? 'Nueva frase' : 'Editar frase'} atras />
      <main className="contenido">
        <form
          className="formulario"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!valida) return;
            const frase: Frase = { id: nueva ? crypto.randomUUID() : id!, ...form };
            await viaje.guardarFrasesPropias(nueva ? [...propias, frase] : propias.map((x) => (x.id === id ? frase : x)));
            navegar(`/frases/${form.categoria}`, { replace: true });
          }}
        >
          <div className="campo">
            <span>Categoría</span>
            <Opciones valor={form.categoria} alCambiar={(categoria) => cambiar({ categoria })} opciones={CATEGORIAS_FRASES.map((c) => ({ valor: c.id, texto: c.nombre }))} />
          </div>
          <Campo etiqueta={`En ${nombreEnFrase(config.idiomaOrigen)}`}>
            <input className="entrada" required value={form.es} onChange={(e) => cambiar({ es: e.target.value })} placeholder={config.idiomaOrigen === 'es' ? 'Sin cebolla, por favor' : ''} />
          </Campo>
          <button type="button" className="boton claro" disabled={!form.es.trim() || traduciendo} onClick={() => void traducir()}>
            <Icono nombre="ensenar" tamano={18} /> {traduciendo ? 'Traduciendo…' : `Traducir al ${nombreEnFrase(config.idiomaDestino)}`}
          </button>
          {aviso && <p className="error">{aviso}</p>}
          <Campo etiqueta={`En ${nombreEnFrase(config.idiomaDestino)}`} ayuda="Revisadla: la traducción automática puede fallar.">
            <input className="entrada" lang={config.idiomaDestino} required value={form.ja} onChange={(e) => cambiar({ ja: e.target.value })} placeholder={japones ? '玉ねぎ抜きでお願いします' : ''} />
          </Campo>
          <Campo etiqueta="Cómo se lee (opcional)">
            <input className="entrada" value={form.romaji} onChange={(e) => cambiar({ romaji: e.target.value })} placeholder={japones ? 'tamanegi nuki de onegai shimasu' : ''} />
          </Campo>
          {form.ja && <BotonEscuchar id="formulario" texto={form.ja} voz={voz} conTexto />}
          <button className="boton shu" disabled={!valida}>
            Guardar
          </button>
          {!nueva && (
            <button
              type="button"
              className="boton peligro"
              onClick={async () => {
                if (!confirmarBorrado(`«${form.es}»`)) return;
                await viaje.guardarFrasesPropias(propias.filter((x) => x.id !== id));
                navegar(`/frases/${form.categoria}`, { replace: true });
              }}
            >
              Borrar frase
            </button>
          )}
        </form>
      </main>
    </>
  );
}
