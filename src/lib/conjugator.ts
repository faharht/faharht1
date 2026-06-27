// Rule-based Russian verb conjugator.
// Covers the majority of regular verbs + a hand-written table of common irregulars.
// Not 100% accurate (Russian morphology is huge) but good enough for a free API.

export type Conjugation = {
  infinitive: string;
  aspect: "imperfective" | "perfective";
  present: { ya: string; ty: string; on: string; my: string; vy: string; oni: string };
  past: { m: string; f: string; n: string; pl: string };
  imperative: { sg: string; pl: string };
  note?: string;
};

const VOWELS = "аеёиоуыэюя";
const isVowel = (c: string) => VOWELS.includes(c.toLowerCase());

// --- Aspect detection ---
const PERFECTIVE_PREFIXES = [
  "вы", "по", "на", "за", "про", "пере", "при", "у", "от", "под", "над",
  "из", "ис", "раз", "рас", "с", "со", "о", "об", "обо", "до", "воз", "вос",
];
function detectAspect(inf: string): "imperfective" | "perfective" {
  const stem = inf.replace(/(ться|ть|чь|ти)$/u, "");
  // -ыва-/-ива- suffix strongly indicates imperfective
  if (/(ыва|ива)$/u.test(stem)) return "imperfective";
  if (/(ва)$/u.test(stem) && stem.length > 4) return "imperfective";
  // Verbs with perfectivizing prefix usually perfective (heuristic)
  for (const p of PERFECTIVE_PREFIXES) {
    if (inf.startsWith(p) && inf.length > p.length + 3) {
      // some prefixed verbs are still imperfective; this is a heuristic
      return "perfective";
    }
  }
  return "imperfective";
}

