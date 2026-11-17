import { AlmacenMemoria } from '@/infrastructure/local/AlmacenLocal';
import { ViajeLocal } from '@/infrastructure/local/ViajeLocal';
import { ViajesLocal } from '@/infrastructure/local/ViajesLocal';
import { VIAJE_ORIGINAL } from '@/domain/viajes';
import { MotorSync, type ApiSync } from '@/infrastructure/sync/MotorSync';

import { D1DePrueba } from './d1-de-prueba';
import { leerPeticion, sincronizar } from './sincronizacion';

/** Un móvil: copia local + motor de sincronización hablando con el servidor en memoria. */
function movil(db: D1DePrueba) {
  const almacen = new AlmacenMemoria();
  const api: ApiSync = {
    async sincronizar(desde, cambios) {
      const p = leerPeticion(JSON.parse(JSON.stringify({ desde, cambios })));
      return JSON.parse(JSON.stringify(await sincronizar(db, p.desde, p.cambios)));
    },
    subirFoto: async () => undefined,
    borrarFoto: async () => undefined,
  };
  const motor = new MotorSync(almacen, api, () => undefined);
  return { viaje: new ViajeLocal(almacen, VIAJE_ORIGINAL, () => undefined), viajes: new ViajesLocal(almacen, () => undefined), almacen, motor };
}

