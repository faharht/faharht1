"""Generate the 10 missing grammar packs as TypeScript modules."""
import json
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, "/tmp")
from lovable_ai import call_ai_structured

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "data" / "grammar"
MODEL = "google/gemini-3-flash-preview"

TOPICS = {
    "a1-part-2": ("Noun gender & plurals", "Russian noun gender (masc/fem/neuter) by ending, regular plural endings (-ы/-и, -а/-я), and possessive pronouns (мой/моя/моё/мои) that agree with gender."),
    "a1-part-4": ("Prepositions of place", "Locations with в/на + prepositional case (в школе, на работе), and motion куда vs где (в школу vs в школе)."),
    "a2-part-2": ("Accusative & modal verbs", "Accusative case for direct objects (animate vs inanimate, masculine -> -а for animates, feminine -> -у), and modal expressions: хотеть, мочь, должен, нужно/надо + infinitive."),
    "a2-part-4": ("Dative for feelings", "Impersonal dative constructions: мне холодно, ему скучно, ей нравится, нам нужно. Dative pronouns and how the subject becomes the dative experiencer."),
    "b1-part-1": ("Opinions & reflexives", "Expressing opinion (я думаю, что..; мне кажется; по-моему; считать), and reflexive verbs in -ся (учиться, заниматься, нравиться, бояться)."),
    "b1-part-3": ("Instrumental case", "Instrumental case basics: with кем/чем, after с (с другом), professions and pursuits (работать врачом, заниматься спортом), and instrument of action (писать ручкой)."),
    "b1-part-4": ("Comparatives & superlatives", "Comparative forms (больше, лучше, интереснее) with чем or genitive, and superlatives with самый and наиболее."),
    "b2-part-1": ("Active & passive participles", "Forming and using participles: active present (читающий), active past (прочитавший), passive past (прочитанный), short-form passive (прочитан). When to prefer participles over который clauses."),
    "b2-part-2": ("Gerunds (деепричастия)", "Imperfective gerunds (читая, говоря) for simultaneous action, perfective gerunds (прочитав, сказав) for prior completed action. Same-subject rule and punctuation."),
    "b2-part-4": ("Indirect speech", "Reported statements with что, reported yes/no questions with ли, reported wh-questions, and tense behavior (Russian keeps the original tense — no backshift)."),
}

# b2-part-3 (idioms) — register notes, no new rules.
IDIOM_PACK = {
    "listId": "b2-part-3",
    "intro": "Idioms aren't grammar — they're vocabulary with register. Match the idiom to the situation: a colloquial phrase in a job interview lands as badly as a textbook formula at a kitchen table.",
    "notes": [
        {
            "title": "Read the register before you reach for an idiom",
            "body": "Russian idioms fall on a spectrum from **bookish (книжный)** to **neutral** to **разговорный** (colloquial) to **просторечный / сленг** (rough or slang). Native speakers tag these instantly; learners often don't. When in doubt, prefer the neutral paraphrase.",
            "examples": [
                {"ru": "Это, как говорится, палка о двух концах.", "en": "It's, as they say, a double-edged sword.", "note": "neutral / mildly bookish"},
                {"ru": "Да забей ты на это!", "en": "Just forget about it!", "note": "very colloquial — friends only"},
            ],
        },
        {
            "title": "Idioms don't translate word-for-word",
            "body": "Treat each idiom as a single lexical unit. Don't change the verb's aspect, don't reorder the words, and don't substitute synonyms — the phrase loses its meaning or sounds odd.",
            "examples": [
                {"ru": "Он работает спустя рукава.", "en": "He works carelessly / half-heartedly.", "note": "lit. 'with sleeves rolled down'"},
                {"ru": "Вешать лапшу на уши.", "en": "To pull the wool over someone's eyes.", "note": "lit. 'hang noodles on ears'"},
            ],
        },
        {
            "title": "Common formulas worth memorising",
            "body": "A handful of fixed expressions show up constantly in spoken Russian and act like grammatical glue: **дело в том, что...** (the thing is...), **на самом деле** (actually), **как ни странно** (oddly enough), **тем не менее** (nevertheless).",
        },
    ],
}

