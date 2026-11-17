/**
 * Tax Free con el sistema nuevo (desde el 1 nov 2026): se paga con impuestos y se devuelven en el
 * aeropuerto tras pasar por las máquinas de Aduanas. Sacado de "Guia Tax Free Japon.docx".
 */

import type { Fecha } from './config';
import type { Gasto } from './gastos';
import { diasEntre } from './viaje';

/** Impuesto de consumo general en Japón: 10 % (va incluido en el precio). */
export const IVA_JAPON = 0.1;
/** Plazo para pasar por Aduanas desde la compra. */
export const PLAZO_DIAS = 90;
/** Lo que se queda CASH JAPAN si se cobra en efectivo en el aeropuerto (ejemplo de la guía: ~10 %). */
export const COMISION_EFECTIVO = 0.1;

/** El impuesto que lleva dentro un precio con impuestos incluidos. */
export const impuestoIncluido = (precio: number) => (precio * IVA_JAPON) / (1 + IVA_JAPON);

export interface ResumenTaxFree {
  compras: Gasto[];
  /** Suma de las compras en euros. */
  totalEuros: number;
  /** Impuesto que se recuperaría, en euros (antes de comisiones). */
  devolucionEuros: number;
  /** Lo mismo, en yenes, solo de las compras apuntadas en yenes. */
  devolucionYenes: number;
  /** Compras que pasarán de los 90 días el día del vuelo de vuelta (no cuentan). */
  fueraDePlazo: Gasto[];
}

export function resumenTaxFree(gastos: Gasto[], vuelo: Fecha): ResumenTaxFree {
  const compras = gastos.filter((g) => g.taxFree).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.concepto.localeCompare(b.concepto));
  const totalEuros = compras.reduce((s, g) => s + g.euros, 0);
  return {
    compras,
    totalEuros,
    devolucionEuros: impuestoIncluido(totalEuros),
    devolucionYenes: impuestoIncluido(compras.filter((g) => g.moneda === 'JPY').reduce((s, g) => s + g.importe, 0)),
    fueraDePlazo: compras.filter((g) => diasEntre(g.fecha, vuelo) > PLAZO_DIAS),
  };
}

/** Recordatorios: lo que conviene tener presente (no es una lista para marcar). */
export const RECORDATORIOS_TAX_FREE: { titulo: string; textos: string[] }[] = [
  {
    titulo: 'En las tiendas',
    textos: [
      'Comprar en tiendas Tax Free y enseñar el pasaporte al pagar.',
      'Preguntar cómo devuelven el dinero y registrarlo (tarjeta, efectivo en el aeropuerto…).',
      'Guardar los tickets por si acaso.',
    ],
  },
  {
    titulo: 'El día del vuelo',
    textos: [
      'Ninguna compra puede tener más de 90 días.',
      'Llevar las compras a mano o en la maleta aún sin facturar.',
      'Llegar con tiempo de sobra por si toca inspección.',
      'Pasar por la máquina de Aduanas ANTES de facturar y antes del control de seguridad.',
      'Revisar que nacionalidad y pasaporte salen bien en la pantalla verde.',
      'En efectivo: contar con la comisión y el redondeo a 50 ¥.',
    ],
  },
];

/** El paso a paso en el aeropuerto. */
export const PASOS_AEROPUERTO: { titulo: string; texto: string }[] = [
  { titulo: 'Busca las máquinas de Aduanas', texto: 'Antes de facturar, sigue los carteles TAX REFUND.' },
  { titulo: 'START y escanea el pasaporte', texto: 'La máquina busca las compras que las tiendas han comunicado. Si una no aparece, no entra en la devolución.' },
  {
    titulo: 'Mira el resultado',
    texto: 'Verde («Completed and Approved»): terminado. Rojo: ve a la zona de inspección de Aduanas y enseña lo que te pidan.',
  },
  {
    titulo: 'Cobra la devolución',
    texto: 'Llega por el método que registraste en la tienda. En efectivo: carteles «Cash Refund», junto a Currency Exchange (CASH JAPAN cobra comisión y redondea a 50 ¥).',
  },
];
