export interface GrammarExample {
  ru: string;
  en: string;
  en_pl?: string;
  en_de?: string;
  note?: string;
  note_pl?: string;
  note_de?: string;
}

export interface GrammarNote {
  title: string;
  title_pl?: string;
  title_de?: string;
  // Markdown-lite: **bold** and _italic_ supported by renderInline().
  body: string;
  body_pl?: string;
  body_de?: string;
  examples?: GrammarExample[];
  /** Explicit sentence IDs from the same list to surface under the note. */
  matchIds?: string[];
  /** Fallback: whole-word match on substrings, or suffix match on word endings. */
  match?: { contains?: string[]; endsWith?: string[] };
}


export interface GrammarPack {
  listId: string;
  intro?: string;
  intro_pl?: string;
  intro_de?: string;
  tags?: GrammarTag[];
  notes: GrammarNote[];
}

import { a1Part1 } from "@/data/grammar/a1-part-1";
import { a1Part2 } from "@/data/grammar/a1-part-2";
import { a1Part3 } from "@/data/grammar/a1-part-3";
import { a1Part4 } from "@/data/grammar/a1-part-4";
import { a2Part1 } from "@/data/grammar/a2-part-1";
import { a2Part2 } from "@/data/grammar/a2-part-2";
import { a2Part3 } from "@/data/grammar/a2-part-3";
import { a2Part4 } from "@/data/grammar/a2-part-4";
import { b1Part1 } from "@/data/grammar/b1-part-1";
import { b1Part2 } from "@/data/grammar/b1-part-2";
import { b1Part3 } from "@/data/grammar/b1-part-3";
import { b1Part4 } from "@/data/grammar/b1-part-4";
import { b2Part1 } from "@/data/grammar/b2-part-1";
import { b2Part2 } from "@/data/grammar/b2-part-2";
import { b2Part3 } from "@/data/grammar/b2-part-3";
import { b2Part4 } from "@/data/grammar/b2-part-4";
import { top300Verbs } from "@/data/grammar/top-300-verbs";

/** Canonical, curated vocabulary for the home-page tag filter. */
export const GRAMMAR_TAGS = [
  "present tense",
  "past tense",
  "future tense",
  "aspect",
  "pronouns",
  "nouns",
  "adjectives",
  "adverbs",
  "prepositions",
  "cases",
  "nominative",
  "genitive",
  "dative",
  "accusative",
  "instrumental",
  "prepositional",
  "modals",
  "reflexive",
  "conditionals",
  "participles",
  "gerunds",
  "comparatives",
  "indirect speech",
  "idioms",
] as const;
export type GrammarTag = (typeof GRAMMAR_TAGS)[number];

const RAW_PACKS: Record<string, GrammarPack> = {
  "a1-part-1": a1Part1,
  "a1-part-2": a1Part2,
  "a1-part-3": a1Part3,
  "a1-part-4": a1Part4,
  "a2-part-1": a2Part1,
  "a2-part-2": a2Part2,
  "a2-part-3": a2Part3,
  "a2-part-4": a2Part4,
  "b1-part-1": b1Part1,
  "b1-part-2": b1Part2,
  "b1-part-3": b1Part3,
  "b1-part-4": b1Part4,
  "b2-part-1": b2Part1,
  "b2-part-2": b2Part2,
  "b2-part-3": b2Part3,
  "b2-part-4": b2Part4,
  "top-300-verbs": top300Verbs,
};

/**
 * Overlay of tags + per-note auto-match keywords. Stored separately from the
 * generated pack files so we don't have to touch each file to evolve the
 * filtering and "from this list" linking.
 */
const OVERLAY: Record<
  string,
  { tags?: GrammarTag[]; matches?: Array<{ contains?: string[]; endsWith?: string[] }> }

