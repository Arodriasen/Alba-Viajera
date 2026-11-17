/**
 * Frases útiles por situaciones. Las de serie están escritas en español y japonés; para otros idiomas
 * se traducen una vez (IA de Cloudflare) y la traducción se guarda con el viaje. Las vuestras se
 * añaden desde la app. Por historia, `es` es el texto en vuestro idioma y `ja` en el de allí.
 */

import { nombreEnFrase } from './idiomas';

export type IdCategoriaFrases = 'basicas' | 'alba' | 'comer' | 'moverse';

export interface CategoriaFrases {
  id: IdCategoriaFrases;
  nombre: string;
  kanji: string;
  /** Fuera de Japón, en lugar del kanji. */
  emoji: string;
  color: string;
}

export const CATEGORIAS_FRASES: CategoriaFrases[] = [
  { id: 'basicas', nombre: 'Básicas', kanji: '話', emoji: '💬', color: '#2d4b73' },
  { id: 'alba', nombre: 'Con Alba', kanji: '子', emoji: '👶', color: '#b5476b' },
  { id: 'comer', nombre: 'Comer', kanji: '食', emoji: '🍽️', color: '#c8641f' },
  { id: 'moverse', nombre: 'Moverse y urgencias', kanji: '駅', emoji: '🚉', color: '#4f7a4a' },
];

export interface Frase {
  id: string;
  categoria: IdCategoriaFrases;
  es: string;
  ja: string;
  romaji: string;
  /** true = la habéis añadido vosotros (se puede editar y borrar). */
  propia?: boolean;
}

const f = (categoria: IdCategoriaFrases, id: string, es: string, ja: string, romaji: string): Frase => ({ id: `${categoria}-${id}`, categoria, es, ja, romaji });

export const FRASES_DE_SERIE: Frase[] = [
  f('basicas', 'hola', 'Hola', 'こんにちは', 'konnichiwa'),
  f('basicas', 'gracias', 'Muchas gracias', 'ありがとうございます', 'arigatō gozaimasu'),
  f('basicas', 'perdon', 'Perdone / disculpe', 'すみません', 'sumimasen'),
  f('basicas', 'porfavor', 'Por favor (al pedir algo)', 'お願いします', 'onegai shimasu'),
  f('basicas', 'nohablo', 'No hablo {idioma}', '日本語がわかりません', 'nihongo ga wakarimasen'),
  f('basicas', 'ingles', '¿Habla inglés?', '英語を話せますか？', 'eigo o hanasemasu ka?'),
  f('basicas', 'cuanto', '¿Cuánto cuesta?', 'いくらですか？', 'ikura desu ka?'),
  f('basicas', 'tarjeta', '¿Puedo pagar con tarjeta?', 'カードで払えますか？', 'kādo de haraemasu ka?'),
  f('basicas', 'taxfree', 'Con Tax Free, por favor', '免税でお願いします', 'menzei de onegai shimasu'),
  f('basicas', 'bano', '¿Dónde está el baño?', 'トイレはどこですか？', 'toire wa doko desu ka?'),

  f('alba', 'ascensor', '¿Hay ascensor?', 'エレベーターはありますか？', 'erebētā wa arimasu ka?'),
  f('alba', 'cambiador', '¿Hay cambiador de pañales?', 'おむつ交換台はありますか？', 'omutsu kōkandai wa arimasu ka?'),
  f('alba', 'lactancia', '¿Hay sala de lactancia?', '授乳室はありますか？', 'junyūshitsu wa arimasu ka?'),
  f('alba', 'carrito', '¿Se puede entrar con el carrito?', 'ベビーカーで入れますか？', 'bebīkā de hairemasu ka?'),
  f('alba', 'dejarcarrito', '¿Dónde puedo dejar el carrito?', 'ベビーカーはどこに置けますか？', 'bebīkā wa doko ni okemasu ka?'),
  f('alba', 'trona', '¿Tienen silla para niños?', '子ども用の椅子はありますか？', 'kodomo-yō no isu wa arimasu ka?'),
  f('alba', 'aguacaliente', '¿Me pueden dar agua caliente? (para el biberón)', 'お湯をいただけますか？', 'oyu o itadakemasu ka?'),
  f('alba', 'panales', '¿Venden pañales?', 'おむつは売っていますか？', 'omutsu wa utte imasu ka?'),
  f('alba', 'edad', 'Tiene casi dos años', 'もうすぐ2歳です', 'mōsugu ni-sai desu'),
  f('alba', 'enferma', 'Mi hija no se encuentra bien', '娘の具合が悪いです', 'musume no guai ga warui desu'),

  f('comer', 'mesa', 'Somos dos adultos y una niña', '大人2人と子ども1人です', 'otona futari to kodomo hitori desu'),
  f('comer', 'menuingles', '¿Tienen la carta en inglés?', '英語のメニューはありますか？', 'eigo no menyū wa arimasu ka?'),
  f('comer', 'esto', 'Esto, por favor (señalando)', 'これをお願いします', 'kore o onegai shimasu'),
  f('comer', 'ninos', '¿Tienen menú infantil?', 'お子様メニューはありますか？', 'okosama menyū wa arimasu ka?'),
  f('comer', 'picante', 'Sin picante, por favor', '辛くしないでください', 'karaku shinaide kudasai'),
  f('comer', 'alergia', 'Tengo alergia a esto', 'これのアレルギーがあります', 'kore no arerugī ga arimasu'),
  f('comer', 'llevar', 'Para llevar, por favor', '持ち帰りでお願いします', 'mochikaeri de onegai shimasu'),
  f('comer', 'cuenta', 'La cuenta, por favor', 'お会計お願いします', 'okaikei onegai shimasu'),
  f('comer', 'rico', '¡Está buenísimo!', 'とてもおいしいです！', 'totemo oishii desu!'),

  f('moverse', 'direccion', 'A esta dirección, por favor', 'この住所までお願いします', 'kono jūsho made onegai shimasu'),
  f('moverse', 'tren', '¿Este tren va a…? (enseñando el nombre)', 'この電車はここに行きますか？', 'kono densha wa koko ni ikimasu ka?'),
  f('moverse', 'andén', '¿De qué andén sale?', '何番線ですか？', 'nan-bansen desu ka?'),
  f('moverse', 'consigna', '¿Dónde hay taquillas para maletas?', 'コインロッカーはどこですか？', 'koin rokkā wa doko desu ka?'),
  f('moverse', 'envio', 'Quiero enviar esta maleta a este hotel', 'このホテルに荷物を送りたいです', 'kono hoteru ni nimotsu o okuritai desu'),
  f('moverse', 'perdido', 'He perdido esto', 'これをなくしました', 'kore o nakushimashita'),
  f('moverse', 'farmacia', '¿Dónde hay una farmacia?', '薬局はどこですか？', 'yakkyoku wa doko desu ka?'),
  f('moverse', 'hospital', 'Lléveme a un hospital, por favor', '病院に連れて行ってください', 'byōin ni tsurete itte kudasai'),
  f('moverse', 'ambulancia', '¡Llamen a una ambulancia!', '救急車を呼んでください！', 'kyūkyūsha o yonde kudasai!'),
  f('moverse', 'ayuda', '¡Ayuda!', '助けて！', 'tasukete!'),
  f('moverse', 'refugio', '¿Dónde está el refugio?', '避難所はどこですか？', 'hinanjo wa doko desu ka?'),
];

