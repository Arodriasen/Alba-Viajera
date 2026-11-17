import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { tiene } from '@/domain/config';
import { aEuros, deEuros, enMoneda, eurosExactos, importesRapidos, simboloMoneda } from '@/domain/gastos';
import { impuestoIncluido } from '@/domain/taxfree';
import { fechaCorta } from '@/domain/viaje';

import { useAlba } from '../AlbaViajera';
import { Cabecera } from '../componentes/comunes';
import { Icono } from '../componentes/Icono';
import { useCambio } from './GastosPage';

const numero = (t: string) => {
  const n = Number(t.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};
const textoNumero = (n: number | undefined) => (n === undefined ? '' : String(Math.round(n * 10_000) / 10_000).replace('.', ','));

/** Hacia dónde se convierte, recordado en este móvil (solo es una comodidad). */
const CLAVE_SENTIDO = 'conversor-desde-euros';
function sentidoGuardado(): boolean {
  try {
    return localStorage.getItem(CLAVE_SENTIDO) === '1';
  } catch {
    return false;
  }
}

/** Conversor rápido entre la moneda del viaje y el euro, para mirar un precio sin apuntar nada. */
export function ConversorPage() {
  const { config } = useAlba();
  const moneda = config.moneda;
  const cambioAuto = useCambio(moneda);
  const [desdeEuros, setDesdeEuros] = useState(sentidoGuardado);
  const [importe, setImporte] = useState('');
  /**
   * 1 € = N (moneda) escrito a mano; sin él se usa el del día, que va siguiendo al que llegue (primero el
   * guardado en el móvil y, en cuanto responde la API, el último publicado).
   */
  const [cambioAMano, setCambioAMano] = useState<string>();
  const cambio = cambioAMano ?? (cambioAuto ? textoNumero(cambioAuto.porEuro) : '');

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_SENTIDO, desdeEuros ? '1' : '0');
    } catch {
      // Sin almacenamiento: no pasa nada.
    }
  }, [desdeEuros]);

  if (moneda === 'EUR') return <Navigate to="/gastos" replace />;

  const porEuro = numero(cambio);
  const hayCambio = Number.isFinite(porEuro) && porEuro > 0;
  const n = numero(importe);
  const hayImporte = Number.isFinite(n) && n > 0;
  const origen = desdeEuros ? 'EUR' : moneda;
  const destino = desdeEuros ? moneda : 'EUR';
  const enLocal = hayImporte && hayCambio ? (desdeEuros ? deEuros(n, moneda, porEuro) : n) : NaN;
  const enEur = hayImporte && hayCambio ? (desdeEuros ? n : aEuros(n, moneda, porEuro)) : NaN;
  const resultado = desdeEuros ? enLocal : enEur;
  const rapidos = importesRapidos(origen, hayCambio ? porEuro : undefined);
  const manual = cambioAMano !== undefined;
  const enLocalRedondo = Number.isFinite(enLocal) ? Math.round(enLocal * 100) / 100 : NaN;

  const girar = () => {
    // El resultado pasa a ser lo escrito, así se puede seguir desde ahí.
    if (Number.isFinite(resultado)) setImporte(textoNumero(Math.round(resultado * 100) / 100));
    setDesdeEuros(!desdeEuros);
  };

  return (
    <>
      <Cabecera titulo="Conversor" atras />
      <main className="contenido">
        <div className="tarjeta importe-grande conversor">
          <div className="fila-importe">
            <span className="simbolo">{simboloMoneda(origen)}</span>
            <input
              className="importe"
              inputMode="decimal"
              placeholder="0"
              aria-label={`Importe en ${origen}`}
              size={Math.max(1, importe.length || 1)}
              autoFocus
              value={importe}
              onChange={(e) => setImporte(e.target.value.replace(/[^\d.,]/g, ''))}
            />
          </div>
          <button type="button" className="accion-foto girar" aria-label={`Cambiar a ${destino} → ${origen}`} onClick={girar}>
            <Icono nombre="intercambiar" tamano={22} />
          </button>
          <p className="resultado-conversion" aria-live="polite">
            {Number.isFinite(resultado) ? (destino === 'EUR' ? eurosExactos(resultado) : enMoneda(resultado, destino)) : `${simboloMoneda(destino)} —`}
          </p>
          {rapidos.length > 0 && (
            <div className="opciones centradas">
              {rapidos.map((r) => (
                <button key={r} type="button" className="opcion" onClick={() => setImporte(textoNumero(r))}>
                  {origen === 'EUR' ? eurosExactos(r).replace(',00', '') : enMoneda(r, origen)}
                </button>
              ))}
            </div>
          )}
        </div>

        {tiene(config, 'taxfree') && Number.isFinite(enLocal) && (
          <div className="tarjeta fila-tarjeta">
            <span className="icono-redondo">
              <Icono nombre="taxFree" tamano={20} />
            </span>
            <span className="texto">
              <span className="negrita">Si es Tax Free</span>
              <span className="pequeno secundario">
                Te devolverían {enMoneda(impuestoIncluido(enLocal), moneda)} (≈ {eurosExactos(impuestoIncluido(enEur))}) en el aeropuerto: se paga{' '}
                {enMoneda(enLocal - impuestoIncluido(enLocal), moneda)} sin el impuesto.
              </span>
            </span>
          </div>
        )}

        <p className="muy-pequeno secundario centrado" style={{ margin: 0 }}>
          1 € ={' '}
          <input
            className="cambio"
            inputMode="decimal"
            aria-label={`${moneda} por euro`}
            placeholder="?"
            value={cambio}
            onChange={(e) => setCambioAMano(e.target.value.replace(/[^\d.,]/g, ''))}
          />{' '}
          {simboloMoneda(moneda)}
          {' · '}
          {!cambioAuto
            ? 'sin cambio automático: escríbelo'
            : manual
              ? 'escrito a mano'
              : `${cambioAuto.guardado ? 'el guardado (sin conexión)' : 'el último publicado'}, del ${fechaCorta(cambioAuto.fecha)}`}
          {manual && cambioAuto && (
            <>
              {' · '}
              <button type="button" className="enlace-boton" onClick={() => setCambioAMano(undefined)}>
                usar el del día
              </button>
            </>
          )}
        </p>

        {tiene(config, 'presupuesto') && (
          <Link
            to={`/gasto/nuevo?${new URLSearchParams(Number.isFinite(enLocalRedondo) ? { importe: String(enLocalRedondo), moneda } : { moneda })}`}
            className="boton claro"
          >
            <Icono nombre="mas" tamano={18} /> Apuntarlo como gasto
          </Link>
        )}
      </main>
    </>
  );
}
