# Bhagavad Gita reader

A simple reading site for the Bhagavad Gita in English and Hindi. It is designed for older readers: large type, high contrast, three levels of navigation and big buttons.

**Pages:** Home (18 chapters) → Chapter (summary + verse list) → Verse (Sanskrit, translation, word meanings, explanation, previous/next).

## Run it

The site is plain HTML, CSS and JavaScript with no build step. It loads its text from JSON files, so open it through a web server rather than by double-clicking `index.html`:

```bash
cd bhagavad-gita
python3 -m http.server 8000
```

Then open <http://localhost:8000>. To publish it, any static host works, including GitHub Pages.

## Where the text comes from

`bhagavadgita.com` could not be reached (the domain did not resolve), so nothing was scraped. The text comes from the open dataset behind bhagavadgita.io: [github.com/gita/gita](https://github.com/gita/gita), released under the Unlicense.

`scripts/build_data.py` turns that dataset into the files in `data/` and cleans it up:

- Removes repeated verse numbers (`।।2.47।।`) and footnote markers from the Hindi text.
- Turns `।।` into a proper double danda `॥`.
- Restores commas that the dataset had turned into `?` in Swami Sivananda's text.
- Puts the speaker line (`श्री भगवानुवाच`) on its own line.

```bash
git clone --depth 1 https://github.com/gita/gita.git /tmp/gita
python3 scripts/build_data.py /tmp/gita/data
```

| File | Contents |
|---|---|
| `data/index.json` | 18 chapters (Sanskrit/English names, meaning, verse count, English + Hindi summary) and the list of translators |
| `data/chapters/<n>.json` | Every verse: Sanskrit (`sa`), speaker (`sa_speaker`), transliteration (`tr`), word meanings (`wm`), translations in `en` (5 translators) and `hi` (2 translators) |
| `data/commentary/en-<n>.json`, `hi-<n>.json` | Explanation by Swami Sivananda (English) and Swami Ramsukhdas (Hindi), loaded only when opened |

The site shows one translation per language: Swami Sivananda in English and Swami Ramsukhdas in Hindi. The other translations stay in the data files for later use.

**Copyright note.** The dataset is public-domain, but the translations and commentaries are the work of their authors and publishers. Swami Sivananda died in 1963, so his work is public domain in India (life + 60 years) but may still be protected in countries with longer terms. Swami Ramsukhdas died in 2005, so his Hindi work is still protected. Its publisher is Gita Press, Gorakhpur. Check permissions before publishing commercially.

## Design decisions and the research behind them

| Decision | Why |
|---|---|
| Dark text on light backgrounds everywhere you read | Piepenbrock et al. (2013) found that dark-on-light text improves legibility for both younger and older adults ([Ergonomics](https://informahealthcare.com/doi/abs/10.1080/00140139.2013.790485)). |
| 20px body text, a 22–28px translation and a 1.2× "Large text" switch; everything in `rem`, so browser zoom works too | Older adults prefer larger type ([Frontiers in Psychology 2022 review](https://www.frontiersin.org/articles/10.3389/fpsyg.2022.931646/full)); WCAG 1.4.4 requires text to resize. |
| Every control is at least 44px tall, and most are 48–56px | Above WCAG 2.5.5's 44×44px (AAA) target size ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html)); motor control declines with age ([NN/g](https://www.nngroup.com/articles/usability-for-senior-citizens/)). |
| Text labels on controls ("Previous verse", "Next verse", "English / हिन्दी"), not icon-only buttons | NN/g found many older users unsure of common web terms, so plain words work better than icons or jargon ([NN/g](https://www.nngroup.com/articles/define-techy-words-old-users/)). |
| Only three levels of pages, one translation per language, no menus, search or settings panel | Hick's law: fewer choices make faster decisions. NN/g measured users aged 65+ as 43% slower on websites ([NN/g](https://www.nngroup.com/articles/usability-seniors-improvements/)). |
| Word meanings and explanation start closed | Progressive disclosure keeps the verse page focused on the verse. |
| "Verse 47 of 72" with a progress bar; "Continue: Chapter 2, Verse 47" on the home page | The goal-gradient effect, plus no need to remember where you stopped. |
| Big Previous/Next buttons fixed to the bottom of the screen | Fitts's law: large targets within thumb reach. |
| Same layout on every verse page; each chapter keeps its own colour | Consistency (Jakob's law) and colour as a "you are here" cue. |
| Animation only on page load and scroll, never looping; all of it off with "reduce motion" | WCAG 2.2.2 (no auto-moving content) and 2.3.3 (animation from interactions). |
| Accessibility basics | Built on WCAG, which W3C's WAI-AGE project found covers most older users' needs ([W3C](https://www.w3.org/WAI/older-users/)). |

### Fonts (Google Fonts)

- **Atkinson Hyperlegible Next** (English reading text). The Braille Institute designed it for readers with low vision ([Braille Institute / Google Fonts](https://fonts.google.com/specimen/Atkinson+Hyperlegible/about)).
- **Anek Devanagari** (headings and Hindi text). Ek Type's multi-script family; one design covers Latin and Devanagari, so English and Hindi headings match.
- **Tiro Devanagari Sanskrit** (the verses). Built for Sanskrit, with its conjunct letters.

### Colours

All colours come from the "Bhagavad Gita colour pair library". The page uses **Cream** `#F9F8EC`, **Warm cream** `#EFE6D3`, near-black `#1E1E1E` and **Ultramarine** `#3227C6` for links. The 18 chapters use 18 tiles from the library, ordered as a hue spectrum, each with the near-black text:

| Ch | Tile | Colour | Contrast |
|---|---|---|---|
| 1 | Peony | `#F1D4E0` | 12.1:1 |
| 2 | Clay coral | `#E46D31` | 5.2:1 |
| 3 | Halloween | `#E27A2C` | 5.6:1 |
| 4 | Tangerine | `#E08A4C` | 6.3:1 |
| 5 | Golden | `#F4D37C` | 11.5:1 |
| 6 | Sunbeam | `#F2C64F` | 10.3:1 |
| 7 | Golden yellow | `#F1C94B` | 10.5:1 |
| 8 | Sunny | `#E2C86C` | 10.1:1 |
| 9 | Light green | `#E6E9A6` | 13.2:1 |
| 10 | Pistachio | `#D3DA9B` | 11.3:1 |
| 11 | Lemon green | `#B4CD5A` | 9.4:1 |
| 12 | Kiwi | `#A6B83A` | 7.6:1 |
| 13 | Lime green | `#6FD46B` | 9.0:1 |
| 14 | Lettuce | `#5A9E52` | 5.1:1 |
| 15 | Sky | `#B3D5FF` | 11.0:1 |
| 16 | Cornflower | `#5D9BE7` | 5.8:1 |
| 17 | Periwinkle | `#8C8AF5` | 5.6:1 |
| 18 | Lavender | `#D3C2E4` | 10.0:1 |

Every pair passes WCAG AA (4.5:1), and 12 also pass AAA (7:1). Many of the library's *original* text colours fail. For example, orange on Sunbeam is about 1.6:1, so those were not used. The hex values were read from a screenshot of the library. If your source file has exact values, change them in `css/style.css` (`--c1` … `--c18`) and run:

```bash
python3 scripts/check_contrast.py
```

## Motion

The site uses [GSAP](https://gsap.com) 3.15.0 with ScrollTrigger, stored in `js/vendor/` (GSAP's standard no-charge license):

- Headings rise into view and the chapter cards and verse rows appear as you scroll.
- The 18-colour wheel turns as you scroll.
- The chapter number drifts as you scroll.
- The progress bar fills.
- Panels open smoothly.

If GSAP fails to load or the device asks for reduced motion, the site works the same with no animation.

## Files

```
index.html          page shell
css/style.css       all styles; colours and fonts are tokens at the top
js/app.js           routing, rendering, animation
js/vendor/          GSAP + ScrollTrigger
data/               generated text (see above)
scripts/            build_data.py, check_contrast.py
```