// --- Irregulars ---
const IRREGULAR: Record<string, Conjugation> = {
  "быть": {
    infinitive: "быть", aspect: "imperfective",
    present: { ya: "буду", ty: "будешь", on: "будет", my: "будем", vy: "будете", oni: "будут" },
    past: { m: "был", f: "была", n: "было", pl: "были" },
    imperative: { sg: "будь", pl: "будьте" },
    note: "Present tense forms are listed as future ('будет' etc.); the actual present is the zero copula (есть rarely used).",
  },
  "идти": {
    infinitive: "идти", aspect: "imperfective",
    present: { ya: "иду", ty: "идёшь", on: "идёт", my: "идём", vy: "идёте", oni: "идут" },
    past: { m: "шёл", f: "шла", n: "шло", pl: "шли" },
    imperative: { sg: "иди", pl: "идите" },
  },
  "есть": {
    infinitive: "есть", aspect: "imperfective",
    present: { ya: "ем", ty: "ешь", on: "ест", my: "едим", vy: "едите", oni: "едят" },
    past: { m: "ел", f: "ела", n: "ело", pl: "ели" },
    imperative: { sg: "ешь", pl: "ешьте" },
  },
  "дать": {
    infinitive: "дать", aspect: "perfective",
    present: { ya: "дам", ty: "дашь", on: "даст", my: "дадим", vy: "дадите", oni: "дадут" },
    past: { m: "дал", f: "дала", n: "дало", pl: "дали" },
    imperative: { sg: "дай", pl: "дайте" },
  },
  "хотеть": {
    infinitive: "хотеть", aspect: "imperfective",
    present: { ya: "хочу", ty: "хочешь", on: "хочет", my: "хотим", vy: "хотите", oni: "хотят" },
    past: { m: "хотел", f: "хотела", n: "хотело", pl: "хотели" },
    imperative: { sg: "хоти", pl: "хотите" },
  },
  "мочь": {
    infinitive: "мочь", aspect: "imperfective",
    present: { ya: "могу", ty: "можешь", on: "может", my: "можем", vy: "можете", oni: "могут" },
    past: { m: "мог", f: "могла", n: "могло", pl: "могли" },
    imperative: { sg: "моги", pl: "могите" },
  },
  "бежать": {
    infinitive: "бежать", aspect: "imperfective",
    present: { ya: "бегу", ty: "бежишь", on: "бежит", my: "бежим", vy: "бежите", oni: "бегут" },
    past: { m: "бежал", f: "бежала", n: "бежало", pl: "бежали" },
    imperative: { sg: "беги", pl: "бегите" },
  },
  "ехать": {
    infinitive: "ехать", aspect: "imperfective",
    present: { ya: "еду", ty: "едешь", on: "едет", my: "едем", vy: "едете", oni: "едут" },
    past: { m: "ехал", f: "ехала", n: "ехало", pl: "ехали" },
    imperative: { sg: "поезжай", pl: "поезжайте" },
  },
  "жить": {
    infinitive: "жить", aspect: "imperfective",
    present: { ya: "живу", ty: "живёшь", on: "живёт", my: "живём", vy: "живёте", oni: "живут" },
    past: { m: "жил", f: "жила", n: "жило", pl: "жили" },
    imperative: { sg: "живи", pl: "живите" },
  },
  "пить": {
    infinitive: "пить", aspect: "imperfective",
    present: { ya: "пью", ty: "пьёшь", on: "пьёт", my: "пьём", vy: "пьёте", oni: "пьют" },
    past: { m: "пил", f: "пила", n: "пило", pl: "пили" },
    imperative: { sg: "пей", pl: "пейте" },
  },
  "брать": {
    infinitive: "брать", aspect: "imperfective",
    present: { ya: "беру", ty: "берёшь", on: "берёт", my: "берём", vy: "берёте", oni: "берут" },
    past: { m: "брал", f: "брала", n: "брало", pl: "брали" },
    imperative: { sg: "бери", pl: "берите" },
  },
  "взять": {
    infinitive: "взять", aspect: "perfective",
    present: { ya: "возьму", ty: "возьмёшь", on: "возьмёт", my: "возьмём", vy: "возьмёте", oni: "возьмут" },
    past: { m: "взял", f: "взяла", n: "взяло", pl: "взяли" },
    imperative: { sg: "возьми", pl: "возьмите" },
  },
  "звать": {
    infinitive: "звать", aspect: "imperfective",
    present: { ya: "зову", ty: "зовёшь", on: "зовёт", my: "зовём", vy: "зовёте", oni: "зовут" },
    past: { m: "звал", f: "звала", n: "звало", pl: "звали" },
    imperative: { sg: "зови", pl: "зовите" },
  },
  "ждать": {
    infinitive: "ждать", aspect: "imperfective",
    present: { ya: "жду", ty: "ждёшь", on: "ждёт", my: "ждём", vy: "ждёте", oni: "ждут" },
    past: { m: "ждал", f: "ждала", n: "ждало", pl: "ждали" },
    imperative: { sg: "жди", pl: "ждите" },
  },
  "спать": {
    infinitive: "спать", aspect: "imperfective",
    present: { ya: "сплю", ty: "спишь", on: "спит", my: "спим", vy: "спите", oni: "спят" },
    past: { m: "спал", f: "спала", n: "спало", pl: "спали" },
    imperative: { sg: "спи", pl: "спите" },
  },
  "писать": {
    infinitive: "писать", aspect: "imperfective",
    present: { ya: "пишу", ty: "пишешь", on: "пишет", my: "пишем", vy: "пишете", oni: "пишут" },
    past: { m: "писал", f: "писала", n: "писало", pl: "писали" },
    imperative: { sg: "пиши", pl: "пишите" },
  },
  "сказать": {
    infinitive: "сказать", aspect: "perfective",
    present: { ya: "скажу", ty: "скажешь", on: "скажет", my: "скажем", vy: "скажете", oni: "скажут" },
    past: { m: "сказал", f: "сказала", n: "сказало", pl: "сказали" },
    imperative: { sg: "скажи", pl: "скажите" },
  },
};

