import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { CONSEJOS_DE_SERIE, TITULO_CONSEJO, type Consejos, type TipoConsejo } from '@/domain/consejos';

import { useAlba } from '../AlbaViajera';
import { Cabecera, Cargando } from '../componentes/comunes';
import { Campo } from '../componentes/formulario';

const esTipo = (t: string | undefined): t is TipoConsejo => t === 'cambioHotel' || t === 'suica';

/** Cambiar los consejos de un tipo (uno por línea). Se guardan para los dos móviles. */
export function EditarConsejosPage() {
  const { tipo } = useParams();
  const { viaje } = useAlba();
  const navegar = useNavigate();
  const [todos, setTodos] = useState<Consejos>();
  const [texto, setTexto] = useState<string>();

  useEffect(() => {
    void viaje.consejos().then((c) => {
      setTodos(c);
      if (esTipo(tipo)) setTexto((t) => t ?? c[tipo].join('\n'));
    });
  }, [viaje, tipo]);

  if (!esTipo(tipo)) return <Navigate to="/hoy" replace />;
  if (!todos || texto === undefined) return <Cargando />;

  const guardar = async (lineas: string[]) => {
    await viaje.guardarConsejos({ ...todos, [tipo]: lineas });
    navegar(-1);
  };

  return (
    <>
      <Cabecera titulo={TITULO_CONSEJO[tipo]} atras />
      <main className="contenido">
        <form
          className="formulario"
          onSubmit={(e) => {
            e.preventDefault();
            void guardar(texto.split('\n').map((l) => l.trim()).filter(Boolean));
          }}
        >
          <Campo etiqueta="Consejos" ayuda="Uno por línea. Si lo dejáis vacío, la tarjeta deja de salir en Hoy.">
            <textarea className="entrada" rows={12} value={texto} onChange={(e) => setTexto(e.target.value)} />
          </Campo>
          <button className="boton shu">Guardar</button>
          <button
            type="button"
            className="boton claro"
            onClick={() => window.confirm('¿Volver a los consejos de serie? Se pierden los cambios de esta lista.') && setTexto(CONSEJOS_DE_SERIE[tipo].join('\n'))}
          >
            Volver a los de serie
          </button>
        </form>
      </main>
    </>
  );
}
