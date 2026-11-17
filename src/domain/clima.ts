/**
 * Tiempo y avisos (TypeScript puro): traducción de los códigos del tiempo (WMO), de los avisos de la
 * Agencia Meteorológica de Japón (JMA) y de la escala sísmica japonesa (shindo).
 */

// ───── El tiempo ─────

export type IconoTiempo = 'sol' | 'luna' | 'nubes' | 'nubes_noche' | 'nublado' | 'niebla' | 'llovizna' | 'lluvia' | 'nieve' | 'tormenta';

/** Códigos WMO que usa Open-Meteo. De noche, luna en vez de sol. */
export function describirTiempo(codigo: number, deDia = true): { texto: string; icono: IconoTiempo } {
  if (codigo === 0) return { texto: 'Despejado', icono: deDia ? 'sol' : 'luna' };
  if (codigo <= 2) return { texto: 'Poco nuboso', icono: deDia ? 'nubes' : 'nubes_noche' };
  if (codigo === 3) return { texto: 'Nublado', icono: 'nublado' };
  if (codigo === 45 || codigo === 48) return { texto: 'Niebla', icono: 'niebla' };
  if (codigo >= 51 && codigo <= 57) return { texto: 'Llovizna', icono: 'llovizna' };
  if ((codigo >= 61 && codigo <= 67) || (codigo >= 80 && codigo <= 82)) return { texto: codigo >= 65 && codigo !== 80 ? 'Lluvia fuerte' : 'Lluvia', icono: 'lluvia' };
  if ((codigo >= 71 && codigo <= 77) || codigo === 85 || codigo === 86) return { texto: 'Nieve', icono: 'nieve' };
  if (codigo >= 95) return { texto: 'Tormenta', icono: 'tormenta' };
  return { texto: 'Variable', icono: 'nubes' };
}

export interface HoraTiempo {
  /** Instante. */
  hora: Date;
  deDia: boolean;
  temperatura: number;
  /** % de probabilidad de lluvia. */
  lluvia: number;
  codigo: number;
}

export interface DiaTiempo {
  fecha: string;
  codigo: number;
  maxima: number;
  minima: number;
  /** % de probabilidad de lluvia. */
  lluvia: number;
  /** cm de nieve. */
  nieve: number;
}

export interface Pronostico {
  actualizado: Date;
  ahora: { temperatura: number; sensacion: number; codigo: number; viento: number; deDia: boolean };
  horas: HoraTiempo[];
  dias: DiaTiempo[];
}

/** Aviso corto para el día: lluvia o nieve en las próximas horas. */
export function consejoDelDia(horas: HoraTiempo[], desde: Date, zona = 'Asia/Tokyo'): string | undefined {
  const horaJapon = (d: Date) => horaEn(d, zona);
  const proximas = horas.filter((h) => h.hora >= new Date(desde.getTime() - 3600_000)).slice(0, 12);
  const nieve = proximas.find((h) => describirTiempo(h.codigo).icono === 'nieve');
  if (nieve) return `Nieve hacia las ${horaJapon(nieve.hora)}: abrigo extra para Alba y calzado que agarre.`;
  const lluvia = proximas.find((h) => h.lluvia >= 50);
  if (lluvia) return `Lluvia probable hacia las ${horaJapon(lluvia.hora)}: paraguas y el plástico del carrito.`;
  return undefined;
}

const formatos = new Map<string, Intl.DateTimeFormat>();
/** "14:05" en la hora de esa zona. */
export function horaEn(d: Date, zona: string): string {
  let f = formatos.get(zona);
  if (!f) formatos.set(zona, (f = new Intl.DateTimeFormat('es-ES', { timeZone: zona, hour: '2-digit', minute: '2-digit' })));
  return f.format(d);
}
export const horaJapon = (d: Date) => horaEn(d, 'Asia/Tokyo');

// ───── Avisos meteorológicos de la JMA (警報・注意報) ─────

export type NivelAviso = 'precaucion' | 'aviso' | 'emergencia';

