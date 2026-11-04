/* Bhagavad Gita reader — routing, rendering and motion.
   Pages: Home (#/) → Chapter (#/chapter/2) → Verse (#/chapter/2/verse/47). */
(() => {
  'use strict';

  const main = document.getElementById('main');
  const footer = document.getElementById('footer');
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const animate = () => Boolean(gsap) && !reduceMotion.matches;

  // ---------------------------------------------------------------------------
  // Settings (language + text size) and reading position
  // ---------------------------------------------------------------------------
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem('gita:' + key); return v == null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('gita:' + key, JSON.stringify(value)); } catch (e) { /* ignore */ }
    },
  };
  const settings = Object.assign({ lang: 'en', large: false }, store.get('settings', {}));
  if (settings.lang !== 'hi') settings.lang = 'en';
  let lastRead = store.get('last', null);

  // One translation and one commentary per language keeps choices to a minimum.
  const TRANSLATOR = { en: 'sivananda', hi: 'ramsukhdas' };
  const COMMENTATOR = { en: 'sivananda', hi: 'ramsukhdas' };

  const TEXT = {
    en: {
      brand: 'Bhagavad Gita',
      heroTitle: ['Bhagavad', 'Gita'],
      lede: 'Krishna’s teaching to Arjuna on the battlefield of Kurukshetra. Read each verse in Sanskrit with a clear English translation.',
      start: 'Start reading',
      startOver: 'Start from the beginning',
      resume: (c, v) => `Continue: Chapter ${c}, Verse ${v}`,
      chapters: 'Chapters',
      allChapters: 'All chapters',
      chapter: (n) => `Chapter ${n}`,
      verses: (n) => `${n} verses`,
      startChapter: 'Read this chapter',
      about: 'About this chapter',
      readMore: 'Read more',
      readLess: 'Show less',
      verseList: 'Verses',
      verseTitle: (c, v) => `Chapter ${c}, Verse ${v}`,
      progress: (v, n) => `Verse ${v} of ${n}`,
      translation: 'Translation',
      wordMeanings: 'Word meanings',
      explanation: 'Explanation',
      by: (name) => `Translation by ${name}`,
      explainedBy: (name) => `Explanation by ${name}`,
      noExplanation: 'There is no explanation for this verse.',
      prevVerse: 'Previous verse',
      nextVerse: 'Next verse',
      prevChapter: 'Previous chapter',
      nextChapter: 'Next chapter',
      backTo: (n, name) => `Chapter ${n}: ${name}`,
      largeText: 'Large text',
      language: 'Language',
      loading: 'Loading…',
      notFound: 'Page not found',
      notFoundText: 'This page does not exist.',
      loadError: 'The text could not be loaded. Please check your internet connection and try again.',
      tryAgain: 'Try again',
      skip: 'Skip to content',
      footer: 'Sanskrit text with translations by Swami Sivananda (English) and Swami Ramsukhdas (Hindi), from the open <a href="https://github.com/gita/gita">gita/gita</a> dataset.',
    },
    hi: {
      brand: 'भगवद्गीता',
      heroTitle: ['श्रीमद्', 'भगवद्गीता'],
      lede: 'कुरुक्षेत्र की रणभूमि में भगवान श्रीकृष्ण द्वारा अर्जुन को दिया गया उपदेश। हर श्लोक संस्कृत में, सरल हिन्दी अनुवाद के साथ पढ़ें।',
      start: 'पढ़ना शुरू करें',
      startOver: 'शुरू से पढ़ें',
      resume: (c, v) => `जारी रखें: अध्याय ${c}, श्लोक ${v}`,
      chapters: 'अध्याय',
      allChapters: 'सभी अध्याय',
      chapter: (n) => `अध्याय ${n}`,
      verses: (n) => `${n} श्लोक`,
      startChapter: 'यह अध्याय पढ़ें',
      about: 'अध्याय का सार',
      readMore: 'और पढ़ें',
      readLess: 'कम दिखाएँ',
      verseList: 'श्लोक',
      verseTitle: (c, v) => `अध्याय ${c}, श्लोक ${v}`,
      progress: (v, n) => `${n} में से श्लोक ${v}`,
      translation: 'अनुवाद',
      wordMeanings: 'शब्दार्थ',
      explanation: 'व्याख्या',
      by: (name) => `अनुवाद: ${name}`,
      explainedBy: (name) => `व्याख्या: ${name}`,
      noExplanation: 'इस श्लोक की व्याख्या उपलब्ध नहीं है।',
      prevVerse: 'पिछला श्लोक',
      nextVerse: 'अगला श्लोक',
      prevChapter: 'पिछला अध्याय',
      nextChapter: 'अगला अध्याय',
      backTo: (n, name) => `अध्याय ${n}: ${name}`,
      largeText: 'बड़े अक्षर',
      language: 'भाषा',
      loading: 'लोड हो रहा है…',
      notFound: 'पृष्ठ नहीं मिला',
      notFoundText: 'यह पृष्ठ उपलब्ध नहीं है।',
      loadError: 'पाठ लोड नहीं हो सका। कृपया इंटरनेट कनेक्शन जाँचें और फिर से प्रयास करें।',
      tryAgain: 'फिर से प्रयास करें',
      skip: 'मुख्य सामग्री पर जाएँ',
      footer: 'संस्कृत श्लोक, स्वामी शिवानन्द (अंग्रेज़ी) और स्वामी रामसुखदास (हिन्दी) के अनुवाद सहित — खुले <a href="https://github.com/gita/gita">gita/gita</a> डेटासेट से।',
    },
  };
  const t = (key, ...args) => {
    const v = TEXT[settings.lang][key] ?? TEXT.en[key];
    return typeof v === 'function' ? v(...args) : v;
  };
  const hindi = () => settings.lang === 'hi';

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const lines = (text) => esc(text).split('\n').map((l) => `<span class="line">${l}</span>`).join('');
  const meta = (...parts) => parts.map((p) => `<span>${esc(p)}</span>`).join('<span class="sep" aria-hidden="true"></span>');

  // ---------------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------------
  const cache = new Map();
  function getJSON(path) {
    if (!cache.has(path)) {
      const request = fetch('data/' + path).then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${path}`);
        return r.json();
      });
      request.catch(() => cache.delete(path));
      cache.set(path, request);
    }
    return cache.get(path);
  }
  const getIndex = () => getJSON('index.json');
  const getChapter = (n) => getJSON(`chapters/${n}.json`);
  const getCommentary = (lang, n) => getJSON(`commentary/${lang}-${n}.json`);

  function translationOf(verse, idx, lang = settings.lang) {
    const preferred = TRANSLATOR[lang];
    if (verse[lang][preferred]) return { id: preferred, text: verse[lang][preferred] };
    const other = idx.translators[lang].find((p) => verse[lang][p.id]);
    return other ? { id: other.id, text: verse[lang][other.id] } : { id: null, text: '' };
  }
  function personName(idx, kind, id) {
    const person = idx[kind][settings.lang].find((p) => p.id === id);
    if (!person) return '';
    return hindi() ? person.name_hi : person.name;
  }
  const chapterName = (ch) => (hindi() ? ch.name_sa : ch.name_en);

  // ---------------------------------------------------------------------------
  // Views — each returns { title, html, enter() }
  // ---------------------------------------------------------------------------
  function homeView(idx) {
    const resume = lastRead && idx.chapters[lastRead.c - 1] && lastRead.v <= idx.chapters[lastRead.c - 1].verses
      ? lastRead : null;
    const cta = resume
      ? `<a class="btn btn-primary" href="#/chapter/${resume.c}/verse/${resume.v}">${esc(t('resume', resume.c, resume.v))} <span class="arrow arrow-r" aria-hidden="true">→</span></a>
         <a class="btn btn-secondary" href="#/chapter/1/verse/1">${esc(t('startOver'))}</a>`
      : `<a class="btn btn-primary" href="#/chapter/1/verse/1">${esc(t('start'))} <span class="arrow arrow-r" aria-hidden="true">→</span></a>`;

    const title = t('heroTitle').map((w) => `<span class="mask"><span>${esc(w)}</span></span>`).join(' ');

    const cards = idx.chapters.map((ch) => `
      <li>
        <a class="ch-card" href="#/chapter/${ch.n}" style="--c: var(--c${ch.n})">
          <span class="ch-no" aria-hidden="true">${pad(ch.n)}</span>
          <span class="ch-go" aria-hidden="true">→</span>
          <span class="visually-hidden">${esc(t('chapter', ch.n))}:</span>
          <span class="ch-title"${hindi() ? ' lang="sa"' : ''}>${esc(chapterName(ch))}</span>
          ${hindi() ? '' : `<span class="ch-sub">${esc(ch.meaning_en)}</span>`}
          <span class="ch-meta">${esc(t('verses', ch.verses))}</span>
        </a>
      </li>`).join('');

    return {
      title: t('brand'),
      html: `
        <section class="hero">
          <div class="wrap hero-grid">
            <div class="hero-text">
              ${hindi() ? '' : '<p class="hero-kicker reveal" lang="sa">श्रीमद्भगवद्गीता</p>'}
              <h1 class="hero-title" tabindex="-1">${title}</h1>
              <p class="hero-lede reveal">${esc(t('lede'))}</p>
              <div class="hero-cta reveal">${cta}</div>
            </div>
            <div class="wheel" aria-hidden="true">
              <div class="wheel-ring"></div>
              <div class="wheel-core">ॐ</div>
            </div>
          </div>
        </section>
        <section class="section" aria-labelledby="chapters-title">
          <div class="wrap">
            <h2 class="section-title" id="chapters-title">${esc(t('chapters'))}</h2>
            <ol class="chapter-grid">${cards}</ol>
          </div>
        </section>`,
      enter() {
        if (!animate()) return;
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
        tl.from('.hero-title .mask > span', { yPercent: 110, duration: 1.1, stagger: 0.12 })
          .from('.hero .reveal', { y: 24, autoAlpha: 0, duration: 0.9, stagger: 0.1 }, 0.25)
          .from('.wheel', { scale: 0.85, rotate: -60, autoAlpha: 0, duration: 1.4 }, 0.1);

        // The wheel of 18 chapter colours turns as the reader scrolls (user-driven, never automatic).
        gsap.to('.wheel', {
          rotate: 140, ease: 'none',
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.8 },
        });
        batchReveal('.chapter-grid > li', { y: 48, stagger: 0.07 });
      },
    };
  }

  function chapterView(idx, data, n) {
    const ch = idx.chapters[n - 1];
    const [first, rest] = splitSummary(hindi() ? ch.summary_hi : ch.summary_en);
    const prev = n > 1 ? idx.chapters[n - 2] : null;
    const next = n < idx.chapters.length ? idx.chapters[n] : null;

    const rows = data.verses.map((v) => `
      <li>
        <a class="v-row" href="#/chapter/${n}/verse/${v.v}">
          <span class="v-no">${n}.${v.v}</span>
          <span class="v-text">${esc(translationOf(v, idx).text)}</span>
          <span class="v-go" aria-hidden="true">→</span>
        </a>
      </li>`).join('');

    return {
      title: `${t('chapter', n)}: ${chapterName(ch)} · ${t('brand')}`,
      html: `
        <section class="ch-hero" style="--c: var(--c${n})">
          <div class="wrap">
            <a class="back-link reveal" href="#/"><span aria-hidden="true">←</span> <span class="back-text">${esc(t('allChapters'))}</span></a>
            <p class="ch-hero-label meta reveal">${meta(t('chapter', n), t('verses', ch.verses))}</p>
            <h1 tabindex="-1"${hindi() ? ' lang="sa"' : ''}><span class="mask"><span>${esc(chapterName(ch))}</span></span></h1>
            ${hindi() ? '' : `<p class="ch-hero-sa reveal" lang="sa">${esc(ch.name_sa)}</p>
            <p class="ch-hero-meaning reveal">${esc(ch.meaning_en)}</p>`}
            <a class="btn btn-primary reveal" href="#/chapter/${n}/verse/1">${esc(t('startChapter'))} <span class="arrow arrow-r" aria-hidden="true">→</span></a>
          </div>
          <span class="ch-hero-num" aria-hidden="true">${pad(n)}</span>
        </section>
        <div class="read" style="--c: var(--c${n})">
          <section class="summary" aria-labelledby="about-title">
            <h2 id="about-title">${esc(t('about'))}</h2>
            <p>${esc(first || '')}</p>
            ${rest.length ? `
              <div class="more-panel" id="summary-more" hidden>${rest.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
              <button type="button" class="text-btn" data-action="more" aria-expanded="false" aria-controls="summary-more">${esc(t('readMore'))}</button>` : ''}
          </section>
          <section class="section" aria-labelledby="verses-title">
            <h2 class="list-title" id="verses-title">${esc(t('verseList'))}</h2>
            <ol class="verse-list">${rows}</ol>
            <nav class="pager" aria-label="${esc(t('chapters'))}">
              ${prev ? `<a class="btn btn-secondary" href="#/chapter/${prev.n}"><span class="arrow arrow-l" aria-hidden="true">←</span> ${esc(t('prevChapter'))}</a>` : ''}
              ${next ? `<a class="btn btn-primary${prev ? '' : ' only-next'}" href="#/chapter/${next.n}">${esc(t('nextChapter'))} <span class="arrow arrow-r" aria-hidden="true">→</span></a>` : ''}
            </nav>
          </section>
        </div>`,
      enter() {
        if (!animate()) return;
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
        tl.from('.ch-hero', { clipPath: 'inset(0 0 100% 0)', duration: 1 })
          .from('.ch-hero h1 .mask > span', { yPercent: 110, duration: 1 }, 0.25)
          .from('.ch-hero .reveal', { y: 20, autoAlpha: 0, duration: 0.8, stagger: 0.07 }, 0.35)
          .from('.ch-hero-num', { yPercent: 30, autoAlpha: 0, duration: 1.4 }, 0.2);
        gsap.to('.ch-hero-num', {
          yPercent: -25, ease: 'none',
          scrollTrigger: { trigger: '.ch-hero', start: 'top top', end: 'bottom top', scrub: true },
        });
        batchReveal('.summary > *', { y: 24 });
        batchReveal('.verse-list > li', { y: 24, stagger: 0.04 });
      },
    };
  }

  function verseView(idx, data, n, vn) {
    const ch = idx.chapters[n - 1];
    const verse = data.verses.find((x) => x.v === vn);
    const tr = translationOf(verse, idx);
    const total = ch.verses;
    const prev = vn > 1 ? [n, vn - 1] : n > 1 ? [n - 1, idx.chapters[n - 2].verses] : null;
    const next = vn < total ? [n, vn + 1] : n < idx.chapters.length ? [n + 1, 1] : null;
    const nextLabel = next && next[0] !== n ? t('nextChapter') : t('nextVerse');

    const words = !hindi() && verse.wm.length ? `
      <dl class="words">${verse.wm.map(([w, m]) => `<dt>${esc(w)}</dt><dd>${esc(m)}</dd>`).join('')}</dl>` : '';

    lastRead = { c: n, v: vn };
    store.set('last', lastRead);

    return {
      title: `${t('verseTitle', n, vn)} · ${t('brand')}`,
      html: `
        <div class="read" style="--c: var(--c${n})">
          <div class="verse-head">
            <a class="back-link" href="#/chapter/${n}"><span aria-hidden="true">←</span> <span class="back-text">${esc(t('backTo', n, chapterName(ch)))}</span></a>
            <div class="progress">
              <p class="progress-label" id="progress-label">${esc(t('progress', vn, total))}</p>
              <div class="progress-track" role="progressbar" aria-labelledby="progress-label" aria-valuemin="1" aria-valuemax="${total}" aria-valuenow="${vn}">
                <span class="progress-fill" style="width:${(vn / total) * 100}%"></span>
              </div>
            </div>
          </div>
          <h1 class="verse-title" tabindex="-1"><span class="mask"><span>${esc(t('verseTitle', n, vn))}</span></span></h1>
          <figure class="shloka-card">
            ${verse.sa_speaker ? `<p class="speaker" lang="sa">${esc(verse.sa_speaker)}</p>` : ''}
            <p class="shloka" lang="sa">${lines(verse.sa)}</p>
          </figure>
          ${hindi() ? '' : `<p class="translit" lang="sa-Latn">${verse.tr_speaker ? `<span class="line">${esc(verse.tr_speaker)}</span>` : ''}${lines(verse.tr)}</p>`}
          <section class="translation-block" aria-labelledby="tr-title">
            <h2 class="label" id="tr-title">${esc(t('translation'))}</h2>
            <p class="translation">${esc(tr.text)}</p>
            ${tr.id ? `<p class="by">${esc(t('by', personName(idx, 'translators', tr.id)))}</p>` : ''}
          </section>
          <div class="accordions">
            ${words ? accordion('words', t('wordMeanings'), words) : ''}
            ${accordion('explanation', t('explanation'), `<p>${esc(t('loading'))}</p>`, `data-load="commentary" data-chapter="${n}" data-verse="${vn}"`)}
          </div>
        </div>
        <nav class="verse-pager" aria-label="${esc(t('verseList'))}">
          <div class="read">
            ${prev ? `<a class="btn btn-secondary" rel="prev" href="#/chapter/${prev[0]}/verse/${prev[1]}"><span class="arrow arrow-l" aria-hidden="true">←</span> ${esc(t('prevVerse'))}</a>` : ''}
            ${next ? `<a class="btn btn-primary${prev ? '' : ' only-next'}" rel="next" href="#/chapter/${next[0]}/verse/${next[1]}">${esc(nextLabel)} <span class="arrow arrow-r" aria-hidden="true">→</span></a>` : ''}
          </div>
        </nav>`,
      enter() {
        if (!animate()) return;
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
        tl.from('.verse-head', { y: -12, autoAlpha: 0, duration: 0.6 })
          .from('.progress-fill', { width: `${((vn - 1) / total) * 100}%`, duration: 1.2, ease: 'power3.out' }, 0.1)
          .from('.verse-title .mask > span', { yPercent: 110, duration: 0.9 }, 0.1)
          .from('.shloka-card', { y: 40, scale: 0.97, autoAlpha: 0, duration: 1 }, 0.2)
          .from('.shloka-card .speaker, .shloka .line', { y: 18, autoAlpha: 0, duration: 0.8, stagger: 0.12 }, 0.45)
          .from('.translit, .translation-block, .accordions', { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.08 }, 0.6);
      },
    };
  }

  // Show a short opening (about two sentences); the rest sits behind "Read more".
  function splitSummary(paras) {
    const [head = '', ...tail] = paras;
    if (head.length <= 320) return [head, tail];
    const sentences = head.match(/[^।.!?]+[।.!?]+["”’]?\s*|[^।.!?]+$/g) || [head];
    let intro = '';
    while (sentences.length && (intro.length < 160 || !intro)) intro += sentences.shift();
    const remainder = sentences.join('').trim();
    return [intro.trim(), remainder ? [remainder, ...tail] : tail];
  }

  function accordion(id, label, body, attrs = '') {
    return `
      <div class="acc">
        <h2><button type="button" class="acc-btn" id="acc-${id}-btn" data-action="accordion" aria-expanded="false" aria-controls="acc-${id}" ${attrs}>
          <span>${esc(label)}</span><span class="acc-icon" aria-hidden="true"></span>
        </button></h2>
        <div class="acc-panel" id="acc-${id}" role="region" aria-labelledby="acc-${id}-btn" hidden>
          <div class="acc-inner">${body}</div>
        </div>
      </div>`;
  }

  function notFoundView() {
    return {
      title: `${t('notFound')} · ${t('brand')}`,
      html: `<div class="read notice"><h1 tabindex="-1">${esc(t('notFound'))}</h1><p>${esc(t('notFoundText'))}</p>
             <a class="btn btn-primary" href="#/">${esc(t('allChapters'))}</a></div>`,
    };
  }

  function errorView() {
    return {
      title: t('brand'),
      html: `<div class="read notice"><h1 tabindex="-1">${esc(t('brand'))}</h1><p>${esc(t('loadError'))}</p>
             <button type="button" class="btn btn-primary" data-action="retry">${esc(t('tryAgain'))}</button></div>`,
    };
  }

  // ---------------------------------------------------------------------------
  // Motion helpers
  // ---------------------------------------------------------------------------
  function batchReveal(selector, { y = 32, stagger = 0.06 } = {}) {
    const items = main.querySelectorAll(selector);
    if (!items.length || !ScrollTrigger) return;
    // Opacity only (not visibility) so links stay reachable with the keyboard before they animate in.
    gsap.set(items, { y, opacity: 0 });
    ScrollTrigger.batch(items, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger, overwrite: true }),
    });
  }

  function openPanel(panel) {
    panel.hidden = false;
    if (animate()) {
      gsap.fromTo(panel, { height: 0, autoAlpha: 0 }, {
        height: 'auto', autoAlpha: 1, duration: 0.5, ease: 'power3.out',
        onComplete: () => { gsap.set(panel, { clearProps: 'height,opacity,visibility' }); ScrollTrigger && ScrollTrigger.refresh(); },
      });
    } else if (ScrollTrigger) {
      ScrollTrigger.refresh();
    }
  }
  function closePanel(panel) {
    if (animate()) {
      gsap.to(panel, {
        height: 0, autoAlpha: 0, duration: 0.35, ease: 'power2.in',
        onComplete: () => { panel.hidden = true; gsap.set(panel, { clearProps: 'height,opacity,visibility' }); ScrollTrigger && ScrollTrigger.refresh(); },
      });
    } else {
      panel.hidden = true;
    }
  }

  // ---------------------------------------------------------------------------
  // Router
  // ---------------------------------------------------------------------------
  function parseRoute() {
    const parts = location.hash.replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean);
    if (!parts.length) return { view: 'home' };
    const num = (s) => (/^\d+$/.test(s) ? Number(s) : NaN);
    if (parts[0] === 'chapter' && parts.length === 2) return { view: 'chapter', c: num(parts[1]) };
    if (parts[0] === 'chapter' && parts[2] === 'verse' && parts.length === 4) {
      return { view: 'verse', c: num(parts[1]), v: num(parts[3]) };
    }
    return { view: 'notfound' };
  }

  let renderId = 0;
  let firstRender = true;
  let scope = null;   // gsap.context for the current page

  async function render() {
    const id = ++renderId;
    const route = parseRoute();

    // Start leaving the old page while the data loads (kept short: < 0.4 s total).
    const leaving = !firstRender && animate()
      ? gsap.to(main, { autoAlpha: 0, y: -10, duration: 0.18, ease: 'power1.in' })
      : null;

    let view;
    try {
      const idx = await getIndex();
      if (route.view === 'home') {
        view = homeView(idx);
      } else if (route.view === 'chapter' && idx.chapters[route.c - 1]) {
        view = chapterView(idx, await getChapter(route.c), route.c);
      } else if (route.view === 'verse' && idx.chapters[route.c - 1]
                 && route.v >= 1 && route.v <= idx.chapters[route.c - 1].verses) {
        view = verseView(idx, await getChapter(route.c), route.c, route.v);
      } else {
        view = notFoundView();
      }
    } catch (err) {
      console.error(err);
      view = errorView();
    }
    if (leaving) await leaving;
    if (id !== renderId) return;

    if (scope) scope.revert();
    main.innerHTML = view.html;
    document.title = view.title;
    window.scrollTo(0, 0);

    if (gsap) gsap.set(main, { clearProps: 'opacity,visibility,transform' });
    scope = gsap ? gsap.context(() => view.enter && view.enter(), main) : null;
    if (!gsap && view.enter) view.enter();
    if (ScrollTrigger) ScrollTrigger.refresh();

    if (!firstRender) {
      const heading = main.querySelector('h1');
      if (heading) heading.focus({ preventScroll: true });
    }
    firstRender = false;
  }

  // ---------------------------------------------------------------------------
  // Header, footer and settings
  // ---------------------------------------------------------------------------
  function applySettings() {
    const root = document.documentElement;
    root.lang = settings.lang;
    root.classList.toggle('large-text', settings.large);
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-action="lang"]').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.lang === settings.lang));
    });
    document.querySelector('.lang-switch').setAttribute('aria-label', t('language'));
    const size = document.querySelector('[data-action="size"]');
    size.setAttribute('aria-pressed', String(settings.large));
    size.setAttribute('aria-label', t('largeText'));
    document.querySelector('.skip-link').textContent = t('skip');
    footer.innerHTML = `<p>${t('footer')}</p>`;
  }

  function saveSettings() { store.set('settings', { lang: settings.lang, large: settings.large }); }

  async function loadCommentary(button) {
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    const inner = panel.querySelector('.acc-inner');
    const c = Number(button.dataset.chapter);
    const v = button.dataset.verse;
    const lang = settings.lang;
    try {
      const [idx, data] = await Promise.all([getIndex(), getCommentary(lang, c)]);
      const entry = data[v] && data[v][COMMENTATOR[lang]];
      const paras = entry ? entry.paras : [];
      inner.innerHTML = paras.length
        ? `${paras.map((p) => `<p>${esc(p)}</p>`).join('')}<p class="by">${esc(t('explainedBy', personName(idx, 'commentators', COMMENTATOR[lang])))}</p>`
        : `<p>${esc(t('noExplanation'))}</p>`;
      button.removeAttribute('data-load');
    } catch (err) {
      console.error(err);
      inner.innerHTML = `<p>${esc(t('loadError'))}</p>`;
    }
    if (ScrollTrigger) ScrollTrigger.refresh();
  }

  document.addEventListener('click', (event) => {
    const el = event.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;

    if (action === 'skip') {
      event.preventDefault();
      main.focus();
      main.scrollIntoView();
    } else if (action === 'lang' && el.dataset.lang !== settings.lang) {
      settings.lang = el.dataset.lang;
      saveSettings();
      applySettings();
      render();
    } else if (action === 'size') {
      settings.large = !settings.large;
      saveSettings();
      applySettings();
      if (ScrollTrigger) ScrollTrigger.refresh();
    } else if (action === 'accordion' || action === 'more') {
      const panel = document.getElementById(el.getAttribute('aria-controls'));
      const open = el.getAttribute('aria-expanded') === 'true';
      el.setAttribute('aria-expanded', String(!open));
      if (action === 'more') el.textContent = open ? t('readMore') : t('readLess');
      if (open) {
        closePanel(panel);
      } else {
        openPanel(panel);
        if (el.dataset.load === 'commentary') loadCommentary(el);
      }
    } else if (action === 'retry') {
      render();
    }
  });

  // Left/right arrow keys move between verses.
  document.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target.closest('input, textarea, select, [contenteditable]')) return;
    const rel = event.key === 'ArrowLeft' ? 'prev' : event.key === 'ArrowRight' ? 'next' : null;
    const link = rel && main.querySelector(`a[rel="${rel}"]`);
    if (link) location.hash = link.getAttribute('href');
  });

  window.addEventListener('hashchange', render);
  // Web fonts change text heights; recalculate scroll positions once they are in.
  if (ScrollTrigger && document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
  applySettings();
  render();
})();
