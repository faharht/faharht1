import type { GrammarPack } from "@/lib/trainer/grammar";

export const top300Verbs: GrammarPack = {
  listId: "top-300-verbs",
  intro: "Almost every Russian verb comes in an **aspect pair** — one imperfective, one perfective. Learning verbs in pairs is the single biggest unlock at this level.",
  notes: [
    {
      title: "Imperfective vs perfective",
      body: "**Imperfective** describes the process, repetition, or ongoing action. **Perfective** describes a single completed result. Most dictionary entries list both.",
      examples: [
        { ru: "писать / написать", en: "to write (process) / to write (finish)" },
        { ru: "читать / прочитать", en: "to read / to read through" },
        { ru: "делать / сделать", en: "to do / to get done" },
      ],
    },
    {
      title: "How pairs are formed",
      body: "Common patterns: **prefix added** (_писать → написать_), **suffix change** (_решать → решить_), or **entirely different roots** (_говорить / сказать_, _брать / взять_).",
    },
    {
      title: "Aspect by tense",
      body: "Present tense: only imperfective. Past and future: both aspects, and the choice changes the meaning. Imperative and infinitive: both, depending on whether you mean _start doing_ or _get it done_.",
      examples: [
        { ru: "Не открывай окно!", en: "Don't open the window. (imperfective — general ban)" },
        { ru: "Не открой окно!", en: "Don't open the window! (perfective — this once)" },
      ],
    },
  ],
};
