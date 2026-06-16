import type { GrammarPack } from "@/lib/trainer/grammar";

export const a2Part3: GrammarPack = {
  listId: "a2-part-3",
  intro: "Russian has two ways to talk about the future, and they correspond directly to aspect.",
  notes: [
    {
      title: "Imperfective future: буду + infinitive",
      body: "Use this for ongoing, repeated, or open-ended future actions. Conjugate **быть**: _буду, будешь, будет, будем, будете, будут_, and add the imperfective infinitive.",
      examples: [
        { ru: "Завтра я буду работать.", en: "Tomorrow I'll be working." },
        { ru: "Мы будем жить в Москве.", en: "We will live in Moscow." },
      ],
    },
    {
      title: "Perfective future: just conjugate",
      body: "A perfective verb conjugated in the _present_ form actually means the future — a single completed action.",
      examples: [
        { ru: "Я прочитаю книгу.", en: "I will read (finish) the book." },
        { ru: "Он напишет письмо.", en: "He will write the letter." },
      ],
    },
  ],
};
