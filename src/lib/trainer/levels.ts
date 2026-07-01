export type LevelId = "A1" | "A2" | "B1" | "B2";

import type { StringKey } from "@/lib/i18n/strings";
import { Briefcase, Plane, UtensilsCrossed, Palette, Salad, BookOpen, Car, type LucideIcon } from "lucide-react";

export type SetTone = "amber" | "violet" | "emerald" | "sky" | "rose";

export interface ListMeta {
  id: string;
  level: LevelId;
  part: number;
  /** i18n key for the list title. */
  titleKey: StringKey;
  /** Variables to interpolate into titleKey. */
  titleVars?: Record<string, string | number>;
  /** i18n key for the list description. */
  descriptionKey: StringKey;
  /** Legacy fields for code paths that haven't been migrated yet. */
  title: string;
  description: string;
  /** Optional icon + tone for themed sentence-set cards. */
  icon?: LucideIcon;
  tone?: SetTone;
}

export interface LevelGroup {
  id: LevelId;
  label: string;
  descriptionKey: StringKey;
  description: string;
  tone: "teal" | "amber" | "orange" | "violet";
  lists: ListMeta[];
}

export interface BandGroup {
  band: "Beginner" | "Intermediate";
  dotClass: string;
  levels: LevelGroup[];
  extras?: ListMeta[];
}

const descByLevel: Record<LevelId, { key: StringKey; en: string }> = {
  A1: { key: "level.A1.desc", en: "Fundamental words and phrases for navigating simple, everyday situations." },
  A2: { key: "level.A2.desc", en: "Essential vocabulary for describing your environment, routine, and recent past." },
  B1: { key: "level.B1.desc", en: "Functional language to express opinions, explain plans, and handle most situations." },
  B2: { key: "level.B2.desc", en: "Versatile vocabulary for engaging in complex discussions and expressing views." },
};

const partKeys: Record<LevelId, StringKey[]> = {
  A1: ["part.A1.1", "part.A1.2", "part.A1.3", "part.A1.4"],
  A2: ["part.A2.1", "part.A2.2", "part.A2.3", "part.A2.4"],
  B1: ["part.B1.1", "part.B1.2", "part.B1.3", "part.B1.4"],
  B2: ["part.B2.1", "part.B2.2", "part.B2.3", "part.B2.4"],
};
const partEn: Record<LevelId, string[]> = {
  A1: ["Greetings, pronouns, simple states", "Family, numbers, colors, days", "Common verbs in the present", "Places, directions, basic questions"],
  A2: ["Daily routine and past tense", "Food, ordering, modal verbs", "Travel, transport, future plans", "Weather, clothing, feelings"],
  B1: ["Opinions, feelings, complex thoughts", "Work, study, conditionals", "Health, body, reflexives", "City life, comparisons, culture"],
  B2: ["Society, participles, gerunds", "News, environment, formal speech", "Idioms and colloquial expressions", "Literature, narrative, indirect speech"],
};

function listsFor(level: LevelId): ListMeta[] {
  return partKeys[level].map((key, i) => ({
    id: `${level.toLowerCase()}-part-${i + 1}`,
    level,
    part: i + 1,
    titleKey: "list.levelPartTitle",
    titleVars: { level, part: i + 1 },
    descriptionKey: key,
    title: `${level} Level — Part ${i + 1}`,
    description: partEn[level][i],
  }));
}

export const LEVELS: LevelGroup[] = [
  { id: "A1", label: "A1", descriptionKey: descByLevel.A1.key, description: descByLevel.A1.en, tone: "teal",  lists: listsFor("A1") },
  { id: "A2", label: "A2", descriptionKey: descByLevel.A2.key, description: descByLevel.A2.en, tone: "teal",  lists: listsFor("A2") },
  { id: "B1", label: "B1", descriptionKey: descByLevel.B1.key, description: descByLevel.B1.en, tone: "amber", lists: listsFor("B1") },
  { id: "B2", label: "B2", descriptionKey: descByLevel.B2.key, description: descByLevel.B2.en, tone: "orange",lists: listsFor("B2") },
];

export const BEGINNER_EXTRAS: ListMeta[] = [
  {
    id: "basic-verb-conjugations",
    level: "A1",
    part: 0,
    titleKey: "extra.basicVerb.title",
    descriptionKey: "extra.basicVerb.desc",
    title: "Basic Verb Conjugations",
    description: "Present · Past · Future",
  },
];

export const INTERMEDIATE_EXTRAS: ListMeta[] = [
  { id: "top-300-adjectives", level: "B1", part: 0, titleKey: "extra.adj.title",  descriptionKey: "extra.adj.desc",  title: "300 Most Common Adjectives", description: "Essential descriptors to add detail and variety to your daily language." },
  { id: "top-300-adverbs",    level: "B1", part: 0, titleKey: "extra.adv.title",  descriptionKey: "extra.adv.desc",  title: "300 Most Common Adverbs",    description: "Key modifiers to express how, when, and where actions take place." },
  { id: "top-300-verbs",      level: "B1", part: 0, titleKey: "extra.verb.title", descriptionKey: "extra.verb.desc", title: "300 Most Common Verbs",      description: "Essential action words to describe activities and states of being." },
];