/** Código JMA → nombre en español y nivel (注意報 precaución, 警報 aviso, 特別警報 emergencia). */
export const AVISOS_JMA: Record<string, { nombre: string; nivel: NivelAviso }> = {
  '02': { nombre: 'Ventisca', nivel: 'aviso' },
  '03': { nombre: 'Lluvia intensa', nivel: 'aviso' },
  '04': { nombre: 'Inundaciones', nivel: 'aviso' },
  '05': { nombre: 'Temporal de viento', nivel: 'aviso' },
  '06': { nombre: 'Nevada intensa', nivel: 'aviso' },
  '07': { nombre: 'Oleaje', nivel: 'aviso' },
  '08': { nombre: 'Marea de tormenta', nivel: 'aviso' },
  '10': { nombre: 'Lluvia fuerte', nivel: 'precaucion' },
  '12': { nombre: 'Nevada', nivel: 'precaucion' },
  '13': { nombre: 'Viento con nieve', nivel: 'precaucion' },
  '14': { nombre: 'Tormentas eléctricas', nivel: 'precaucion' },
  '15': { nombre: 'Viento fuerte', nivel: 'precaucion' },
  '16': { nombre: 'Oleaje', nivel: 'precaucion' },
  '17': { nombre: 'Deshielo', nivel: 'precaucion' },
  '18': { nombre: 'Crecidas', nivel: 'precaucion' },
  '19': { nombre: 'Marea alta', nivel: 'precaucion' },
  '20': { nombre: 'Niebla densa', nivel: 'precaucion' },
  '21': { nombre: 'Aire muy seco', nivel: 'precaucion' },
  '22': { nombre: 'Aludes', nivel: 'precaucion' },
  '23': { nombre: 'Frío intenso', nivel: 'precaucion' },
  '24': { nombre: 'Heladas', nivel: 'precaucion' },
  '25': { nombre: 'Hielo', nivel: 'precaucion' },
  '26': { nombre: 'Acumulación de nieve', nivel: 'precaucion' },
  '27': { nombre: 'Otros', nivel: 'precaucion' },
  '32': { nombre: 'Ventisca', nivel: 'emergencia' },
  '33': { nombre: 'Lluvia intensa', nivel: 'emergencia' },
  '35': { nombre: 'Temporal de viento', nivel: 'emergencia' },
  '36': { nombre: 'Nevada intensa', nivel: 'emergencia' },
  '37': { nombre: 'Oleaje', nivel: 'emergencia' },
  '38': { nombre: 'Marea de tormenta', nivel: 'emergencia' },
};

export const NOMBRE_NIVEL: Record<NivelAviso, string> = {
  precaucion: 'Precaución (注意報)',
  aviso: 'Aviso (警報)',
  emergencia: 'Emergencia (特別警報)',
};

const ORDEN_NIVEL: Record<NivelAviso, number> = { emergencia: 0, aviso: 1, precaucion: 2 };

export interface AvisoMeteo {
  codigo: string;
  nombre: string;
  nivel: NivelAviso;
}

/** Del JSON de la JMA, los avisos en vigor (emitidos o que continúan) de una zona. */
export function avisosActivos(
  areas: { code: string; warnings?: { code: string; status: string }[] }[],
  zona?: string,
): AvisoMeteo[] {
  const elegidas = zona ? areas.filter((a) => a.code === zona) : areas;
  const vistos = new Map<string, AvisoMeteo>();
  for (const a of elegidas.length ? elegidas : areas) {
    for (const w of a.warnings ?? []) {
      if (w.status !== '発表' && w.status !== '継続') continue;
      const info = AVISOS_JMA[w.code];
      if (info && !vistos.has(w.code)) vistos.set(w.code, { codigo: w.code, ...info });
    }
  }
  return [...vistos.values()].sort((a, b) => ORDEN_NIVEL[a.nivel] - ORDEN_NIVEL[b.nivel]);
}

// ───── Terremotos (escala shindo de la JMA) ─────

const PREFECTURAS: Record<string, string> = {
  北海道: 'Hokkaido', 青森県: 'Aomori', 岩手県: 'Iwate', 宮城県: 'Miyagi', 秋田県: 'Akita', 山形県: 'Yamagata', 福島県: 'Fukushima',
  茨城県: 'Ibaraki', 栃木県: 'Tochigi', 群馬県: 'Gunma', 埼玉県: 'Saitama', 千葉県: 'Chiba', 東京都: 'Tokio', 神奈川県: 'Kanagawa',
  新潟県: 'Niigata', 富山県: 'Toyama', 石川県: 'Ishikawa', 福井県: 'Fukui', 山梨県: 'Yamanashi', 長野県: 'Nagano', 岐阜県: 'Gifu',
  静岡県: 'Shizuoka', 愛知県: 'Aichi', 三重県: 'Mie', 滋賀県: 'Shiga', 京都府: 'Kioto', 大阪府: 'Osaka', 兵庫県: 'Hyogo', 奈良県: 'Nara',
  和歌山県: 'Wakayama', 鳥取県: 'Tottori', 島根県: 'Shimane', 岡山県: 'Okayama', 広島県: 'Hiroshima', 山口県: 'Yamaguchi',
  徳島県: 'Tokushima', 香川県: 'Kagawa', 愛媛県: 'Ehime', 高知県: 'Kochi', 福岡県: 'Fukuoka', 佐賀県: 'Saga', 長崎県: 'Nagasaki',
  熊本県: 'Kumamoto', 大分県: 'Oita', 宮崎県: 'Miyazaki', 鹿児島県: 'Kagoshima', 沖縄県: 'Okinawa',
};

