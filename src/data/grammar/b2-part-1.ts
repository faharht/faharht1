import type { GrammarPack } from "@/lib/trainer/grammar";

export const b2Part1: GrammarPack = {
  "listId": "b2-part-1",
  "intro": "Participles function as verbal adjectives, allowing you to pack complex information into a single word. They vary based on **tense**, **voice**, and whether the action is **active** or **passive**.",
  "notes": [
    {
      "title": "Active Participles: Present and Past",
      "body": "Active participles describe someone doing an action. To form the **present** (doing), take the _3rd person plural_ form and replace **-т** with **-щий**. To form the **past** (did), take the _past tense_ stem and add **-вший**. Use these when the noun is the subject of the action.",
      "examples": [
        {
          "ru": "Женщина, сидящая у окна, — моя сестра.",
          "en": "The woman sitting by the window is my sister."
        }
      ]
    },
    {
      "title": "Passive Past Participles: Long and Short",
      "body": "Passive past participles (PPP) describe an action done to an object. They are formed from _perfective verbs_ by adding suffixes like **-нн-**, **-енн-**, or **-т-**. These function like full adjectives. For a more formal, \"reportage\" style, use the **short form** (ending in **-н**, **-на**, **-но**, **-ны**), which functions like a predicate.",
      "examples": [
        {
          "ru": "Книга, написанная им, стала бестселлером.\"},{en:",
          "en": "The book written by him became a bestseller."
        }
      ]
    },
    {
      "title": "Participles vs. \"Который\" Clauses",
      "body": "While **который** clauses are standard in speech, participles are essential for formal writing, journalism, and literature. Participles make the sentence more concise by removing the need for a relative pronoun and a conjugated verb. Stick to **который** in casual conversation, but use participles when you want to sound **academic** or **professional**.",
      "examples": [
        {
          "ru": "Студенты, закончившие тест, могут идти.\"},{en:",
          "en": "The students who finished the test can leave."
        }
      ]
    }
  ]
};
