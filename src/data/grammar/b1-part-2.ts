import type { GrammarPack } from "@/lib/trainer/grammar";

export const b1Part2: GrammarPack = {
  listId: "b1-part-2",
  intro: "Russian conditionals are surprisingly simple: one tiny particle does most of the work.",
  notes: [
    {
      title: "The бы construction",
      body: "Use **past-tense verb + бы** for both _would_ and _would have_. Time is set by context, not grammar.",
      examples: [
        { ru: "Я хотел бы кофе.", en: "I'd like a coffee." },
        { ru: "Если бы я знал, я бы пришёл.", en: "If I had known, I would have come." },
      ],
    },
    {
      title: "Real vs hypothetical conditions",
      body: "**Real** conditions use **если** + indicative (no _бы_). **Hypothetical / counterfactual** conditions use **если бы** + past, with **бы** also in the main clause.",
      examples: [
        { ru: "Если будет время, я позвоню.", en: "If I have time, I'll call." },
        { ru: "Если бы было время, я бы позвонил.", en: "If I had time, I'd call." },
      ],
    },
  ],
};
