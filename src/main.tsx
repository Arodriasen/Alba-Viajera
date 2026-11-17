import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import './index.css';
import { AlmacenIndexedDb } from './infrastructure/local/AlmacenIndexedDb';
import { ProveedorAlbaViajera } from './ui/AlbaViajera';

const raiz = createRoot(document.getElementById('root')!);

AlmacenIndexedDb.abrir().then(
  (almacen) =>
    raiz.render(
      <StrictMode>
        <ProveedorAlbaViajera almacen={almacen}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ProveedorAlbaViajera>
      </StrictMode>,
    ),
  (e) =>
    raiz.render(
      <p style={{ padding: 24 }}>
        No se ha podido abrir el almacenamiento del navegador ({String(e)}). Si estás en una ventana privada, ábrela en una normal.
      </p>,
    ),
);
