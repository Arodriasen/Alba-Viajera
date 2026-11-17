import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';

import { euros, eurosExactos, yenes } from '@/domain/gastos';
import { COMISION_EFECTIVO, RECORDATORIOS_TAX_FREE, PASOS_AEROPUERTO, PLAZO_DIAS, resumenTaxFree } from '@/domain/taxfree';
import { fechaCorta, fechaLarga } from '@/domain/viaje';

import { useAlba, useConsulta } from '../AlbaViajera';
import { BotonAnadir, Cabecera, Cargando } from '../componentes/comunes';
import { Icono } from '../componentes/Icono';

export function TaxFreePage() {
  const { config } = useAlba();
  const datos = useConsulta(async ({ viaje }) => ({ gastos: await viaje.gastos() }), []);
  if (!datos) return <Cargando />;
  const r = resumenTaxFree(datos.gastos, config.vueltaFecha);

  return (
    <>
      <Cabecera titulo="Tax Free" atras />
      <main className="contenido">
        <div className="resumen-gastos taxfree">
          <p className="etiqueta">Recuperaríamos unos</p>
          <p className="total">
            {euros(r.devolucionEuros)}
            {r.devolucionYenes > 0 && <span> ({yenes(r.devolucionYenes)})</span>}
          </p>
          <div className="resumen-pie">
            <span>
              {r.compras.length} {r.compras.length === 1 ? 'compra' : 'compras'} · {euros(r.totalEuros)}
            </span>
            <span>En efectivo: ~{euros(r.devolucionEuros * (1 - COMISION_EFECTIVO))}</span>
          </div>
        </div>
        <p className="muy-pequeno secundario" style={{ margin: '-4px 0 0' }}>
          El 10 % de impuesto que va dentro del precio. Cada tienda puede tener sus condiciones: preguntad al pagar.
        </p>

        <div className="aviso ai">
          <Icono nombre="alerta" tamano={20} />
          <span>
            Trámite el <span className="negrita">{fechaLarga(config.vueltaFecha)}</span> en el aeropuerto, <span className="negrita">antes de facturar</span>.
          </span>
        </div>

        {r.fueraDePlazo.length > 0 && (
          <div className="aviso">
            <Icono nombre="alerta" tamano={20} />
            <span>
              {r.fueraDePlazo.length === 1 ? 'Una compra tendrá' : `${r.fueraDePlazo.length} compras tendrán`} más de {PLAZO_DIAS} días el día del vuelo y no
              contará: {r.fueraDePlazo.map((g) => g.concepto).join(', ')}.
            </span>
          </div>
        )}

        <section className="seccion">
          <p className="etiqueta">Compras con Tax Free</p>
          {r.compras.length > 0 ? (
            <div className="lista">
              {r.compras.map((g) => (
                <Link key={g.id} to={`/gasto/${g.id}`} className="fila">
                  <span className="icono-categoria" style={{ '--c': '#c73e2f' } as CSSProperties}>
                    <Icono nombre="taxFree" tamano={20} />
                  </span>
                  <span className="texto">
                    <span className="negrita recorte">{g.concepto}</span>
                    <span className="muy-pequeno secundario">
                      {fechaCorta(g.fecha)} · {g.moneda === 'JPY' ? yenes(g.importe) : eurosExactos(g.importe)}
                    </span>
                  </span>
                  <span className="negrita">{eurosExactos(g.euros)}</span>
                  <span className="flecha">
                    <Icono nombre="chevron" tamano={18} />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="vacio">Aún no hay compras con Tax Free. Al apuntar un gasto, activad «Compra con Tax Free».</p>
          )}
          <BotonAnadir to="/gasto/nuevo?categoria=compras&taxfree=1" texto="Añadir compra con Tax Free" />
        </section>

        {RECORDATORIOS_TAX_FREE.map((bloque) => (
          <section key={bloque.titulo} className="seccion">
            <p className="etiqueta">{bloque.titulo}</p>
            <ul className="tarjeta recordatorios">
              {bloque.textos.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        ))}

        <section className="seccion">
          <p className="etiqueta">Paso a paso en el aeropuerto</p>
          <ol className="pasos-numerados">
            {PASOS_AEROPUERTO.map((p, i) => (
              <li key={p.titulo}>
                <span className="numero">{i + 1}</span>
                <span>
                  <span className="negrita" style={{ display: 'block' }}>
                    {p.titulo}
                  </span>
                  <span className="pequeno secundario">{p.texto}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </>
  );
}

/** Acceso a Tax Free (en Presupuesto y en Hoy el día de la vuelta). */
export function TarjetaTaxFree({ destacada = false }: { destacada?: boolean }) {
  const { config } = useAlba();
  const gastos = useConsulta(({ viaje }) => viaje.gastos(), []);
  const r = gastos ? resumenTaxFree(gastos, config.vueltaFecha) : undefined;
  return (
    <Link to="/taxfree" className={`tarjeta enlace fila-tarjeta ${destacada ? 'destacada' : ''}`}>
      <span className="icono-redondo">
        <Icono nombre="taxFree" tamano={20} />
      </span>
      <span className="texto">
        <span className="negrita">{destacada ? 'Hoy: Tax Free antes de facturar' : 'Tax Free'}</span>
        <span className="pequeno secundario">
          {r && r.compras.length > 0
            ? `${r.compras.length} ${r.compras.length === 1 ? 'compra' : 'compras'} · recuperaríamos ~${euros(r.devolucionEuros)}`
            : 'Recordatorios y paso a paso del aeropuerto'}
        </span>
      </span>
      <Icono nombre="chevron" tamano={20} />
    </Link>
  );
}
