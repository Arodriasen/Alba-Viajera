import { Link } from 'react-router-dom';

import { fechaLarga, type Dia } from '@/domain/viaje';
import type { EntradaDiario } from '@/domain/diario';

import { useConsulta } from '../AlbaViajera';
import { Cabecera, Cargando } from '../componentes/comunes';
import { useUrlFoto } from '../componentes/FotoDelDia';
import { Icono } from '../componentes/Icono';

/** El diario entero, día a día, con la foto de cada día: para leerlo (se escribe en cada día). */
export function DiarioPage() {
  const datos = useConsulta(async ({ viaje }) => ({ diario: await viaje.diarios(), dias: await viaje.dias() }), []);
  if (!datos) return <Cargando />;
  const porFecha = new Map(datos.dias.map((d) => [d.fecha, d]));

  return (
    <>
      <Cabecera titulo="Diario" atras />
      <main className="contenido">
        {datos.diario.length === 0 ? (
          <p className="vacio">Aún no hay nada escrito. Cada día, el de hoy y los pasados, tiene su «Diario».</p>
        ) : (
          datos.diario.map((e) => <EntradaDia key={e.fecha} entrada={e} dia={porFecha.get(e.fecha)} />)
        )}
      </main>
    </>
  );
}

function EntradaDia({ entrada, dia }: { entrada: EntradaDiario; dia?: Dia }) {
  const url = useUrlFoto(dia?.foto);
  return (
    <article className="tarjeta diario-dia">
      <Link to={`/dia/${entrada.fecha}`} className="etiqueta" style={{ textDecoration: 'none' }}>
        {fechaLarga(entrada.fecha)}
        {dia?.titulo ? ` · ${dia.titulo}` : ''}
      </Link>
      {url && <img className="foto-diario" src={url} alt="" loading="lazy" />}
      <p className="pre" style={{ margin: 0 }}>
        {entrada.texto}
      </p>
    </article>
  );
}

/** Enlace al diario, solo si hay algo escrito. */
export function EnlaceDiario({ className = 'accion-texto', texto = 'Diario' }: { className?: string; texto?: string }) {
  const n = useConsulta(async ({ viaje }) => (await viaje.diarios()).length, []);
  if (!n) return null;
  return (
    <Link to="/diario" className={className}>
      <Icono nombre="diario" tamano={className.includes('boton') ? 18 : 16} /> {texto}
    </Link>
  );
}
