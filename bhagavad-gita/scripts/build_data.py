#!/usr/bin/env python3
"""Build the site's JSON data from the open Bhagavad Gita dataset.

Source: https://github.com/gita/gita (the data behind bhagavadgita.io),
released into the public domain under the Unlicense.

Usage:
    git clone --depth 1 https://github.com/gita/gita.git /tmp/gita
    python3 scripts/build_data.py /tmp/gita/data

Writes, relative to the site folder:
    data/index.json              chapters + translator list
    data/chapters/<n>.json       verses of chapter n (Sanskrit, transliteration,
                                 word meanings, English + Hindi translations)
    data/commentary/<lang>-<n>.json   commentary for chapter n (loaded on demand)
"""

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
OUT = SITE / "data"

# Translators shipped with the site. The first one in each language is the default.
TRANSLATORS = {
    "en": [
        ("sivananda", "Swami Sivananda", "स्वामी शिवानन्द"),
        ("gambirananda", "Swami Gambirananda", "स्वामी गम्भीरानन्द"),
        ("adidevananda", "Swami Adidevananda", "स्वामी आदिदेवानन्द"),
        ("sankaranarayan", "Dr. S. Sankaranarayan", "डॉ. एस. शंकरनारायण"),
        ("purohit", "Shri Purohit Swami", "श्री पुरोहित स्वामी"),
    ],
    "hi": [
        ("ramsukhdas", "Swami Ramsukhdas", "स्वामी रामसुखदास"),
        ("tejomayananda", "Swami Tejomayananda", "स्वामी तेजोमयानन्द"),
    ],
}
COMMENTATORS = {
    "en": [("sivananda", "Swami Sivananda", "स्वामी शिवानन्द")],
    "hi": [("ramsukhdas", "Swami Ramsukhdas", "स्वामी रामसुखदास")],
}

PLACEHOLDER = re.compile(r"^(Hindi|English)\s+(Translation|Commentary)\s+By\b", re.I)
# "।।2.47।।", "2.47।।", "1।।", "।।1.4 --1.6।।" at the start of Hindi texts
HI_VERSE_PREFIX = re.compile(
    r"^[\s\u00a0]*(?:।।)?\s*\d+(?:\.\d+)?(?:\s*[-–—,]+\s*\d+(?:\.\d+)?)*\s*(?:।।|।)?[\s\u00a0]*"
)
EN_VERSE_PREFIX = re.compile(r"^\s*\d+\.\d+(?:\s*[-–—,]+\s*\d+(?:\.\d+)?)*\s*")
FOOTNOTE = re.compile(r"\s*\(टिप्पणी\s*प0?\s*[\d.]+\)")
SA_SPEAKER = re.compile(r"^((?:श्री\s?)?भगवानुवाच|(?:अर्जुन|सञ्जय|संजय|धृतराष्ट्र)\s?उवाच)\s*")


def tidy(text):
    """Normalise whitespace while keeping intentional line breaks."""
    text = (text or "").replace("\u00a0", " ").replace("\r", "")
    text = text.replace("।।", "॥")  # two single dandas -> proper double danda
    lines = [re.sub(r"[ \t]+", " ", ln).strip() for ln in text.split("\n")]
    return "\n".join(ln for ln in lines if ln)


def paragraphs(text):
    return [p for p in tidy(text).split("\n") if p]


def fix_sivananda(text):
    # In this dataset many commas in Swami Sivananda's text were turned into "?".
    text = re.sub(r"\?(?=\s*[a-z\u0900-\u097F(\"'‘“])", ",", text)
    # Restore the space lost after full stops ("inaction.Commentary").
    text = re.sub(r"([a-z)\]\"”’])\.([A-Z])", r"\1. \2", text)
    return text


def split_speaker(lines, marker):
    """Return (speaker, rest) when the first line is e.g. "अर्जुन उवाच" or "श्री भगवानुवाच"."""
    first = lines[0].strip() if lines else ""
    if first and (first.endswith(marker) or SA_SPEAKER.fullmatch(first)) and "।" not in first:
        return first, lines[1:]
    return None, lines


def sanskrit_lines(text):
    """Verse text split into lines; some source verses lost their line breaks."""
    text = tidy(text)
    # A single danda ends a half-verse: put the next half on its own line.
    text = re.sub(r"।(?=[^\s।\d])", "।\n", text)
    # "अर्जुन उवाचएवं ..." -> speaker on its own line.
    text = SA_SPEAKER.sub(r"\1\n", text, count=1)
    text = re.sub(r"(?<=\S)॥(?=\d)", " ॥", text)  # "सञ्जय॥1.1॥" -> "सञ्जय ॥1.1॥"
    return text.split("\n")


def parse_word_meanings(raw):
    pairs = []
    for part in re.split(r";\s*", tidy(raw).replace("\n", " ")):
        part = part.strip().rstrip(";")
        if not part:
            continue
        word, sep, meaning = part.partition("—")
        pairs.append([word.strip(), meaning.strip()] if sep else [part, ""])
    return pairs


