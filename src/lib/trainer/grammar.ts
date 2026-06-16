export interface GrammarExample {
  ru: string;
  en: string;
  note?: string;
}

export interface GrammarNote {
  title: string;
  // Markdown-lite: **bold** and _italic_ supported by renderInline().
  body: string;
  examples?: GrammarExample[];
}

export interface GrammarPack {
  listId: string;
  intro?: string;
  notes: GrammarNote[];
}

import { a1Part1 } from "@/data/grammar/a1-part-1";
import { a1Part3 } from "@/data/grammar/a1-part-3";
import { a2Part1 } from "@/data/grammar/a2-part-1";
import { a2Part3 } from "@/data/grammar/a2-part-3";
import { b1Part2 } from "@/data/grammar/b1-part-2";
import { top300Verbs } from "@/data/grammar/top-300-verbs";

const PACKS: Record<string, GrammarPack> = {
  "a1-part-1": a1Part1,
  "a1-part-3": a1Part3,
  "a2-part-1": a2Part1,
  "a2-part-3": a2Part3,
  "b1-part-2": b1Part2,
  "top-300-verbs": top300Verbs,
};

export function getGrammar(listId: string): GrammarPack | undefined {
  return PACKS[listId];
}
