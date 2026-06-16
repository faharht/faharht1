import type { GrammarPack } from "@/lib/trainer/grammar";

export const b2Part4: GrammarPack = {
  "listId": "b2-part-4",
  "intro": "Reporting speech in Russian is more straightforward than in English because **tenses do not change**. These notes cover how to use conjunctions like _что_ and _ли_ to report statements and questions.",
  "notes": [
    {
      "title": "The 'No Backshift' Rule",
      "body": "Unlike English, Russian does not move tenses \"one step back\" when reporting speech. If the original speaker used the present tense, the reported speech stays in the **present tense**, even if the reporting verb is in the past.",
      "examples": [
        {
          "ru": "Он сказал, что он работает. (lit. He said that he is working.)​尊协助",
          "en": "He said that he was working."
        },
        {
          "ru": "Она думала, что он придёт. (lit. She thought that he will come)​",
          "en": "She thought he would come."
        }
      ]
    },
    {
      "title": "Reporting Statements with Что",
      "body": "To report a statement, use the conjunction **что**. If you are reporting someone's words or thoughts, simply connect the main clause to the reported clause with **что**. Remember that a comma is always required before **что**.",
      "examples": [
        {
          "ru": "Они сказали, что они готовы.",
          "en": "They said that they were ready."
        },
        {
          "ru": "Я знал, что она лжёт.",
          "en": "I knew that she was lying."
        }
      ]
    },
    {
      "title": "Yes/No Questions with Ли",
      "body": "To report a \"yes/no\" question, Russian uses the particle **ли**. Place **ли** immediately after the specific word being questioned (usually the verb). In this construction, do not use the word _что_. It functions like the English _if_ or _whether_.",
      "examples": [
        {
          "ru": "Я спросил, дома ли он.",
          "en": "I asked whether he was at home."
        },
        {
          "ru": "Она спросила, знаю ли я ответ.",
          "en": "She asked if I knew the answer."
        }
      ]
    },
    {
      "title": "Reporting WH-Questions",
      "body": "When reporting questions that use words like _who_, _where_, or _why_, simply use that question word as the connector. The word order usually remains like a normal statement, and the tense remains exactly as it was in the original question.",
      "examples": [
        {
          "ru": "Я спросил, где он живёт.",
          "en": "I asked where he lived."
        },
        {
          "ru": "Он не сказал, когда он вернётся.",
          "en": "He didn't say when he would return."
        }
      ]
    }
  ]
};
