import type { GrammarPack } from "@/lib/trainer/grammar";

export const b2Part2: GrammarPack = {
  "listId": "b2-part-2",
  "intro": "**Gerunds** (деепричастия) function as verbal adverbs that describe how or when the main action in a sentence occurs. They are primarily used in written or formal Russian to connect two actions performed by the _same subject_.",
  "notes": [
    {
      "title": "Imperfective Gerunds: Simultaneous Action",
      "body": "Imperfective gerunds describe an action that happens **at the same time** as the main verb. They are formed by taking the present tense third-person plural stem (e.g., **говор**-ят) and adding the suffix **-я** (or **-а** after sibilants). These gerunds can often be translated as **\"-ing\"** in English.",
      "examples": [
        {
          "ru": "Слушая музыку, я обычно убираю дом.",
          "en": "Listening to music, I usually clean the house.",
          "note": "Simultaneous actions."
        },
        {
          "ru": "Гуляя по парку, они говорили о будущем.",
          "en": "Walking through the park, they talked about the future."
        }
      ]
    },
    {
      "title": "Perfective Gerunds: Completed Action",
      "body": "Perfective gerunds denote an action that was **completed before** the main action started. Most are formed from the past tense masculine stem by replacing **-л** with the suffix **-в** or **-вши**. If the verb is reflexive, the suffix **-вшись** is used. These are typically translated as **\"having done\"** or **\"after doing.\"**",
      "examples": [
        {
          "ru": "Прочитав письмо, она заплакала.",
          "en": "Having read the letter, she burst into tears.",
          "note": "Completed prior action."
        },
        {
          "ru": "Вернувшись домой, он сразу лёг спать.",
          "en": "Having returned home, he immediately went to bed."
        }
      ]
    },
    {
      "title": "The Same-Subject Rule and Punctuation",
      "body": "In Russian, the gerund and the main verb **must refer to the same subject**. Using a gerund when the subject of the sentence changes is a common grammatical error. Additionally, a gerund or gerund phrase is **always set off by commas**, regardless of its position in the sentence.",
      "examples": [
        {
          "ru": "Зная ответ, ученик поднял руку.",
          "en": "Knowing the answer, the student raised his hand.",
          "note": "Correct: the student knows and the student raises his hand."
        },
        {
          "ru": "Открыв окно, я почувствовал сквозняк.",
          "en": "Opening the window, I felt a draft.",
          "note": "Incorrect would be 'Opening the window, the wind blew'."
        }
      ]
    }
  ]
};
