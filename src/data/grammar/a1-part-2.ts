import type { GrammarPack } from "@/lib/trainer/grammar";

export const a1Part2: GrammarPack = {
  "listId": "a1-part-2",
  "intro": "Learning to identify **noun gender** is the first step to building correct sentences in Russian. These rules determine how **adjectives**, **pronouns**, and **plural forms** behave.",
  "notes": [
    {
      "title": "The Three Genders",
      "body": "Every Russian noun has a gender: **masculine**, **feminine**, or **neuter**. You can usually tell the gender by looking at the last letter of the word in its basic form. **Masculine** nouns end in a consonant or _-й_. **Feminine** nouns end in _-а_ or _-я_. **Neuter** nouns end in _-о_ or _-е_.",
      "examples": [
        {
          "ru": "Это стол и книга.挑战 (стол is masc, книга is fem)",
          "en": "This is a table and a book."
        },
        {
          "ru": "Где моё кофе? (кофе is neuter)",
          "en": "Where is my coffee?"
        },
        {
          "ru": "Яблоко и музей. (яблоко is neuter, музей is masc)",
          "en": "An apple and a museum."
        }
      ]
    },
    {
      "title": "Possessive Pronouns",
      "body": "To say _my_, you must match the word to the gender of the noun it describes. Use **мой** for masculine, **моя** for feminine, and **моё** for neuter. When talking about multiple things, use **мои** regardless of the original gender.",
      "examples": [
        {
          "ru": "Мой брат и моя сестра.",
          "en": "My brother and my sister."
        },
        {
          "ru": "Это моё окно.",
          "en": "This is my window."
        },
        {
          "ru": "Это мои книги.",
          "en": "These are my books."
        }
      ]
    },
    {
      "title": "Basic Plurals",
      "body": "Most nouns become plural by adding **-ы** or **-и**. Masculine nouns ending in a consonant add **-ы**, while feminine nouns change _-а_ to **-ы**. If the word ends in _-й_, _-ь_, or follows the **7-letter rule** (after к, г, х, ш, щ, ж, ч), use **-и** instead. Neuter nouns are unique: _-о_ changes to **-а**, and _-е_ changes to **-я**.",
      "examples": [
        {
          "ru": "Газеты и карты. (singular: газета, карта)",
          "en": "Newspapers and maps."
        },
        {
          "ru": "Парки и музеи. (singular: парк, музей)",
          "en": "Parks and museums."
        },
        {
          "ru": "Окна и слова. (singular: окно, слово)",
          "en": "Windows and words."
        }
      ]
    }
  ]
};