describe('sincronización entre los dos móviles', () => {
  it('el primer arranque baja todo el viaje', async () => {
    const db = await D1DePrueba.crear();
    const yo = movil(db);
    await yo.motor.sincronizar();

    const dias = await yo.viaje.dias();
    expect(dias).toHaveLength(23);
    expect(dias[0].fecha).toBe('2027-01-11');
    expect((await yo.viaje.dia('2027-01-14'))?.titulo).toBe('Tokyo Disneyland');
    expect((await yo.viaje.alojamientos()).find((a) => a.id === 'aloj-tavinos')?.direccionJa).toContain('浅草');
    expect((await yo.viaje.reservas()).find((r) => r.id === 'res-disneysea')?.venta?.toISOString()).toBe('2026-11-20T05:00:00.000Z');
    expect((await yo.viaje.trayectos()).find((t) => t.id === 'tr-osaka')?.jrPass).toBe(true);
  });

  it('lo que cambia uno le llega al otro, borrados incluidos', async () => {
    const db = await D1DePrueba.crear();
    const yo = movil(db);
    const ella = movil(db);
    await yo.motor.sincronizar();
    await ella.motor.sincronizar();

    const dia = (await yo.viaje.dia('2027-01-27'))!;
    await yo.viaje.guardarDia({ ...dia, plan: [...dia.plan, 'Comprar el Gyuto para el cuñado'] });
    const disney = (await yo.viaje.reservas()).find((r) => r.id === 'res-disneyland')!;
    await yo.viaje.guardarReserva({ ...disney, estado: 'comprada' });
    await yo.viaje.borrarAlojamiento('aloj-parkside');
    expect(await yo.motor.pendientes()).toBe(3);
    await yo.motor.sincronizar();
    expect(await yo.motor.pendientes()).toBe(0);

    await ella.motor.sincronizar();
    expect((await ella.viaje.dia('2027-01-27'))?.plan.at(-1)).toBe('Comprar el Gyuto para el cuñado');
    expect((await ella.viaje.reserva('res-disneyland'))?.estado).toBe('comprada');
    expect(await ella.viaje.alojamiento('aloj-parkside')).toBeUndefined();
  });

  it('si los dos tocan lo mismo sin conexión, gana el último cambio', async () => {
    const db = await D1DePrueba.crear();
    const yo = movil(db);
    const ella = movil(db);
    await yo.motor.sincronizar();
    await ella.motor.sincronizar();

    const dia = (await yo.viaje.dia('2027-01-24'))!;
    await yo.viaje.guardarDia({ ...dia, titulo: 'Castillo (versión de él)' });
    await new Promise((r) => setTimeout(r, 5));
    await ella.viaje.guardarDia({ ...dia, titulo: 'Castillo + Kaiyukan (versión de ella)' });

    await ella.motor.sincronizar();
    await yo.motor.sincronizar();
    await ella.motor.sincronizar();
    expect((await yo.viaje.dia('2027-01-24'))?.titulo).toBe('Castillo + Kaiyukan (versión de ella)');
    expect((await ella.viaje.dia('2027-01-24'))?.titulo).toBe('Castillo + Kaiyukan (versión de ella)');
  });

  it('parques: llegan las atracciones y se comparten la altura de Alba y lo hecho', async () => {
    const db = await D1DePrueba.crear();
    const yo = movil(db);
    const ella = movil(db);
    await yo.motor.sincronizar();
    await ella.motor.sincronizar();

    const atracciones = await yo.viaje.atracciones();
    expect(atracciones.filter((x) => x.parque === 'tdl').length).toBeGreaterThan(20);
    expect(atracciones.find((x) => x.id === 'usj-yoshi')?.alturaMin).toBe(92);
    expect(await yo.viaje.alturaAlba()).toBe(87);

    await yo.viaje.guardarAlturaAlba(89);
    await yo.viaje.guardarAtraccion({ ...(await yo.viaje.atraccion('tdl-pooh'))!, hecha: true });
    await yo.motor.sincronizar();
    await ella.motor.sincronizar();
    expect(await ella.viaje.alturaAlba()).toBe(89);
    expect((await ella.viaje.atraccion('tdl-pooh'))?.hecha).toBe(true);
  });

  it('los ajustes del viaje se comparten, y la migración completa el trayecto al museo', async () => {
    const db = await D1DePrueba.crear();
    const yo = movil(db);
    const ella = movil(db);
    await yo.motor.sincronizar();
    await ella.motor.sincronizar();
    expect((await yo.viaje.trayecto('tr-nintendo-museum'))?.pasos).toContain('Bajar en Ogura (Kintetsu)');

    const c = await yo.viaje.config();
    await yo.viaje.guardarConfig({ ...c, jrPass: { ...c.jrPass, inicio: '2027-01-21' }, ciudades: [...c.ciudades, { nombre: 'Kobe', kanji: '神戸', color: '#3d5a80' }] });
    await yo.motor.sincronizar();
    await ella.motor.sincronizar();
    const suya = await ella.viaje.config();
    expect(suya.jrPass.inicio).toBe('2027-01-21');
    expect(suya.ciudades.at(-1)?.kanji).toBe('神戸');
  });

  it('vaciar un día deja la foto', async () => {
    const db = await D1DePrueba.crear();
    const yo = movil(db);
    await yo.motor.sincronizar();
    await yo.viaje.guardarDia({ ...(await yo.viaje.dia('2027-01-15'))!, foto: 'abcdef12.jpg' });
    await yo.viaje.vaciarDia('2027-01-15');
    const d = await yo.viaje.dia('2027-01-15');
    expect(d?.titulo).toBe('');
    expect(d?.plan).toEqual([]);
    expect(d?.foto).toBe('abcdef12.jpg');
    expect(d?.ciudad).toBe('Tokio');
  });

  it('gastos y presupuesto se comparten', async () => {
    const db = await D1DePrueba.crear();
    const yo = movil(db);
    const ella = movil(db);
    await yo.motor.sincronizar();
    expect((await yo.viaje.gastos()).map((x) => x.id)).toEqual(['gasto-vuelos']);
    const previsto = async (m: ReturnType<typeof movil>, id: string) => (await m.viaje.presupuesto()).categorias.find((c) => c.id === id)?.previsto;
    expect(await previsto(yo, 'comida')).toBe(850);

    await yo.viaje.guardarGasto({ id: 'g1', concepto: 'Ramen', categoria: 'comida', importe: 2400, moneda: 'JPY', euros: 13.6537, fecha: '2027-01-22', taxFree: false });
    const p = await yo.viaje.presupuesto();
    await yo.viaje.guardarPresupuesto({
      categorias: [...p.categorias.map((c) => (c.id === 'comida' ? { ...c, previsto: 900 } : c)), { id: 'c-friki', nombre: 'Compras friki', previsto: 500, icono: 'juegos', color: '#c73e2f' }],
    });
    await yo.motor.sincronizar();
    await ella.motor.sincronizar();
    const ramen = await ella.viaje.gasto('g1');
    expect(ramen?.importe).toBe(2400);
    expect(ramen?.euros).toBe(13.65);
    expect(await previsto(ella, 'comida')).toBe(900);
    expect(await previsto(ella, 'c-friki')).toBe(500);

    await ella.viaje.borrarGasto('g1');
    await ella.motor.sincronizar();
    await yo.motor.sincronizar();
    expect(await yo.viaje.gasto('g1')).toBeUndefined();
  });

  it('se pueden añadir trayectos nuevos', async () => {
    const db = await D1DePrueba.crear();
    const yo = movil(db);
    const ella = movil(db);
    await yo.viaje.guardarTrayecto({ id: 'nuevo-1', fecha: '2027-01-19', titulo: 'Akihabara → Odaiba', pasos: ['JR Yamanote', 'Yurikamome'], orden: 1, destino: 'Odaiba' });
    await yo.motor.sincronizar();
    await ella.motor.sincronizar();
    expect((await ella.viaje.trayecto('nuevo-1'))?.pasos).toEqual(['JR Yamanote', 'Yurikamome']);
  });

  it('un viaje nuevo va aparte del de Japón y se comparte; al borrarlo se borra todo lo suyo', async () => {
    const db = await D1DePrueba.crear();
    const yo = movil(db);
    const ella = movil(db);
    await yo.motor.sincronizar();
    expect((await yo.viajes.lista()).map((v) => v.id)).toEqual([VIAJE_ORIGINAL]);

    const base = await yo.viaje.config();
    const roma = await yo.viajes.crear({ ...base, destino: 'Roma', pais: 'IT', moneda: 'EUR', zona: 'Europe/Rome', inicio: '2027-05-01', fin: '2027-05-05', ciudades: [] });
    const enRoma = new ViajeLocal(yo.almacen, roma, () => undefined);
    await enRoma.guardarDia({ fecha: '2027-05-02', titulo: 'Coliseo', plan: ['Foro'], foto: 'roma.jpg' });
    await enRoma.guardarGasto({ id: 'g-roma', concepto: 'Gelato', categoria: 'comida', importe: 4, moneda: 'EUR', euros: 4, fecha: '2027-05-02', taxFree: false });
    await yo.motor.sincronizar();
    await ella.motor.sincronizar();

    const suyos = await ella.viajes.lista();
    expect(suyos.map((v) => v.config.destino)).toEqual(['Japón', 'Roma']);
    const suyaRoma = new ViajeLocal(ella.almacen, roma, () => undefined);
    expect((await suyaRoma.dias()).map((d) => d.fecha)).toEqual(['2027-05-02']);
    expect((await suyaRoma.gastos()).map((g) => g.concepto)).toEqual(['Gelato']);
    expect((await suyaRoma.presupuesto()).categorias).toHaveLength(9);
    // Japón no ve nada de Roma, ni Roma nada de Japón.
    expect((await ella.viaje.gastos()).map((g) => g.id)).toEqual(['gasto-vuelos']);
    expect(await ella.viaje.dia('2027-05-02')).toBeUndefined();
    expect(await suyaRoma.dia('2027-01-14')).toBeUndefined();

    expect(await ella.viajes.borrar(roma)).toEqual(['roma.jpg']);
    await ella.motor.sincronizar();
    await yo.motor.sincronizar();
    expect((await yo.viajes.lista()).map((v) => v.id)).toEqual([VIAJE_ORIGINAL]);
    expect(await enRoma.gastos()).toEqual([]);
    expect((await yo.viaje.dias()).length).toBe(23);
  });

  it('la altura de Alba es la misma en todos los viajes y no se borra con Japón', async () => {
    const db = await D1DePrueba.crear();
    const yo = movil(db);
    await yo.motor.sincronizar();
    await yo.viaje.guardarAlturaAlba(90);
    const otro = new ViajeLocal(yo.almacen, 'votro', () => undefined);
    expect(await otro.alturaAlba()).toBe(90);
    await yo.viajes.borrar(VIAJE_ORIGINAL);
    await yo.motor.sincronizar();
    expect(await yo.viajes.lista()).toEqual([]);
    expect(await otro.alturaAlba()).toBe(90);
  });

  it('las listas propias de un viaje se comparten y se borran con él', async () => {
    const db = await D1DePrueba.crear();
    const yo = movil(db);
    const ella = movil(db);
    await yo.motor.sincronizar();
    const base = await yo.viaje.config();
    const roma = await yo.viajes.crear({ ...base, destino: 'Roma', pais: 'IT', moneda: 'EUR', listas: [{ id: 'l-equipaje', nombre: 'Equipaje', icono: 'equipaje', color: '#2d4b73' }] });
    const enRoma = new ViajeLocal(yo.almacen, roma, () => undefined);
    await enRoma.guardarElemento({ id: 'e1', lista: 'l-equipaje', nombre: 'Carrito', hecho: false, precioMin: 10, moneda: 'EUR', orden: 0 });
    await yo.motor.sincronizar();
    await ella.motor.sincronizar();
    const suyaRoma = new ViajeLocal(ella.almacen, roma, () => undefined);
    expect((await suyaRoma.config()).listas.map((l) => l.nombre)).toEqual(['Equipaje']);
    const e = (await suyaRoma.elementos('l-equipaje'))[0];
    expect(e).toMatchObject({ nombre: 'Carrito', precioMin: 10, hecho: false });
    await suyaRoma.guardarElemento({ ...e, hecho: true });
    await ella.motor.sincronizar();
    await yo.motor.sincronizar();
    expect((await enRoma.elemento(e.id))?.hecho).toBe(true);
    expect(await yo.viaje.elementos()).toEqual([]); // Japón no las ve

    await yo.viajes.borrar(roma);
    await yo.motor.sincronizar();
    await ella.motor.sincronizar();
    expect(await suyaRoma.elementos()).toEqual([]);
  });
});
