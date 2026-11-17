# Chuleta: AlbaViajera

Todos los comandos en PowerShell, desde la carpeta del proyecto:

```powershell
cd G:\_Source\ViajeJapon
```

La primera vez (o si cambia `package.json`): `npm install`

## Probarla en el PC

**Lo más fácil:** doble clic en **`arrancar.bat`**. Compila, prepara la base de datos de pruebas (ya con el
viaje cargado) y abre http://127.0.0.1:8791. Para pararlo, cierra la ventana "AlbaViajera - servidor".

A mano:

```powershell
npm run build
npm run db:migrar:local
npm run dev:api            # http://127.0.0.1:8791  (Ctrl+C para parar)
```

Con recarga automática: deja `npm run dev:api` en una terminal y en otra `npm run dev` (http://localhost:5173).

**Ver cómo será un día del viaje:** añade `?hoy=2027-01-22` a la dirección. Para volver: `?hoy=`.

Base de pruebas desde cero: `Remove-Item -Recurse -Force .wrangler\state\v3\d1` y `npm run db:migrar:local`.
En el navegador: F12 → Application → Storage → "Clear site data".

## Antes de dar algo por bueno

```powershell
npm test
npm run typecheck
npm run lint
```

## Publicarla en Cloudflare (la primera vez)

Necesita tu cuenta de Cloudflare, así que estos los lanzas tú:

```powershell
npx wrangler login
npx wrangler d1 create albaviajera        # copia el "database_id" que imprime
```

1. Pega ese `database_id` en `wrangler.toml` (donde pone `PENDIENTE`).
2. Crea las tablas (con el viaje dentro) y el proyecto, y publica:

```powershell
npm run db:migrar
npx wrangler pages project create albaviajera --production-branch main
npm run deploy
```

Queda en **https://albaviajera.pages.dev**. Hasta configurar Access la API responde "Sin acceso" (a propósito).

### Proteger con Cloudflare Access (entrar con un código por email)

Igual que el Tocador, pero con el proyecto `albaviajera`:

1. https://dash.cloudflare.com → **Workers & Pages** → **albaviajera** → **Settings → General → Enable access policy**.
2. **Manage** → en Zero Trust, **Configure** → en **Public hostname** borra el `*` del Subdomain, nombre
   `AlbaViajera` → **Save**. Vuelve a activar la política de las vistas previas (paso 1).
3. En la aplicación `AlbaViajera`: **Policies** → regla **Emails** con tu correo y el de tu pareja;
   **Login methods** → **One-time PIN**; **Session Duration** → **1 month**.
4. Copia el **AUD Tag** de esa aplicación y el **Team domain** (`https://<equipo>.cloudflareaccess.com`;
   es el mismo equipo que el Tocador) y dáselos a la API:

```powershell
npx wrangler pages secret put ACCESS_TEAM_DOMAIN --project-name albaviajera
npx wrangler pages secret put ACCESS_AUD --project-name albaviajera
npm run deploy
```

### Instalarla en el móvil

- iPhone: Safari → https://albaviajera.pages.dev → código del email → Compartir → **Añadir a pantalla de inicio**.
- Android: Chrome → la misma dirección → menú ⋮ → **Instalar aplicación**.

## Publicar cambios (después)

```powershell
npm run deploy
```

Si hay una migración nueva en `migrations\`: antes `npm run db:migrar`.

## Copias de seguridad

```powershell
npx wrangler d1 export albaviajera --remote --output copia-albaviajera.sql
npx wrangler d1 time-travel restore albaviajera --timestamp=2027-01-15T10:00:00Z   # volver a un momento (30 días)
```
