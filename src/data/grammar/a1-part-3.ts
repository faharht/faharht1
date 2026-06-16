import type { GrammarPack } from "@/lib/trainer/grammar";

export const a1Part3: GrammarPack = {
  listId: "a1-part-3",
  intro: "Russian present-tense verbs fall into two conjugation patterns, usually called the _e-conjugation_ and the _i-conjugation_.",
  notes: [
    {
      title: "First conjugation (-е-)",
      body: "Most verbs ending in **-ать / -ять** follow this pattern. Endings: **-ю, -ешь, -ет, -ем, -ете, -ют**.",
      examples: [
        { ru: "я читаю, ты читаешь, он читает", en: "I read, you read, he reads" },
        { ru: "мы читаем, вы читаете, они читают", en: "we / you (pl.) / they read" },
      ],
    },
    {
      title: "Second conjugation (-и-)",
      body: "Most verbs ending in **-ить** follow this pattern. Endings: **-ю/-у, -ишь, -ит, -им, -ите, -ят/-ат**.",
      examples: [
        { ru: "я говорю, ты говоришь, он говорит", en: "I speak, you speak, he speaks" },
        { ru: "мы говорим, вы говорите, они говорят", en: "we / you (pl.) / they speak" },
      ],
    },
    {
      title: "Consonant mutation in я-form",
      body: "Some second-conjugation verbs mutate their final consonant in the **я** form only: _любить → люблю_, _видеть → вижу_, _ходить → хожу_.",
    },
  ],
};