// --- Past tense ---
function pastTense(inf: string): Conjugation["past"] {
  const refl = inf.endsWith("ся") || inf.endsWith("сь");
  const base = refl ? inf.replace(/(ся|сь)$/u, "") : inf;

  // -чь verbs: handled mostly via irregulars; fallback default
  if (base.endsWith("чь")) {
    const stem = base.slice(0, -2);
    return withReflexive(refl, { m: stem, f: stem + "ла", n: stem + "ло", pl: stem + "ли" });
  }
  // -ти verbs (нести, идти, везти) — rough fallback
  if (base.endsWith("ти")) {
    const stem = base.slice(0, -2);
    return withReflexive(refl, { m: stem + "л", f: stem + "ла", n: stem + "ло", pl: stem + "ли" });
  }
  // -нуть verbs: usually keep -ну- in past
  if (base.endsWith("нуть")) {
    const stem = base.slice(0, -2); // "ну"
    return withReflexive(refl, { m: stem + "л", f: stem + "ла", n: stem + "ло", pl: stem + "ли" });
  }
  // Default: drop -ть, add л/ла/ло/ли
  if (base.endsWith("ть")) {
    const stem = base.slice(0, -2);
    return withReflexive(refl, { m: stem + "л", f: stem + "ла", n: stem + "ло", pl: stem + "ли" });
  }
  const stem = base;
  return withReflexive(refl, { m: stem + "л", f: stem + "ла", n: stem + "ло", pl: stem + "ли" });
}

function withReflexive(refl: boolean, past: Conjugation["past"]): Conjugation["past"] {
  if (!refl) return past;
  return {
    m: past.m + "ся",
    f: past.f + "сь",
    n: past.n + "сь",
    pl: past.pl + "сь",
  };
}

// --- Present/future tense ---
// Returns the six personal forms. Handles second conjugation (-ить) and
// common first-conjugation patterns (-ать/-ять/-еть/-овать/-евать/-нуть).
function presentTense(inf: string): { forms: Conjugation["present"]; stem1: string; conj: 1 | 2 } {
  const refl = inf.endsWith("ся") || inf.endsWith("сь");
  const base = refl ? inf.replace(/(ся|сь)$/u, "") : inf;

  // Second conjugation: -ить (with mutations skipped — gives plausible default)
  if (base.endsWith("ить") && !["брить", "стелить"].includes(base)) {
    const stem = base.slice(0, -3);
    const ya1 = mutateFirstPersonStem(stem) + "ю";
    const yaForm = needsU(stem) ? mutateFirstPersonStem(stem) + "у" : ya1;
    const oniForm = needsU(stem) ? stem + "ат" : stem + "ят";
    return {
      conj: 2,
      stem1: stem,
      forms: maybeReflexive(refl, {
        ya: yaForm,
        ty: stem + "ишь",
        on: stem + "ит",
        my: stem + "им",
        vy: stem + "ите",
        oni: oniForm,
      }),
    };
  }

  // -еть (mostly second conjugation: видеть, смотреть, сидеть...)
  if (base.endsWith("еть") && (base.length > 4)) {
    const stem = base.slice(0, -3);
    // Treat as 2nd conjugation; mutate 1sg
    const ya = mutateFirstPersonStem(stem) + "ю";
    return {
      conj: 2,
      stem1: stem,
      forms: maybeReflexive(refl, {
        ya: needsU(stem) ? mutateFirstPersonStem(stem) + "у" : ya,
        ty: stem + "ишь",
        on: stem + "ит",
        my: stem + "им",
        vy: stem + "ите",
        oni: needsU(stem) ? stem + "ат" : stem + "ят",
      }),
    };
  }

  // -овать / -евать → stem-ую/уешь
  if (base.endsWith("овать") || base.endsWith("евать")) {
    const stem = base.slice(0, -5) + (base.endsWith("евать") ? "ю" : "у");
    return {
      conj: 1,
      stem1: stem,
      forms: maybeReflexive(refl, {
        ya: stem + "ю",
        ty: stem + "ешь",
        on: stem + "ет",
        my: stem + "ем",
        vy: stem + "ете",
        oni: stem + "ют",
      }),
    };
  }

  // -нуть → ну-/нёш-
  if (base.endsWith("нуть")) {
    const stem = base.slice(0, -3); // includes "н"
    return {
      conj: 1,
      stem1: stem,
      forms: maybeReflexive(refl, {
        ya: stem + "у",
        ty: stem + "ёшь",
        on: stem + "ёт",
        my: stem + "ём",
        vy: stem + "ёте",
        oni: stem + "ут",
      }),
    };
  }

  // -ать / -ять → 1st conjugation default (читать → читаю)
  if (base.endsWith("ать") || base.endsWith("ять")) {
    const stem = base.slice(0, -2); // includes "а" or "я"
    return {
      conj: 1,
      stem1: stem,
      forms: maybeReflexive(refl, {
        ya: stem + "ю",
        ty: stem + "ешь",
        on: stem + "ет",
        my: stem + "ем",
        vy: stem + "ете",
        oni: stem + "ют",
      }),
    };
  }

  // Fallback (-ть): treat as 1st conjugation
  const stem = base.endsWith("ть") ? base.slice(0, -2) : base;
  return {
    conj: 1,
    stem1: stem,
    forms: maybeReflexive(refl, {
      ya: stem + "ю",
      ty: stem + "ешь",
      on: stem + "ет",
      my: stem + "ем",
      vy: stem + "ете",
      oni: stem + "ют",
    }),
  };
}