export const SENTENCE_SETS: ListMeta[] = [
  {
    id: "trv",
    level: "A2",
    part: 0,
    titleKey: "list.levelPartTitle",
    titleVars: { level: "Travel", part: 1 },
    descriptionKey: "part.A2.3",
    title: "Travel",
    description: "Pack your bags — buying tickets, checking in, asking for directions and finding your way around a new city.",
    icon: Plane,
    tone: "sky",
  },
  {
    id: "orderingfood-part-1",
    level: "A2",
    part: 1,
    titleKey: "list.levelPartTitle",
    titleVars: { level: "Ordering Food", part: 1 },
    descriptionKey: "part.A2.2",
    title: "Ordering Food",
    description: "Café and restaurant essentials — reading the menu, placing your order and asking for the bill.",
    icon: UtensilsCrossed,
    tone: "rose",
  },
  {
    id: "hobbies-part-1",
    level: "A2",
    part: 1,
    titleKey: "list.levelPartTitle",
    titleVars: { level: "Hobbies", part: 1 },
    descriptionKey: "part.A1.1",
    title: "Hobbies",
    description: "Talk about what you love — sports, music, cooking, gaming and the little rituals that fill your free time.",
    icon: Palette,
    tone: "emerald",
  },
  {
    id: "businessjob-part-1",
    level: "B1",
    part: 1,
    titleKey: "list.levelPartTitle",
    titleVars: { level: "Business & Job", part: 1 },
    descriptionKey: "part.B1.2",
    title: "Business & Job",
    description: "Workplace Russian — interviews, meetings, emails, deadlines and talking shop with colleagues.",
    icon: Briefcase,
    tone: "violet",
  },
  {
    id: "cars-part-1",
    level: "A2",
    part: 1,
    titleKey: "list.levelPartTitle",
    titleVars: { level: "Cars", part: 1 },
    descriptionKey: "part.A2.3",
    title: "Cars",
    description: "Life on four wheels — buying, driving, repairs, road trips and everything in between.",
    icon: Car,
    tone: "amber",
  },
  {
    id: "food-part-1",
    level: "A2",
    part: 1,
    titleKey: "list.levelPartTitle",
    titleVars: { level: "Food & Cooking", part: 1 },
    descriptionKey: "part.A2.2",
    title: "Food & Cooking",
    description: "From kitchen to table — ingredients, recipes, flavors and everyday meals at home.",
    icon: Salad,
    tone: "emerald",
  },
  {
    id: "literature-part-1",
    level: "B1",
    part: 1,
    titleKey: "list.levelPartTitle",
    titleVars: { level: "Literature", part: 1 },
    descriptionKey: "part.B1.1",
    title: "Literature",
    description: "Russian books, poets and reading life — Pushkin to modern novels, libraries, genres and what makes a story stick.",
    icon: BookOpen,
    tone: "violet",
  },
  {
    id: "orderingfood-part-1",
    level: "A2",
    part: 0,
    titleKey: "set.orderingFood.title",
    descriptionKey: "set.orderingFood.desc",
    title: "Ordering Food",
    description: "Themed sentences about ordering food — restaurants, menus, drinks, and dishes.",
  },
  {
    id: "hangingout-part-1",
    level: "A2",
    part: 0,
    titleKey: "set.hangingOut.title",
    descriptionKey: "set.hangingOut.desc",
    title: "Hanging Out",
    description: "Themed sentences about spending time with friends — meeting, talking, and having fun.",
  },
];


export const BANDS: BandGroup[] = [
  { band: "Beginner",     dotClass: "bg-emerald-500", levels: [LEVELS[0], LEVELS[1]], extras: BEGINNER_EXTRAS },
  { band: "Intermediate", dotClass: "bg-amber-500",   levels: [LEVELS[2], LEVELS[3]], extras: INTERMEDIATE_EXTRAS },
];

export function findList(listId: string): ListMeta | undefined {
  for (const lvl of LEVELS) {
    const m = lvl.lists.find((l) => l.id === listId);
    if (m) return m;
  }
  for (const x of [...BEGINNER_EXTRAS, ...INTERMEDIATE_EXTRAS, ...SENTENCE_SETS]) {
    if (x.id === listId) return x;
  }
  return undefined;
}

export const TONE_CLASSES: Record<LevelGroup["tone"], { ring: string; bg: string; text: string; border: string }> = {
  teal:   { ring: "ring-emerald-500", bg: "bg-emerald-500", text: "text-emerald-700", border: "border-l-emerald-400" },
  amber:  { ring: "ring-amber-500",   bg: "bg-amber-500",   text: "text-amber-700",   border: "border-l-amber-400" },
  orange: { ring: "ring-orange-500",  bg: "bg-orange-500",  text: "text-orange-700",  border: "border-l-orange-400" },
  violet: { ring: "ring-violet-500",  bg: "bg-violet-500",  text: "text-violet-700",  border: "border-l-violet-400" },
};
