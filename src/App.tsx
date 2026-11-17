import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { useAlba, useTitulo } from './ui/AlbaViajera';
import { Cargando } from './ui/componentes/comunes';
import { Icono, type NombreIcono } from './ui/componentes/Icono';
import { EditarElementoPage, ListaPage } from './ui/paginas/ListasPage';
import { NuevoViajePage, ViajesPage } from './ui/paginas/ViajesPage';
import { AjustesPage } from './ui/paginas/AjustesPage';
import { AlbumPage } from './ui/paginas/AlbumPage';
import { AlojamientoPage, AlojamientosPage, EditarAlojamientoPage } from './ui/paginas/AlojamientosPage';
import { ConversorPage } from './ui/paginas/ConversorPage';
import { EditarConsejosPage } from './ui/paginas/ConsejosPage';
import { EditarGastoPage, EditarPresupuestoPage, GastosPage } from './ui/paginas/GastosPage';
import { HoyPage } from './ui/paginas/HoyPage';
import { MasPage } from './ui/paginas/MasPage';
import { TaxFreePage } from './ui/paginas/TaxFreePage';
import { TiempoPage } from './ui/paginas/TiempoPage';
import { EditarFrasePage, FrasesPage } from './ui/paginas/FrasesPage';
import { AvisosPage } from './ui/paginas/AvisosPage';
import { EditarAtraccionPage, ParquePage } from './ui/paginas/ParquesPage';
import { EditarReservaPage, ReservasPage } from './ui/paginas/ReservasPage';
import { EditarTrayectoPage } from './ui/paginas/TrayectoPage';
import { DiaPage, EditarDiaPage, ViajePage } from './ui/paginas/ViajePage';

const PESTANAS: { ruta: string; texto: string; icono: NombreIcono }[] = [
  { ruta: '/hoy', texto: 'Hoy', icono: 'sol' },
  { ruta: '/viaje', texto: 'Viaje', icono: 'calendario' },
  { ruta: '/hotel', texto: 'Hotel', icono: 'cama' },
  { ruta: '/mas', texto: 'Más', icono: 'mas_opciones' },
];

/** Pantallas a las que se llega desde "Más" (con ellas abiertas, "Más" sale marcada). */
const DE_MAS = ['/mas', '/reserva', '/gasto', '/presupuesto', '/taxfree', '/parque', '/atraccion', '/album', '/ajustes', '/tiempo', '/avisos', '/frase', '/lista', '/elemento'];
/** La barra se ve en las pantallas principales (no en los formularios). */
const conPestanas = (ruta: string) =>
  ['/hoy', '/viaje', '/hotel', '/mas', '/reservas', '/gastos', '/taxfree', '/album', '/tiempo', '/avisos'].includes(ruta) || /^\/dia\/[\d-]+$/.test(ruta) || /^\/parque\/\w+$/.test(ruta) || /^\/frases\/\w+$/.test(ruta) || /^\/lista\/[\w-]+$/.test(ruta);
const activa = (p: string, ruta: string) =>
  p === '/hoy' ? ruta === '/hoy' : p === '/viaje' ? ruta === '/viaje' || ruta.startsWith('/dia/') : p === '/hotel' ? ruta.startsWith('/hotel') || ruta.startsWith('/alojamiento') : DE_MAS.some((d) => ruta.startsWith(d));

/** Fuera de un viaje: la lista y el alta. */
const FUERA = ['/', '/nuevo-viaje'];

export default function App() {
  const { pathname } = useLocation();
  const { listaViajes, viajeId } = useAlba();
  const dentro = !FUERA.includes(pathname);
  useTitulo(dentro);
  if (dentro && !listaViajes) return <Cargando />;
  // El viaje abierto ya no existe (borrado aquí o en el otro móvil): a la lista.
  if (dentro && !listaViajes!.some((v) => v.id === viajeId)) return <Navigate to="/" replace />;
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<ViajesPage />} />
        <Route path="/nuevo-viaje" element={<NuevoViajePage />} />
        <Route path="/hoy" element={<HoyPage />} />
        <Route path="/lista/:id" element={<ListaPage />} />
        <Route path="/lista/:lista/nuevo" element={<EditarElementoPage />} />
        <Route path="/elemento/:id" element={<EditarElementoPage />} />
        <Route path="/viaje" element={<ViajePage />} />
        <Route path="/album" element={<AlbumPage />} />
        <Route path="/ajustes" element={<AjustesPage />} />
        <Route path="/gastos" element={<GastosPage />} />
        <Route path="/presupuesto" element={<EditarPresupuestoPage />} />
        <Route path="/gasto/nuevo" element={<EditarGastoPage />} />
        <Route path="/gasto/:id" element={<EditarGastoPage />} />
        <Route path="/taxfree" element={<TaxFreePage />} />
        <Route path="/conversor" element={<ConversorPage />} />
        <Route path="/consejos/:tipo" element={<EditarConsejosPage />} />
        <Route path="/tiempo" element={<TiempoPage />} />
        <Route path="/avisos" element={<AvisosPage />} />
        <Route path="/frases/:categoria" element={<FrasesPage />} />
        <Route path="/frase/nueva" element={<EditarFrasePage />} />
        <Route path="/frase/:id" element={<EditarFrasePage />} />
        <Route path="/parque/:id" element={<ParquePage />} />
        <Route path="/atraccion/nueva" element={<EditarAtraccionPage />} />
        <Route path="/atraccion/:id" element={<EditarAtraccionPage />} />
        <Route path="/dia/:fecha" element={<DiaPage />} />
        <Route path="/dia/:fecha/editar" element={<EditarDiaPage />} />
        <Route path="/trayecto/nuevo" element={<EditarTrayectoPage />} />
        <Route path="/trayecto/:id" element={<EditarTrayectoPage />} />
        <Route path="/hotel" element={<AlojamientosPage />} />
        <Route path="/dormir" element={<Navigate to="/hotel" replace />} />
        <Route path="/mas" element={<MasPage />} />
        <Route path="/alojamiento/nuevo" element={<EditarAlojamientoPage />} />
        <Route path="/alojamiento/:id" element={<AlojamientoPage />} />
        <Route path="/alojamiento/:id/editar" element={<EditarAlojamientoPage />} />
        <Route path="/reservas" element={<ReservasPage />} />
        <Route path="/reserva/nueva" element={<EditarReservaPage />} />
        <Route path="/reserva/:id" element={<EditarReservaPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {conPestanas(pathname) && (
        <nav className="pestanas">
          {PESTANAS.map((p) => (
            <Link key={p.ruta} to={p.ruta} className={activa(p.ruta, pathname) ? 'activa' : ''} aria-current={activa(p.ruta, pathname) ? 'page' : undefined}>
              <Icono nombre={p.icono} />
              {p.texto}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
