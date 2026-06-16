import type { GrammarPack } from "@/lib/trainer/grammar";

export const a2Part2: GrammarPack = {
  "listId": "a2-part-2",
  "intro": "Master the **Accusative case** for direct objects and express necessity or ability using **modal verbs**. This pack covers essential sentence structures for daily communication.",
  "notes": [
    {
      "title": "The Accusative Case (Direct Objects)",
      "body": "The Accusative case is used for the object of an action. For **feminine nouns**, change the ending _-а_ to **-у** and _-я_ to **-ю**. For **masculine nouns**, the ending depends on life: **inanimate** objects don't change, while **animate** (people and animals) nouns take the ending **-а** or **-я**.",
      "examples": [
        {
          "ru": "Я читаю книгу.",
          "en": "I'm reading a book."
        },
        {
          "ru": "Он видит друга.",
          "en": "He sees a friend."
        },
        {
          "ru": "Мы покупаем компьютер.",
          "en": "We are buying a computer."
        }
      ]
    },
    {
      "title": "Modal Verbs: хотеть and мочь",
      "body": "To express desire or ability, use **хотеть** (to want) or **мочь** (to be able to) followed by an **infinitive**. Note that _хотеть_ has a unique conjugation: it is _хочешь_ in the singular but _хотим_ in the plural. _Мочь_ also changes stems significantly, such as _я могу_ vs _ты можешь_.",
      "examples": [
        {
          "ru": "Я хочу пить кофе.",
          "en": "I want to drink coffee."
        },
        {
          "ru": "Ты можешь говорить по-русски?",
          "en": "Can you speak Russian?"
        },
        {
          "ru": "Они хотят смотреть фильм.",
          "en": "They want to watch a movie."
        }
      ]
    },
    {
      "title": "Necessity: должен and нужно",
      "body": "To express necessity, use **нужно** or **надо** (interchangeable) or the adjective **должен**. While _нужно_ is used with the **Dative case** (person needing), _должен_ acts like an adjective and must match the **gender** and **number** of the subject. All these are followed by an **infinitive**.",
      "examples": [
        {
          "ru": "Я должен работать.",
          "en": "I (masc.) must work."
        },
        {
          "ru": "Она должна ждать.",
          "en": "She must wait."
        },
        {
          "ru": "Нам нужно идти.",
          "en": "We need to go."
        }
      ]
    }
  ]
};