/** "石川県能登地方" → { es: "Ishikawa", ja: "石川県能登地方" }. Sin prefectura conocida (mar, Hokkaido…), solo el original. */
export function lugarLegible(lugar: string): { es?: string; ja: string } {
  const pref = Object.keys(PREFECTURAS).find((p) => lugar.startsWith(p) || lugar.startsWith(p.replace(/[都府県]$/, '')));
  if (pref) return { es: PREFECTURAS[pref] + (lugar.endsWith('沖') ? ' (en el mar)' : ''), ja: lugar };
  return { es: lugar.endsWith('沖') ? 'En el mar' : undefined, ja: lugar };
}

/** P2PQuake da la intensidad ×10: 10 = 1, 45 = 5 débil, 50 = 5 fuerte… */
const SHINDO: Record<number, string> = { 10: '1', 20: '2', 30: '3', 40: '4', 45: '5−', 46: '5− (estimado)', 50: '5+', 55: '6−', 60: '6+', 70: '7' };
export const shindo = (escala: number) => SHINDO[escala] ?? '—';

/** Qué se nota con cada intensidad (resumen de la escala de la JMA). */
export const ESCALA_SHINDO: { nivel: string; texto: string }[] = [
  { nivel: '1–2', texto: 'Apenas se nota; algunas personas en reposo lo perciben.' },
  { nivel: '3', texto: 'Lo nota casi todo el mundo dentro de los edificios; tiemblan las lámparas.' },
  { nivel: '4', texto: 'Asusta; se mueven objetos colgados y los platos pueden caerse.' },
  { nivel: '5− / 5+', texto: 'Cuesta moverse; caen objetos y muebles sin sujetar. Protegerse.' },
  { nivel: '6− / 6+ / 7', texto: 'Muy fuerte: imposible mantenerse en pie; daños en edificios. Seguir las instrucciones oficiales.' },
];

export interface Terremoto {
  id: string;
  hora: Date;
  lugar: string;
  magnitud?: number;
  profundidad?: number;
  /** Intensidad máxima (escala P2PQuake ×10). */
  maxima: number;
  tsunami: 'ninguno' | 'revisando' | 'sin-riesgo' | 'vigilancia' | 'aviso' | 'desconocido';
  /** Intensidad máxima por prefectura (nombre japonés → escala). */
  prefecturas: Record<string, number>;
}

export const TEXTO_TSUNAMI: Record<Terremoto['tsunami'], string> = {
  ninguno: 'Sin riesgo de tsunami',
  'sin-riesgo': 'Sin riesgo de tsunami (pequeñas variaciones del mar)',
  revisando: 'Revisando si hay riesgo de tsunami',
  vigilancia: 'Vigilancia de tsunami',
  aviso: 'AVISO DE TSUNAMI',
  desconocido: 'Riesgo de tsunami sin confirmar',
};

/** ¿Se ha notado en alguna de estas prefecturas con intensidad ≥ `minimo`? */
export function nosAfecta(t: Terremoto, prefecturas: string[], minimo = 30): boolean {
  return prefecturas.some((p) => (t.prefecturas[p] ?? 0) >= minimo);
}

export interface AlertaTsunami {
  nivel: 'aviso-grave' | 'aviso' | 'vigilancia';
  zonas: string[];
}

export const TEXTO_NIVEL_TSUNAMI: Record<AlertaTsunami['nivel'], string> = {
  'aviso-grave': 'Gran aviso de tsunami (大津波警報)',
  aviso: 'Aviso de tsunami (津波警報)',
  vigilancia: 'Vigilancia de tsunami (津波注意報)',
};
