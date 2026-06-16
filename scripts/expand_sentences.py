"""Expand each A1-B2 sentence list to TARGET items via Lovable AI Gateway.

Idempotent: re-running on a list already at >=TARGET is a no-op.
"""
import json
import os
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, "/tmp")
from lovable_ai import call_ai_structured  # noqa

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data" / "sentences"
TARGET = 150
BATCH = 20
MODEL = "google/gemini-3-flash-preview"

THEMES = {
    "a1-part-1": "Greetings, pronouns, simple states (быть-less present, ты/вы, я/ты/он/она/мы/вы/они, basic 'я студент' / 'это книга' patterns).",
    "a1-part-2": "Family, numbers 1-100, colors, days of the week, basic possession (мой/моя/моё/мои, у меня есть).",
    "a1-part-3": "Common verbs in the present tense (читать, писать, говорить, жить, работать, учиться, любить, знать, понимать, делать).",
    "a1-part-4": "Places, directions, basic yes/no & wh-questions (где? куда? откуда? сколько? в/на + prepositional, идти/ехать).",
    "a2-part-1": "Daily routine and past tense (-л/-ла/-ло/-ли), times of day, frequency adverbs (всегда, иногда, никогда).",
    "a2-part-2": "Food, ordering in a cafe, accusative case for direct objects, modal verbs (хотеть, мочь, должен, нужно).",
    "a2-part-3": "Travel and transport, future tense (буду + inf., perfective future), tickets, hotels, dates.",
    "a2-part-4": "Weather, clothing, feelings, dative for impersonal states (мне холодно, ему нравится).",
    "b1-part-1": "Opinions, feelings, complex thoughts (я думаю, что...; мне кажется; reflexive -ся verbs).",
    "b1-part-2": "Work, study, real and hypothetical conditionals (если / если бы), past+бы.",
    "b1-part-3": "Health, body, instrumental case (заниматься спортом, болеть гриппом), reflexive verbs.",
    "b1-part-4": "City life, comparisons (больше/лучше, самый), culture, public services.",
    "b2-part-1": "Society and current affairs, active and passive participles, formal register.",
    "b2-part-2": "News, environment, gerunds (деепричастия, читая / прочитав), passive constructions.",
    "b2-part-3": "Idioms and colloquial expressions, register notes (formal vs informal).",
    "b2-part-4": "Literature and narrative, indirect speech with что / ли, reported questions.",
}

LEVEL_GUIDE = {
    "a1": "Beginner (A1). Use very common, high-frequency vocabulary. Keep sentences 2-7 words. Mostly present tense. Avoid case forms beyond nominative/prepositional/accusative-for-animate. Simple, concrete, useful.",
    "a2": "Elementary (A2). 4-10 words. Past tense and basic future allowed. All six cases introduced gradually, but keep them natural and obvious. Topics: daily life.",
    "b1": "Intermediate (B1). 6-14 words. Use conjunctions (что, потому что, если, когда), all cases, aspect pairs, reflexives. Express opinion and reasons.",
    "b2": "Upper-intermediate (B2). 8-18 words. Participles, gerunds, complex syntax, formal vocabulary, idiomatic phrasing.",
}

SCHEMA = {
    "type": "object",
    "properties": {
        "sentences": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "ru": {"type": "string", "description": "Russian sentence, no stress marks."},
                    "ruStressed": {"type": "string", "description": "Same sentence with combining acute U+0301 after each stressed vowel."},
                    "translit": {"type": "string", "description": "Scientific-friendly Latin transliteration (Privet, zhivu, shkola). ASCII only."},
                    "en": {"type": "string", "description": "Natural English translation."},
                },
                "required": ["ru", "ruStressed", "translit", "en"],
            },
        }
    },
    "required": ["sentences"],
}

CYRILLIC = re.compile(r"[А-Яа-яЁё]")
ACUTE = "\u0301"


def is_valid(item, existing_ru):
    for k in ("ru", "ruStressed", "translit", "en"):
        v = item.get(k)
        if not isinstance(v, str) or not v.strip():
            return False
    ru = item["ru"].strip()
    if ru in existing_ru:
        return False
    if not CYRILLIC.search(ru):
        return False
    # ruStressed must contain at least one acute mark.
    if ACUTE not in item["ruStressed"]:
        return False
    # ruStressed Cyrillic letters (stripped of acute) should roughly match ru.
    norm = item["ruStressed"].replace(ACUTE, "")
    if norm.strip() != ru:
        # be lenient about punctuation/spacing differences
        if norm.replace(" ", "").strip(".,!?;:—-") != ru.replace(" ", "").strip(".,!?;:—-"):
            return False
    # translit must be ASCII.
    try:
        item["translit"].encode("ascii")
    except UnicodeEncodeError:
        return False
    return True