def author_key(name, table):
    for lang, entries in table.items():
        for key, en_name, _ in entries:
            if en_name == name:
                return lang, key
    return None, None


def main(src):
    src = Path(src)
    chapters = json.loads((src / "chapters.json").read_text(encoding="utf-8"))
    verses = json.loads((src / "verse.json").read_text(encoding="utf-8"))
    translations = json.loads((src / "translation.json").read_text(encoding="utf-8"))
    commentary = json.loads((src / "commentary.json").read_text(encoding="utf-8"))

    verse_loc = {}  # verse id -> (chapter, verse)
    by_chapter = defaultdict(list)
    for v in sorted(verses, key=lambda x: x["id"]):
        ch, num = v["chapter_number"], v["verse_number"]
        verse_loc[v["id"]] = (ch, num)

        sa_speaker, sa_lines = split_speaker(sanskrit_lines(v["text"]), "उवाच")
        tr_speaker, tr_lines = split_speaker(tidy(v["transliteration"]).split("\n"), "uvācha")
        by_chapter[ch].append({
            "v": num,
            "sa": "\n".join(sa_lines),
            "sa_speaker": sa_speaker,
            "tr": "\n".join(tr_lines),
            "tr_speaker": tr_speaker,
            "wm": parse_word_meanings(v["word_meanings"]),
            "en": {},
            "hi": {},
        })

    index = {(c, row["v"]): row for c, rows in by_chapter.items() for row in rows}

    for t in translations:
        lang, key = author_key(t["authorName"], TRANSLATORS)
        if not key or PLACEHOLDER.match(t["description"].strip()):
            continue
        text = t["description"]
        if lang == "hi":
            text = FOOTNOTE.sub("", HI_VERSE_PREFIX.sub("", text, count=1))
        text = tidy(text)
        if key == "sivananda":
            text = fix_sivananda(text)
        if text:
            index[verse_loc[int(t["verse_id"])]][lang][key] = text

    comm = defaultdict(lambda: defaultdict(dict))  # (lang, ch) -> verse -> {author: body}
    for c in commentary:
        lang, key = author_key(c["authorName"], COMMENTATORS)
        if not key or PLACEHOLDER.match(c["description"].strip()):
            continue
        ch, num = verse_loc[int(c["verse_id"])]
        text = c["description"]
        if lang == "hi":
            body = {"paras": paragraphs(HI_VERSE_PREFIX.sub("", text, count=1))}
        else:
            text = fix_sivananda(tidy(EN_VERSE_PREFIX.sub("", text, count=1)))
            m = re.search(r"\.?\s*(No Commentary\.?|Commentary)\s*", text)
            if m:
                gloss, rest = text[: m.start()], ("" if m.group(1).startswith("No") else text[m.end():])
            else:
                gloss, rest = "", text
            body = {"gloss": gloss.strip(), "paras": paragraphs(rest)}
        if body.get("paras") or body.get("gloss"):
            comm[(lang, ch)][str(num)][key] = body

    # ---- write files -------------------------------------------------------
    (OUT / "chapters").mkdir(parents=True, exist_ok=True)
    (OUT / "commentary").mkdir(parents=True, exist_ok=True)

    def dump(path, obj):
        path.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    meta_chapters = []
    for c in sorted(chapters, key=lambda x: x["chapter_number"]):
        n = c["chapter_number"]
        meta_chapters.append({
            "n": n,
            "name_sa": c["name"],
            "name_en": c["name_translation"],
            "translit": c["name_transliterated"],
            "meaning_en": c["name_meaning"],
            "verses": len(by_chapter[n]),
            "summary_en": paragraphs(c["chapter_summary"]),
            "summary_hi": paragraphs(c["chapter_summary_hindi"]),
        })
        dump(OUT / "chapters" / f"{n}.json", {"chapter": n, "verses": by_chapter[n]})

    for (lang, ch), body in comm.items():
        dump(OUT / "commentary" / f"{lang}-{ch}.json", body)

    def people(table):
        return {lang: [{"id": k, "name": en, "name_hi": hi} for k, en, hi in rows]
                for lang, rows in table.items()}

    dump(OUT / "index.json", {
        "source": {
            "name": "gita/gita (data behind bhagavadgita.io)",
            "url": "https://github.com/gita/gita",
            "license": "Unlicense (public domain dedication)",
        },
        "translators": people(TRANSLATORS),
        "commentators": people(COMMENTATORS),
        "chapters": meta_chapters,
    })

    missing = [(c, v, lang, k) for (c, v), row in index.items()
               for lang, rows in TRANSLATORS.items() for k, _, _ in rows if k not in row[lang]]
    print(f"chapters: {len(meta_chapters)}  verses: {len(index)}  commentary files: {len(comm)}")
    print(f"missing translations: {len(missing)} {missing[:10]}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
