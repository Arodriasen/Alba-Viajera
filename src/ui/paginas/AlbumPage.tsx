import { useState } from 'react';
import { Link } from 'react-router-dom';

import { fechaCorta, fechaLarga, type Dia } from '@/domain/viaje';

import { useConsulta } from '../AlbaViajera';
import { Cabecera, Cargando } from '../componentes/comunes';
import { useUrlFoto, VisorFoto } from '../componentes/FotoDelDia';

/** Todas las fotos del día, en orden: el álbum del viaje. */
export function AlbumPage() {
  const dias = useConsulta(({ viaje }) => viaje.dias(), []);
  const [abierta, setAbierta] = useState<{ url: string; dia: Dia }>();
  if (!dias) return <Cargando />;
  const conFoto = dias.filter((d) => d.foto);

  return (
    <>
      <Cabecera titulo="Álbum" atras="/viaje" />
      <main className="contenido">
        {conFoto.length === 0 ? (
          <p className="vacio">
            Aún no hay fotos. Cada día tiene su «Foto del día»: hazla o súbela cuando quieras.
          </p>
        ) : (
          <>
            <p className="pequeno secundario" style={{ margin: 0 }}>
              {conFoto.length} de {dias.length} días con foto
            </p>
            <div className="album">
              {conFoto.map((d) => (
                <Miniatura key={d.fecha} dia={d} alAbrir={(url) => setAbierta({ url, dia: d })} />
              ))}
            </div>
          </>
        )}
      </main>
      {abierta && <VisorFoto url={abierta.url} titulo={`${fechaLarga(abierta.dia.fecha)} · ${abierta.dia.titulo}`} alCerrar={() => setAbierta(undefined)} />}
    </>
  );
}

function Miniatura({ dia, alAbrir }: { dia: Dia; alAbrir: (url: string) => void }) {
  const url = useUrlFoto(dia.foto);
  return (
    <figure className="album-foto">
      <button onClick={() => url && alAbrir(url)} aria-label={`Ver la foto del ${fechaLarga(dia.fecha)}`}>
        {url ? <img src={url} alt="" loading="lazy" /> : <span />}
      </button>
      <figcaption>
        <Link to={`/dia/${dia.fecha}`}>
          <span className="negrita">{fechaCorta(dia.fecha)}</span> · {dia.titulo}
        </Link>
      </figcaption>
    </figure>
  );
}
