import { createRemoteJWKSet, jwtVerify } from 'jose';

export interface EnvAcceso {
  /** p. ej. https://miequipo.cloudflareaccess.com */
  ACCESS_TEAM_DOMAIN?: string;
  /** "Application Audience (AUD) Tag" de la aplicación de Access. */
  ACCESS_AUD?: string;
  /** Solo en .dev.vars, para `wrangler pages dev` en el PC. */
  ACCESS_DESACTIVADO?: string;
}

const claves = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

/**
 * Cloudflare Access ya bloquea en el borde a quien no ha entrado, pero las URLs de vista previa
 * (xxxx.albaviajera.pages.dev) podrían quedar fuera de la regla. Por eso la API comprueba además
 * el JWT que Access añade a cada petición  .
 * Sin configuración, se niega todo.
 */
export async function verificarAcceso(peticion: Request, env: EnvAcceso): Promise<boolean> {
  if (env.ACCESS_DESACTIVADO === '1') return true;
  const dominio = env.ACCESS_TEAM_DOMAIN?.replace(/\/+$/, '');
  if (!dominio || !env.ACCESS_AUD) return false;

  const token = peticion.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return false;

  let jwks = claves.get(dominio);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${dominio}/cdn-cgi/access/certs`));
    claves.set(dominio, jwks);
  }
  try {
    await jwtVerify(token, jwks, { issuer: dominio, audience: env.ACCESS_AUD });
    return true;
  } catch {
    return false;
  }
}
