#!/usr/bin/env python3
"""Check WCAG 2.2 contrast for the colours defined in css/style.css.

Usage:  python3 scripts/check_contrast.py
Exits with status 1 if any text/background pair is below 4.5:1 (AA, normal text).
"""

import re
import sys
from pathlib import Path

CSS = Path(__file__).resolve().parent.parent / "css" / "style.css"
AA = 4.5


def luminance(hex_colour):
    h = hex_colour.lstrip("#")
    channels = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    r, g, b = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in channels]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(a, b):
    hi, lo = sorted((luminance(a), luminance(b)), reverse=True)
    return (hi + 0.05) / (lo + 0.05)


def main():
    tokens = dict(re.findall(r"--([\w-]+):\s*(#[0-9A-Fa-f]{6})\b", CSS.read_text(encoding="utf-8")))
    ink = tokens["ink"]
    pairs = [
        ("ink on paper", ink, tokens["paper"]),
        ("ink on paper-2", ink, tokens["paper-2"]),
        ("ink-2 on paper", tokens["ink-2"], tokens["paper"]),
        ("ink-2 on paper-2", tokens["ink-2"], tokens["paper-2"]),
        ("link on paper", tokens["link"], tokens["paper"]),
        ("paper on ink (buttons)", tokens["paper"], ink),
    ]
    pairs += [(f"ink on chapter {n} (--c{n})", ink, tokens[f"c{n}"]) for n in range(1, 19)]

    failed = False
    for label, fg, bg in pairs:
        r = ratio(fg, bg)
        level = "AAA" if r >= 7 else "AA" if r >= AA else "FAIL"
        failed |= r < AA
        print(f"{label:28s} {fg} on {bg}  {r:5.2f}:1  {level}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
