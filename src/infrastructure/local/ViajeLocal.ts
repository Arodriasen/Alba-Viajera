import { leerConfig, type ConfigViaje } from '@/domain/config';
import { leerFrasesPropias, leerTraduccion, type Frase, type TraduccionSerie } from '@/domain/frases';
import type { Elemento } from '@/domain/listas';
import { leerPresupuesto, type Gasto, type Presupuesto } from '@/domain/gastos';
import { ALTURA_ALBA_POR_DEFECTO, type Atraccion, type IdParque, type TipoAtraccion } from '@/domain/parques';
import type { ViajeRepositorio } from '@/domain/ViajeRepositorio';
import type { Alojamiento, Dia, EstadoAlojamiento, EstadoReserva, Reserva, Trayecto } from '@/domain/viaje';
import { esDelViaje, idEn, sinViaje, type ViajeId } from '@/domain/viajes';

import type { AlmacenLocal, FilaLocal, Tabla, Valor } from './AlmacenLocal';

const str = (v: Valor | undefined) => (typeof v === 'string' && v.trim() ? v : undefined);
const lineas = (v: Valor | undefined) =>
  (str(v) ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
const nulo = (v: string | undefined) => (v?.trim() ? v.trim() : null);
const unir = (l: string[]) => nulo(l.map((x) => x.trim()).filter(Boolean).join('\n'));

function aDia(f: FilaLocal): Dia {
  return { fecha: sinViaje(f.id), titulo: String(f.titulo ?? ''), ciudad: str(f.ciudad), plan: lineas(f.plan), notas: str(f.notas), foto: str(f.foto) };
}

function aAlojamiento(f: FilaLocal): Alojamiento {
  return {
    id: f.id,
    nombre: String(f.nombre),
    ciudad: str(f.ciudad),
    entrada: str(f.entrada),
    salida: str(f.salida),
    direccion: str(f.direccion),
    direccionJa: str(f.direccion_ja),
    checkin: str(f.checkin),
    checkout: str(f.checkout),
    estado: (str(f.estado) ?? 'pendiente') as EstadoAlojamiento,
    notas: str(f.notas),
    enlace: str(f.enlace),
  };
}

function aReserva(f: FilaLocal): Reserva {
  return {
    id: f.id,
    titulo: String(f.titulo),
    fechaUso: str(f.fecha_uso),
    horaUso: str(f.hora_uso),
    venta: str(f.venta) ? new Date(String(f.venta)) : undefined,
    estado: (str(f.estado) ?? 'pendiente') as EstadoReserva,
    enlace: str(f.enlace),
    notas: str(f.notas),
  };
}

function aAtraccion(f: FilaLocal): Atraccion {
  return {
    id: f.id,
    parque: String(f.parque) as IdParque,
    nombre: String(f.nombre),
    zona: str(f.zona),
    tipo: (str(f.tipo) ?? 'atraccion') as TipoAtraccion,
    alturaMin: typeof f.altura_min === 'number' ? f.altura_min : undefined,
    cerrada: f.cerrada === 1,
    imprescindible: f.imprescindible === 1,
    unica: f.unica === 1,
    notas: str(f.notas),
    hecha: f.hecha === 1,
    orden: typeof f.orden === 'number' ? f.orden : 0,
  };
}

function aGasto(f: FilaLocal): Gasto {
  return {
    id: f.id,
    concepto: String(f.concepto),
    categoria: str(f.categoria) ?? 'otros',
    importe: Number(f.importe) || 0,
    moneda: str(f.moneda) ?? 'EUR',
    euros: Number(f.euros) || 0,
    fecha: String(f.fecha),
    taxFree: f.tax_free === 1,
    notas: str(f.notas),
  };
}

const num = (v: Valor | undefined) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

function aElemento(f: FilaLocal): Elemento {
  return {
    id: f.id,
    lista: String(f.lista ?? ''),
    nombre: String(f.nombre ?? ''),
    hecho: f.hecho === 1,
    notas: str(f.notas),
    precioMin: num(f.precio_min),
    precioMax: num(f.precio_max),
    moneda: str(f.moneda),
    tienda: str(f.tienda),
    ciudad: str(f.ciudad),
    gasto: str(f.gasto),
    orden: typeof f.orden === 'number' ? f.orden : 0,
  };
}

function aTrayecto(f: FilaLocal): Trayecto {
  return {
    id: f.id,
    fecha: String(f.fecha),
    hora: str(f.hora),
    titulo: String(f.titulo),
    origen: str(f.origen),
    destino: str(f.destino),
    pasos: lineas(f.pasos),
    duracion: str(f.duracion),
    jrPass: f.jr_pass === 1 ? true : f.jr_pass === 0 ? false : undefined,
    notas: str(f.notas),
    orden: typeof f.orden === 'number' ? f.orden : 0,
  };
}

/**
 * Escribe una fila en la copia local, pendiente de subir. Su `actualizado` siempre avanza (aunque el
 * reloj vaya hacia atrás) para ganar a la versión anterior.
 */
export async function escribirFila(almacen: AlmacenLocal, tabla: Tabla, fila: { id: string; [c: string]: Valor }, borrado: 0 | 1 = 0): Promise<void> {
  const antes = await almacen.obtener(tabla, fila.id);
  const actualizado = Math.max(Date.now(), (antes?.actualizado ?? 0) + 1);
  await almacen.poner(tabla, [{ ...(borrado ? antes : {}), ...fila, actualizado, borrado, pendiente: 1 } as FilaLocal]);
}

/**
 * Lee y escribe en la copia local los datos de UN viaje (ver src/domain/viajes.ts: el viaje va en el id). Cada escritura marca la fila como pendiente de subir y su
 * `actualizado` siempre avanza (aunque el reloj vaya hacia atrás) para ganar a la versión anterior.
 */
export class ViajeLocal implements ViajeRepositorio {
  constructor(
    private readonly almacen: AlmacenLocal,
    readonly id: ViajeId,
    private readonly alCambiar: () => void,
  ) {}

  private async vivas(tabla: Tabla): Promise<FilaLocal[]> {
    return (await this.almacen.todas(tabla)).filter((f) => !f.borrado && esDelViaje(f.id, this.id));
  }

  private async viva(tabla: Tabla, id: string): Promise<FilaLocal | undefined> {
    const f = await this.almacen.obtener(tabla, idEn(this.id, id));
    return f && !f.borrado ? f : undefined;
  }

  /** Todas las escrituras pasan por aquí: el id se guarda siempre con el viaje. */
  private async escribir(tabla: Tabla, fila: { id: string; [c: string]: Valor }, borrado: 0 | 1 = 0): Promise<void> {
    await escribirFila(this.almacen, tabla, { ...fila, id: idEn(this.id, fila.id) }, borrado);
    this.alCambiar();
  }

  private borrar(tabla: Tabla, id: string) {
    return this.escribir(tabla, { id }, 1);
  }

  async dias() {
    return (await this.vivas('dias')).map(aDia).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }
  async dia(fecha: string) {
    const f = await this.viva('dias', fecha);
    return f && aDia(f);
  }
  guardarDia(d: Dia) {
    return this.escribir('dias', {
      id: d.fecha,
      titulo: d.titulo.trim(),
      ciudad: nulo(d.ciudad),
      plan: unir(d.plan),
      notas: nulo(d.notas),
      foto: d.foto ?? null,
    });
  }

  async alojamientos() {
    return (await this.vivas('alojamientos')).map(aAlojamiento);
  }
  async alojamiento(id: string) {
    const f = await this.viva('alojamientos', id);
    return f && aAlojamiento(f);
  }
  guardarAlojamiento(a: Alojamiento) {
    return this.escribir('alojamientos', {
      id: a.id,
      nombre: a.nombre.trim(),
      ciudad: nulo(a.ciudad),
      entrada: a.entrada ?? null,
      salida: a.salida ?? null,
      direccion: nulo(a.direccion),
      direccion_ja: nulo(a.direccionJa),
      checkin: a.checkin ?? null,
      checkout: a.checkout ?? null,
      estado: a.estado,
      notas: nulo(a.notas),
      enlace: nulo(a.enlace),
    });
  }
  borrarAlojamiento(id: string) {
    return this.borrar('alojamientos', id);
  }

  async reservas() {
    return (await this.vivas('reservas')).map(aReserva);
  }
  async reserva(id: string) {
    const f = await this.viva('reservas', id);
    return f && aReserva(f);
  }
  guardarReserva(r: Reserva) {
    return this.escribir('reservas', {
      id: r.id,
      titulo: r.titulo.trim(),
      fecha_uso: r.fechaUso ?? null,
      hora_uso: r.horaUso ?? null,
      venta: r.venta ? r.venta.toISOString() : null,
      estado: r.estado,
      enlace: nulo(r.enlace),
      notas: nulo(r.notas),
    });
  }
  borrarReserva(id: string) {
    return this.borrar('reservas', id);
  }

  async atracciones() {
    return (await this.vivas('atracciones')).map(aAtraccion);
  }
  async atraccion(id: string) {
    const f = await this.viva('atracciones', id);
    return f && aAtraccion(f);
  }
  guardarAtraccion(a: Atraccion) {
    return this.escribir('atracciones', {
      id: a.id,
      parque: a.parque,
      nombre: a.nombre.trim(),
      zona: nulo(a.zona),
      tipo: a.tipo,
      altura_min: a.alturaMin ?? null,
      cerrada: a.cerrada ? 1 : 0,
      imprescindible: a.imprescindible ? 1 : 0,
      unica: a.unica ? 1 : 0,
      notas: nulo(a.notas),
      hecha: a.hecha ? 1 : 0,
      orden: a.orden,
    });
  }
  borrarAtraccion(id: string) {
    return this.borrar('atracciones', id);
  }

  async alturaAlba() {
    const f = await this.almacen.obtener('ajustes', 'alba');
    try {
      const v = JSON.parse(String(f?.valor ?? '{}')) as { altura?: unknown };
      return typeof v.altura === 'number' ? v.altura : ALTURA_ALBA_POR_DEFECTO;
    } catch {
      return ALTURA_ALBA_POR_DEFECTO;
    }
  }
  async guardarAlturaAlba(cm: number) {
    await escribirFila(this.almacen, 'ajustes', { id: 'alba', valor: JSON.stringify({ altura: Math.round(cm) }) });
    this.alCambiar();
  }

  async config() {
    const f = await this.viva('ajustes', 'viaje');
    return leerConfig(typeof f?.valor === 'string' ? f.valor : undefined);
  }
  guardarConfig(c: ConfigViaje) {
    return this.escribir('ajustes', { id: 'viaje', valor: JSON.stringify(c) });
  }
  async vaciarDia(fecha: string) {
    const d = await this.dia(fecha);
    if (d) await this.guardarDia({ ...d, titulo: '', ciudad: d.ciudad, plan: [], notas: undefined });
  }

  async gastos() {
    return (await this.vivas('gastos')).map(aGasto);
  }
  async gasto(id: string) {
    const f = await this.viva('gastos', id);
    return f && aGasto(f);
  }
  guardarGasto(g: Gasto) {
    return this.escribir('gastos', {
      id: g.id,
      concepto: g.concepto.trim(),
      categoria: g.categoria,
      importe: g.importe,
      moneda: g.moneda,
      euros: Math.round(g.euros * 100) / 100,
      fecha: g.fecha,
      tax_free: g.taxFree ? 1 : 0,
      notas: nulo(g.notas),
    });
  }
  borrarGasto(id: string) {
    return this.borrar('gastos', id);
  }
  async presupuesto() {
    const f = await this.viva('ajustes', 'presupuesto');
    return leerPresupuesto(typeof f?.valor === 'string' ? f.valor : undefined);
  }
  async frasesPropias() {
    const f = await this.viva('ajustes', 'frases');
    return leerFrasesPropias(typeof f?.valor === 'string' ? f.valor : undefined);
  }
  guardarFrasesPropias(frases: Frase[]) {
    return this.escribir('ajustes', {
      id: 'frases',
      valor: JSON.stringify(frases.map(({ id, categoria, es, ja, romaji }) => ({ id, categoria, es: es.trim(), ja: ja.trim(), romaji: romaji.trim() }))),
    });
  }
  async traduccionFrases() {
    const f = await this.viva('ajustes', 'frases-serie');
    return leerTraduccion(typeof f?.valor === 'string' ? f.valor : undefined);
  }
  guardarTraduccionFrases(t: TraduccionSerie) {
    return this.escribir('ajustes', { id: 'frases-serie', valor: JSON.stringify(t) });
  }
  guardarPresupuesto(p: Presupuesto) {
    return this.escribir('ajustes', { id: 'presupuesto', valor: JSON.stringify(p) });
  }

  async elementos(lista?: string) {
    return (await this.vivas('elementos')).map(aElemento).filter((e) => lista === undefined || e.lista === lista);
  }
  async elemento(id: string) {
    const f = await this.viva('elementos', id);
    return f && aElemento(f);
  }
  guardarElemento(e: Elemento) {
    return this.escribir('elementos', {
      id: e.id,
      lista: e.lista,
      nombre: e.nombre.trim(),
      hecho: e.hecho ? 1 : 0,
      notas: nulo(e.notas),
      precio_min: e.precioMin ?? null,
      precio_max: e.precioMax ?? null,
      moneda: e.moneda ?? null,
      tienda: nulo(e.tienda),
      ciudad: nulo(e.ciudad),
      gasto: e.gasto ?? null,
      orden: e.orden,
    });
  }
  borrarElemento(id: string) {
    return this.borrar('elementos', id);
  }

  async trayectos() {
    return (await this.vivas('trayectos')).map(aTrayecto);
  }
  async trayecto(id: string) {
    const f = await this.viva('trayectos', id);
    return f && aTrayecto(f);
  }
  guardarTrayecto(t: Trayecto) {
    return this.escribir('trayectos', {
      id: t.id,
      fecha: t.fecha,
      hora: t.hora ?? null,
      titulo: t.titulo.trim(),
      origen: nulo(t.origen),
      destino: nulo(t.destino),
      pasos: unir(t.pasos),
      duracion: nulo(t.duracion),
      jr_pass: t.jrPass === undefined ? null : t.jrPass ? 1 : 0,
      notas: nulo(t.notas),
      orden: t.orden,
    });
  }
  borrarTrayecto(id: string) {
    return this.borrar('trayectos', id);
  }
}