> = {
  "a1-part-1": {
    tags: ["pronouns", "present tense"],
    matches: [
      { contains: ["Как тебя", "Как вас", "Здравствуйте", "Привет"] },
      { contains: ["Я ", "Это ", "Меня зовут", "— "] },
      { contains: ["я", "ты", "он", "она", "оно", "мы", "вы", "они", "меня", "тебя", "его", "её", "нас", "вас", "их", "мне", "тебе", "ему", "ей", "нам", "вам", "им"] },
    ],
  },
  "a1-part-2": {
    tags: ["nouns", "adjectives"],
    matches: [
      { contains: ["мой", "моя", "моё", "мои"] },
      { contains: ["У меня", "У тебя", "У него", "У неё"] },
      { contains: ["один", "два", "три", "четыре", "пять"] },
    ],
  },
  "a1-part-3": {
    tags: ["present tense", "reflexive"],
    matches: [
      { contains: ["читаю", "читаешь", "читает", "читаем", "читают"] },
      { contains: ["говорю", "говоришь", "говорит", "говорим", "говорят"] },
      { contains: ["люблю", "вижу", "хожу"] },
    ],
  },
  "a1-part-4": {
    tags: ["prepositions", "prepositional"],
    matches: [
      { contains: ["в школе", "на работе", "в Москве", "в парке"] },
      { contains: ["иду", "идёт", "еду", "едет"] },
      { contains: ["Где", "Куда", "Откуда"] },
    ],
  },
  "a2-part-1": {
    tags: ["past tense", "aspect"],
    matches: [
      { contains: ["читал", "читала", "читали", "читало"] },
      { contains: ["прочитал", "написал", "сделал", "сказал"] },
      { contains: ["вчера", "раньше", "всегда", "иногда", "никогда"] },
    ],
  },
  "a2-part-2": {
    tags: ["accusative", "modals"],
    matches: [
      { contains: ["хочу", "хочешь", "хочет", "хотим", "хотят"] },
      { contains: ["могу", "можешь", "может", "можем", "могут"] },
      { contains: ["должен", "должна", "должны", "нужно", "надо"] },
    ],
  },
  "a2-part-3": {
    tags: ["future tense", "aspect"],
    matches: [
      { contains: ["буду", "будешь", "будет", "будем", "будете", "будут"] },
      { contains: ["прочитаю", "напишу", "сделаю", "куплю"] },
      { contains: ["завтра", "послезавтра", "поедем", "поеду"] },
    ],
  },
  "a2-part-4": {
    tags: ["dative", "adverbs"],
    matches: [
      { contains: ["Мне холодно", "Мне жарко", "Мне скучно", "Мне грустно"] },
      { contains: ["нравится", "нравятся"] },
      { contains: ["нужно", "надо"] },
    ],
  },
  "b1-part-1": {
    tags: ["pronouns", "reflexive"],
    matches: [
      { contains: ["думаю, что", "мне кажется", "по-моему", "считаю"] },
      { contains: ["учусь", "занимаюсь", "нравится", "бо"] },
    ],
  },
  "b1-part-2": {
    tags: ["conditionals"],
    matches: [
      { contains: ["если", "Если"] },
      { contains: ["бы "] },
    ],
  },
  "b1-part-3": {
    tags: ["instrumental"],
    matches: [
      { contains: ["с другом", "с подругой", "с семьёй"] },
      { contains: ["работаю", "работает", "занимаюсь"] },
      { contains: ["ручкой", "карандашом", "ложкой"] },
    ],
  },
  "b1-part-4": {
    tags: ["comparatives", "adjectives"],
    matches: [
      { contains: ["больше", "меньше", "лучше", "хуже"] },
      { contains: ["самый", "самая", "самое", "самые"] },
      { contains: ["чем "] },
    ],
  },
  "b2-part-1": {
    tags: ["participles"],
    matches: [
      { endsWith: ["ющий", "ущий", "ящий", "ащий", "ющая", "ющее", "ющие", "ущая", "ущие"] },
      { endsWith: ["вший", "вшая", "вшее", "вшие"] },
      { endsWith: ["нный", "нная", "нное", "нные", "тый", "тая", "тое", "тые"] },
    ],
  },
  "b2-part-2": {
    tags: ["gerunds"],
    matches: [
      { contains: ["читая", "говоря", "идя", "глядя", "слушая"] },
      { contains: ["прочитав", "сказав", "сделав", "закончив"] },
    ],
  },

  "b2-part-3": {
    tags: ["idioms"],
    matches: [
      { contains: ["спустя рукава", "вешать лапшу", "как говорится"] },
      { contains: ["дело в том", "на самом деле", "тем не менее"] },
    ],
  },
  "b2-part-4": {
    tags: ["indirect speech"],
    matches: [
      { contains: [" что ", " ли "] },
      { contains: ["сказал, что", "спросил", "ответил"] },
    ],
  },
  "top-300-verbs": {
    tags: ["aspect"],
  },
};

