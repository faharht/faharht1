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
import { a1Part2 } from "@/data/grammar/a1-part-2";
import { a1Part3 } from "@/data/grammar/a1-part-3";
import { a1Part4 } from "@/data/grammar/a1-part-4";
import { a2Part1 } from "@/data/grammar/a2-part-1";
import { a2Part2 } from "@/data/grammar/a2-part-2";
import { a2Part3 } from "@/data/grammar/a2-part-3";
import { a2Part4 } from "@/data/grammar/a2-part-4";
import { b1Part1 } from "@/data/grammar/b1-part-1";
import { b1Part2 } from "@/data/grammar/b1-part-2";
import { b1Part3 } from "@/data/grammar/b1-part-3";
import { b1Part4 } from "@/data/grammar/b1-part-4";
import { b2Part1 } from "@/data/grammar/b2-part-1";
import { b2Part2 } from "@/data/grammar/b2-part-2";
import { b2Part3 } from "@/data/grammar/b2-part-3";
import { b2Part4 } from "@/data/grammar/b2-part-4";
import { top300Verbs } from "@/data/grammar/top-300-verbs";

const PACKS: Record<string, GrammarPack> = {
  "a1-part-1": a1Part1,
  "a1-part-2": a1Part2,
  "a1-part-3": a1Part3,
  "a1-part-4": a1Part4,
  "a2-part-1": a2Part1,
  "a2-part-2": a2Part2,
  "a2-part-3": a2Part3,
  "a2-part-4": a2Part4,
  "b1-part-1": b1Part1,
  "b1-part-2": b1Part2,
  "b1-part-3": b1Part3,
  "b1-part-4": b1Part4,
  "b2-part-1": b2Part1,
  "b2-part-2": b2Part2,
  "b2-part-3": b2Part3,
  "b2-part-4": b2Part4,
  "top-300-verbs": top300Verbs,
};


export function getGrammar(listId: string): GrammarPack | undefined {
  return PACKS[listId];
}