/** Solo tienen sentido en Japón. */
const SOLO_JAPON = new Set(['basicas-taxfree']);

export interface IdiomasFrases {
  pais: string;
  idiomaOrigen: string;
  idiomaDestino: string;
}

/** Traducción de las de serie para un viaje: `o` en vuestro idioma (si no es español) y `t` en el de allí. */
export interface TraduccionSerie {
  de: string;
  a: string;
  frases: Record<string, { o?: string; t: string }>;
}

const original = (c: IdiomasFrases) => c.idiomaOrigen === 'es' && c.idiomaDestino === 'ja';

/** Las de serie que tocan en este viaje, con el español ya completado ("No hablo italiano"). */
function serieDelViaje(c: IdiomasFrases): Frase[] {
  return FRASES_DE_SERIE.filter((x) => c.pais === 'JP' || !SOLO_JAPON.has(x.id)).map((x) => ({ ...x, es: x.es.replace('{idioma}', nombreEnFrase(c.idiomaDestino)) }));
}

/** Lo que hay que traducir para este viaje (vacío si son español → japonés). */
export function porTraducir(c: IdiomasFrases): { de: string; a: string; textos: { id: string; es: string }[] } | undefined {
  if (original(c)) return undefined;
  return { de: c.idiomaOrigen, a: c.idiomaDestino, textos: serieDelViaje(c).map((x) => ({ id: x.id, es: x.es })) };
}

/** ¿Vale esta traducción para estos idiomas? */
export const traduccionVale = (c: IdiomasFrases, t: TraduccionSerie | undefined) => original(c) || (!!t && t.de === c.idiomaOrigen && t.a === c.idiomaDestino);

/** Las de serie listas para enseñar, o undefined si aún falta traducirlas. */
export function frasesDeSerie(c: IdiomasFrases, t?: TraduccionSerie): Frase[] | undefined {
  const base = serieDelViaje(c);
  if (original(c)) return base;
  if (!traduccionVale(c, t)) return undefined;
  return base
    .map((x) => ({
      ...x,
      es: c.idiomaOrigen === 'es' ? x.es : (t!.frases[x.id]?.o ?? x.es),
      ja: c.idiomaDestino === 'ja' ? x.ja : (t!.frases[x.id]?.t ?? ''),
      romaji: c.idiomaDestino === 'ja' ? x.romaji : '',
    }))
    .filter((x) => x.ja);
}

export function leerTraduccion(json: string | undefined): TraduccionSerie | undefined {
  try {
    const v = JSON.parse(json ?? 'null');
    if (!v || typeof v.de !== 'string' || typeof v.a !== 'string' || !v.frases || typeof v.frases !== 'object') return undefined;
    return v as TraduccionSerie;
  } catch {
    return undefined;
  }
}

/** Las de una categoría: primero las de serie y después las vuestras. */
export function frasesDe(categoria: IdCategoriaFrases, propias: Frase[], serie: Frase[] = FRASES_DE_SERIE): Frase[] {
  return [...serie.filter((x) => x.categoria === categoria), ...propias.filter((x) => x.categoria === categoria).map((x) => ({ ...x, propia: true }))];
}

/** Las vuestras, guardadas como JSON en ajustes (id 'frases'); lo que no valga se descarta. */
export function leerFrasesPropias(json: string | undefined): Frase[] {
  try {
    const v = JSON.parse(json ?? '[]');
    if (!Array.isArray(v)) return [];
    const ids = new Set(CATEGORIAS_FRASES.map((c) => c.id));
    return v
      .filter((x) => x && typeof x.id === 'string' && ids.has(x.categoria) && typeof x.es === 'string' && typeof x.ja === 'string')
      .map((x) => ({ id: x.id, categoria: x.categoria, es: x.es, ja: x.ja, romaji: typeof x.romaji === 'string' ? x.romaji : '' }));
  } catch {
    return [];
  }
}