function applyOverlay(pack: GrammarPack): GrammarPack {
  const overlay = OVERLAY[pack.listId];
  if (!overlay) return pack;
  const matches = overlay.matches ?? [];
  return {
    ...pack,
    tags: overlay.tags ?? pack.tags,
    notes: pack.notes.map((note, i) => ({
      ...note,
      match: note.match ?? matches[i],
    })),
  };
}

// Sidecar translations: src/data/grammar/_i18n/<listId>.json
// Shape: { pl?: { intro?, notes: [{ title?, body?, examples?: [{en?, note?}] }] }, de?: {...} }
type I18nExample = { en?: string; note?: string };
type I18nNote = { title?: string; body?: string; examples?: I18nExample[] };
type I18nPack = { intro?: string; notes?: I18nNote[] };
type Sidecar = { pl?: I18nPack; de?: I18nPack };

const I18N_MODULES = import.meta.glob<{ default: Sidecar }>(
  "../../data/grammar/_i18n/*.json",
  { eager: true },
);
const I18N_MAP = new Map<string, Sidecar>();
for (const [path, mod] of Object.entries(I18N_MODULES)) {
  const id = path.replace(/^.*\/([^/]+)\.json$/, "$1");
  I18N_MAP.set(id, mod.default);
}

function mergeI18n(pack: GrammarPack): GrammarPack {
  const sc = I18N_MAP.get(pack.listId);
  if (!sc) return pack;
  return {
    ...pack,
    intro_pl: sc.pl?.intro ?? pack.intro_pl,
    intro_de: sc.de?.intro ?? pack.intro_de,
    notes: pack.notes.map((note, i) => {
      const pl = sc.pl?.notes?.[i];
      const de = sc.de?.notes?.[i];
      return {
        ...note,
        title_pl: pl?.title ?? note.title_pl,
        title_de: de?.title ?? note.title_de,
        body_pl: pl?.body ?? note.body_pl,
        body_de: de?.body ?? note.body_de,
        examples: note.examples?.map((ex, j) => ({
          ...ex,
          en_pl: pl?.examples?.[j]?.en ?? ex.en_pl,
          en_de: de?.examples?.[j]?.en ?? ex.en_de,
          note_pl: pl?.examples?.[j]?.note ?? ex.note_pl,
          note_de: de?.examples?.[j]?.note ?? ex.note_de,
        })),
      };
    }),
  };
}

const PACKS: Record<string, GrammarPack> = Object.fromEntries(
  Object.entries(RAW_PACKS).map(([k, v]) => [k, mergeI18n(applyOverlay(v))]),
);

export function getGrammar(listId: string): GrammarPack | undefined {
  return PACKS[listId];
}

/** Tag -> list of listIds that mention that tag. Used for home-page filtering. */
export function buildTagIndex(): Record<GrammarTag, string[]> {
  const out = {} as Record<GrammarTag, string[]>;
  for (const tag of GRAMMAR_TAGS) out[tag] = [];
  for (const [listId, pack] of Object.entries(PACKS)) {
    for (const t of pack.tags ?? []) {
      if (!out[t]) out[t] = [];
      out[t].push(listId);
    }
  }
  return out;
}

export function listTagsFor(listId: string): GrammarTag[] {
  return PACKS[listId]?.tags ?? [];
}