function maybeReflexive(refl: boolean, p: Conjugation["present"]): Conjugation["present"] {
  if (!refl) return p;
  const add = (s: string) => s + (isVowel(s.slice(-1)) ? "сь" : "ся");
  return { ya: add(p.ya), ty: add(p.ty), on: add(p.on), my: add(p.my), vy: add(p.vy), oni: add(p.oni) };
}

// After hushers (ж ч ш щ), 1sg/3pl use -у/-ат instead of -ю/-ят
function needsU(stem: string): boolean {
  const last = stem.slice(-1);
  return "жчшщ".includes(last);
}

// Approximate 1sg consonant mutation for 2nd conjugation
function mutateFirstPersonStem(stem: string): string {
  const last = stem.slice(-1);
  const head = stem.slice(0, -1);
  const map: Record<string, string> = {
    "д": "ж", "т": "ч", "з": "ж", "с": "ш", "ст": "щ", "ск": "щ",
    "б": "бл", "п": "пл", "в": "вл", "ф": "фл", "м": "мл",
  };
  // two-char digraphs
  const tail2 = stem.slice(-2);
  if (map[tail2]) return stem.slice(0, -2) + map[tail2];
  if (map[last]) return head + map[last];
  return stem;
}

// --- Imperative ---
function imperative(stemForms: Conjugation["present"], stem1: string, refl: boolean): Conjugation["imperative"] {
  // Use 3pl form, strip ending to get present stem
  let pres = stemForms.oni.replace(/(ся|сь)$/u, "");
  pres = pres.replace(/(ут|ют|ат|ят)$/u, "");
  // If stem ends in vowel → -й/-йте; else if stress on ending or cluster → -и/-ите; else -ь/-ьте
  let sg: string;
  if (pres.length === 0) pres = stem1;
  const last = pres.slice(-1);
  if (isVowel(last)) sg = pres + "й";
  else sg = pres + "и";
  const pl = sg + "те";
  if (refl) {
    return {
      sg: sg + (isVowel(sg.slice(-1)) ? "сь" : "ся"),
      pl: pl + "сь",
    };
  }
  return { sg, pl };
}

// --- Main entry ---
export function conjugate(infinitive: string): Conjugation {
  const inf = infinitive.trim().toLowerCase();
  if (!inf) throw new Error("Empty infinitive");
  const hit = IRREGULAR[inf];
  if (hit) return hit;

  const refl = inf.endsWith("ся") || inf.endsWith("сь");
  const aspect = detectAspect(inf);
  const { forms, stem1 } = presentTense(inf);
  const past = pastTense(inf);
  const imp = imperative(forms, stem1, refl);

  return {
    infinitive: inf,
    aspect,
    present: forms,
    past,
    imperative: imp,
    note: aspect === "perfective"
      ? "Forms under 'present' are simple-future (perfective verbs have no present)."
      : "Rule-based output — may not reflect every irregular stem change.",
  };
}
