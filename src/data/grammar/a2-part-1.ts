import type { GrammarPack } from "@/lib/trainer/grammar";

export const a2Part1: GrammarPack = {
  listId: "a2-part-1",
  intro: "Russian past tense is built from gender, not person — what matters is the subject's gender (or whether it's plural).",
  notes: [
    {
      title: "Forming the past tense",
      body: "Drop the **-ть** of the infinitive and add **-л** (masculine), **-ла** (feminine), **-ло** (neuter), or **-ли** (plural / formal _вы_).",
      examples: [
        { ru: "Я читал книгу.", en: "I (m.) was reading a book." },
        { ru: "Я читала книгу.", en: "I (f.) was reading a book." },
        { ru: "Они читали книгу.", en: "They were reading a book." },
      ],
    },
    {
      title: "Aspect colours the meaning",
      body: "**Imperfective** past = ongoing or repeated. **Perfective** past = a completed result. The same English sentence often has two Russian translations.",
      examples: [
        { ru: "Я читал эту книгу.", en: "I was reading / used to read this book." },
        { ru: "Я прочитал эту книгу.", en: "I (have) finished reading this book." },
      ],
    },
  ],
};
