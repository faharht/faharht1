import type { Sentence } from "./types";

// Glob-import all sentence JSON files (built at compile time).
const modules = import.meta.glob<{ default: Sentence[] }>(
  "../../data/sentences/*.json",
  { eager: true },
);

const map = new Map<string, Sentence[]>();
for (const [path, mod] of Object.entries(modules)) {
  const id = path.replace(/^.*\/([^/]+)\.json$/, "$1");
  map.set(id, mod.default);
}

export function getSentences(listId: string): Sentence[] {
  return map.get(listId) ?? [];
}

export function hasSentences(listId: string): boolean {
  return map.has(listId) && (map.get(listId)?.length ?? 0) > 0;
}
