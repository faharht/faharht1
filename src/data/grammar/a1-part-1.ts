import type { GrammarPack } from "@/lib/trainer/grammar";

export const a1Part1: GrammarPack = {
  listId: "a1-part-1",
  intro: "Russian opens with two essentials: how to address someone, and how to skip the word _to be_ in the present tense.",
  notes: [
    {
      title: "ты vs вы — informal vs formal you",
      body: "Use **ты** with friends, family, and children. Use **вы** with strangers, elders, in service settings, and when addressing more than one person. When in doubt, start with **вы** — switching down to **ты** is a small social ritual.",
      examples: [
        { ru: "Как тебя зовут?", en: "What's your name?", note: "informal" },
        { ru: "Как вас зовут?", en: "What's your name?", note: "formal / plural" },
      ],
    },
    {
      title: "No present-tense \"to be\"",
      body: "Russian drops the verb _to be_ in the present. A noun simply equals a noun. In writing you may see a dash where English would put _is_.",
      examples: [
        { ru: "Я студент.", en: "I am a student." },
        { ru: "Москва — столица.", en: "Moscow is the capital." },
      ],
    },
    {
      title: "Personal pronouns",
      body: "**я** I · **ты** you (sing.) · **он / она / оно** he / she / it · **мы** we · **вы** you (pl./formal) · **они** they.",
    },
  ],
};
