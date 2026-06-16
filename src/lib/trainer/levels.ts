export type LevelId = "A1" | "A2" | "B1" | "B2";

export interface ListMeta {
  id: string;
  level: LevelId;
  part: number;
  title: string;
  description: string;
}

export interface LevelGroup {
  id: LevelId;
  label: string;
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


const descByLevel: Record<LevelId, string> = {
  A1: "Fundamental words and phrases for navigating simple, everyday situations.",
  A2: "Essential vocabulary for describing your environment, routine, and recent past.",
  B1: "Functional language to express opinions, explain plans, and handle most situations.",
  B2: "Versatile vocabulary for engaging in complex discussions and expressing views.",
};

const partTheme: Record<LevelId, string[]> = {
  A1: [
    "Greetings, pronouns, simple states",
    "Family, numbers, colors, days",
    "Common verbs in the present",
    "Places, directions, basic questions",
  ],
  A2: [
    "Daily routine and past tense",
    "Food, ordering, modal verbs",
    "Travel, transport, future plans",
    "Weather, clothing, feelings",
  ],
  B1: [
    "Opinions, feelings, complex thoughts",
    "Work, study, conditionals",
    "Health, body, reflexives",
    "City life, comparisons, culture",
  ],
  B2: [
    "Society, participles, gerunds",
    "News, environment, formal speech",
    "Idioms and colloquial expressions",
    "Literature, narrative, indirect speech",
  ],
};

function listsFor(level: LevelId): ListMeta[] {
  return partTheme[level].map((theme, i) => ({
    id: `${level.toLowerCase()}-part-${i + 1}`,
    level,
    part: i + 1,
    title: `${level} Level — Part ${i + 1}`,
    description: theme,
  }));
}

export const LEVELS: LevelGroup[] = [
  { id: "A1", label: "A1", description: descByLevel.A1, tone: "teal", lists: listsFor("A1") },
  { id: "A2", label: "A2", description: descByLevel.A2, tone: "teal", lists: listsFor("A2") },
  { id: "B1", label: "B1", description: descByLevel.B1, tone: "amber", lists: listsFor("B1") },
  { id: "B2", label: "B2", description: descByLevel.B2, tone: "orange", lists: listsFor("B2") },
];

export const BEGINNER_EXTRAS: ListMeta[] = [
  {
    id: "basic-verb-conjugations",
    level: "A1",
    part: 0,
    title: "Basic Verb Conjugations",
    description: "Present · Past · Future",
  },
];

export const INTERMEDIATE_EXTRAS: ListMeta[] = [
  {
    id: "top-300-adjectives",
    level: "B1",
    part: 0,
    title: "300 Most Common Adjectives",
    description: "Essential descriptors to add detail and variety to your daily language.",
  },
  {
    id: "top-300-adverbs",
    level: "B1",
    part: 0,
    title: "300 Most Common Adverbs",
    description: "Key modifiers to express how, when, and where actions take place.",
  },
  {
    id: "top-300-verbs",
    level: "B1",
    part: 0,
    title: "300 Most Common Verbs",
    description: "Essential action words to describe activities and states of being.",
  },
];

export const BANDS: BandGroup[] = [
  { band: "Beginner", dotClass: "bg-emerald-500", levels: [LEVELS[0], LEVELS[1]], extras: BEGINNER_EXTRAS },
  { band: "Intermediate", dotClass: "bg-amber-500", levels: [LEVELS[2], LEVELS[3]], extras: INTERMEDIATE_EXTRAS },
];

export function findList(listId: string): ListMeta | undefined {
  for (const lvl of LEVELS) {
    const m = lvl.lists.find((l) => l.id === listId);
    if (m) return m;
  }
  for (const x of [...BEGINNER_EXTRAS, ...INTERMEDIATE_EXTRAS]) {
    if (x.id === listId) return x;
  }
  return undefined;
}


export const TONE_CLASSES: Record<LevelGroup["tone"], { ring: string; bg: string; text: string; border: string }> = {
  teal: { ring: "ring-emerald-500", bg: "bg-emerald-500", text: "text-emerald-700", border: "border-l-emerald-400" },
  amber: { ring: "ring-amber-500", bg: "bg-amber-500", text: "text-amber-700", border: "border-l-amber-400" },
  orange: { ring: "ring-orange-500", bg: "bg-orange-500", text: "text-orange-700", border: "border-l-orange-400" },
  violet: { ring: "ring-violet-500", bg: "bg-violet-500", text: "text-violet-700", border: "border-l-violet-400" },
};