def expand_list(list_id):
    path = DATA / f"{list_id}.json"
    items = json.loads(path.read_text())
    if len(items) >= TARGET:
        print(f"[{list_id}] already at {len(items)}, skipping")
        return
    existing_ru = {it["ru"].strip() for it in items}
    samples = items[:5]
    level = list_id.split("-")[0]
    theme = THEMES[list_id]
    guide = LEVEL_GUIDE[level]

    system = (
        "You are a Russian-language curriculum author writing example sentences for a CEFR-leveled "
        "vocabulary trainer. Output ONLY through the provided tool. Every sentence must be natural, "
        "useful Russian, with correct grammar and accurate translations. Always include combining "
        "acute marks (U+0301) on stressed vowels in ruStressed; never use \u00b4 or apostrophes. "
        "Russian monosyllables and the letter ё do NOT take an acute mark. Translit must be ASCII."
    )

    needed = TARGET - len(items)
    print(f"[{list_id}] {len(items)} -> {TARGET}, need {needed}")
    next_n = len(items) + 1
    attempts = 0
    while needed > 0 and attempts < 40:
        attempts += 1
        ask = min(BATCH, needed + 3)
        avoid_sample = list(existing_ru)
        if len(avoid_sample) > 60:
            # show first 30 and last 30 for variety
            avoid_sample = list(existing_ru)[:30] + list(existing_ru)[-30:]
        prompt = (
            f"CEFR level: {level.upper()}. Guidance: {guide}\n\n"
            f"List theme: {theme}\n\n"
            f"Style anchors (match length, tone, translit style, en gloss style):\n"
            + json.dumps(samples, ensure_ascii=False, indent=2)
            + f"\n\nGenerate {ask} NEW sentences for this list. "
            "They must NOT duplicate or paraphrase any of these already-used Russian sentences:\n"
            + "\n".join(f"- {s}" for s in avoid_sample)
            + "\n\nVary topics within the theme. Avoid repeating subject pronouns. "
            "Mix declaratives, questions, and a few imperatives. Keep vocabulary level-appropriate."
        )

        try:
            data = call_ai_structured(
                prompt,
                tool_name="emit_sentences",
                tool_description="Emit a batch of Russian sentences with stress, transliteration, and English.",
                parameters=SCHEMA,
                model=MODEL,
                system=system,
            )
        except Exception as e:
            msg = str(e)
            wait = 30 if "Rate limited" in msg or "429" in msg else 3
            print(f"  attempt {attempts} error: {e} (sleeping {wait}s)")
            time.sleep(wait)
            continue


        new_items = []
        for raw in data.get("sentences", []):
            if not is_valid(raw, existing_ru):
                continue
            ru = raw["ru"].strip()
            existing_ru.add(ru)
            new_items.append({
                "id": f"{list_id}-{next_n}",
                "ru": ru,
                "ruStressed": raw["ruStressed"].strip(),
                "translit": raw["translit"].strip(),
                "en": raw["en"].strip(),
            })
            next_n += 1
            if len(new_items) >= needed:
                break

        if not new_items:
            print(f"  attempt {attempts}: 0 valid items returned")
            time.sleep(1)
            continue

        items.extend(new_items)
        needed -= len(new_items)
        print(f"  +{len(new_items)} (now {len(items)}, need {needed})")
        # persist incrementally
        path.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n")
        time.sleep(0.5)

    if needed > 0:
        print(f"[{list_id}] WARNING: stopped at {len(items)} (still need {needed})")
    else:
        print(f"[{list_id}] done at {len(items)}")


def main():
    targets = []
    for level in ("a1", "a2", "b1", "b2"):
        for part in range(1, 5):
            targets.append(f"{level}-part-{part}")
    only = set(sys.argv[1:])
    for lid in targets:
        if only and lid not in only:
            continue
        expand_list(lid)


if __name__ == "__main__":
    main()