SCHEMA = {
    "type": "object",
    "properties": {
        "intro": {"type": "string", "description": "1-2 sentence overview. Markdown-lite: **bold** and _italic_ only."},
        "notes": {
            "type": "array",
            "minItems": 2,
            "maxItems": 4,
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "body": {"type": "string", "description": "1-3 short paragraphs. Use **bold** and _italic_ only — no other markdown."},
                    "examples": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "ru": {"type": "string"},
                                "en": {"type": "string"},
                                "note": {"type": "string"},
                            },
                            "required": ["ru", "en"],
                        },
                    },
                },
                "required": ["title", "body"],
            },
        },
    },
    "required": ["notes"],
}

SYSTEM = (
    "You write concise, accurate grammar notes for English-speaking learners of Russian. "
    "Output ONLY through the tool. Body text supports ONLY **bold** and _italic_ — no headings, "
    "no lists, no code fences. Russian examples are natural, level-appropriate, and demonstrate the rule. "
    "Keep each note tight: a learner should grasp it in under a minute."
)


def var_name(list_id):
    parts = re.split(r"[-_]", list_id)
    return parts[0] + "".join(p[:1].upper() + p[1:] for p in parts[1:])


def to_ts(pack):
    return (
        'import type { GrammarPack } from "@/lib/trainer/grammar";\n\n'
        f"export const {var_name(pack['listId'])}: GrammarPack = "
        + json.dumps(pack, ensure_ascii=False, indent=2)
        + ";\n"
    )


def generate(list_id, title, focus):
    prompt = (
        f"Write a grammar pack for the list '{list_id}'.\n"
        f"Focus: {title}.\n"
        f"Details: {focus}\n\n"
        "Produce a short intro (1-2 sentences) and 2-4 notes. Each note: a clear title, "
        "a tight body (1-3 paragraphs, **bold**/_italic_ only), and 2-4 Russian/English example "
        "pairs (optional note when register or nuance helps). Examples must be correct, natural, "
        "and demonstrate the rule directly."
    )
    for attempt in range(8):
        try:
            data = call_ai_structured(
                prompt,
                tool_name="emit_grammar_pack",
                tool_description="Emit a structured grammar pack.",
                parameters=SCHEMA,
                model=MODEL,
                system=SYSTEM,
            )
        except Exception as e:
            msg = str(e)
            wait = 30 if "Rate limited" in msg or "429" in msg else 4
            print(f"  attempt {attempt+1} error: {e} (sleep {wait}s)")
            time.sleep(wait)
            continue
        pack = {
            "listId": list_id,
            "intro": (data.get("intro") or "").strip(),
            "notes": [],
        }
        for n in data.get("notes", []):
            if not n.get("title") or not n.get("body"):
                continue
            note = {"title": n["title"].strip(), "body": n["body"].strip()}
            exs = []
            for e in n.get("examples", []) or []:
                if e.get("ru") and e.get("en"):
                    item = {"ru": e["ru"].strip(), "en": e["en"].strip()}
                    if e.get("note"):
                        item["note"] = e["note"].strip()
                    exs.append(item)
            if exs:
                note["examples"] = exs
            pack["notes"].append(note)
        if len(pack["notes"]) >= 2:
            return pack
        print(f"  attempt {attempt+1}: too few notes, retrying")
        time.sleep(2)
    raise RuntimeError(f"Could not generate pack for {list_id}")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    # b2-part-3 is hand-authored.
    (OUT / "b2-part-3.ts").write_text(to_ts(IDIOM_PACK))
    print("wrote b2-part-3.ts (hand-authored)")
    for list_id, (title, focus) in TOPICS.items():
        target = OUT / f"{list_id}.ts"
        if target.exists():
            print(f"[{list_id}] exists, skipping")
            continue
        print(f"[{list_id}] generating...")
        pack = generate(list_id, title, focus)
        target.write_text(to_ts(pack))
        print(f"[{list_id}] wrote {len(pack['notes'])} notes")
        time.sleep(1)


if __name__ == "__main__":
    main()
