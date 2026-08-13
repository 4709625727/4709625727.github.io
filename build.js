#!/usr/bin/env node
/**
 * Renders index.html from data/*.json.
 *
 * Why this exists: the previous version of this site fetched all of its content
 * with JavaScript after load, so the HTML a crawler or a link-preview bot saw was
 * an empty shell titled "Portfolio - Your Name". Everything is rendered here
 * instead, at build time, so the page works with JavaScript disabled and link
 * previews show real content.
 *
 * Usage:  node build.js   (or: npm run build)
 * Checks: npm run check   — fails if index.html is out of sync with data/
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DATA = path.join(ROOT, 'data');
const OUT = path.join(ROOT, 'index.html');

const read = (name) => JSON.parse(fs.readFileSync(path.join(DATA, name), 'utf8'));

const site = read('site.json');
const hero = read('hero.json');
const projects = read('projects.json');
const experience = read('experience.json');
const skills = read('skills.json');

/* ---------------------------------------------------------------- helpers */

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const attr = esc;
const list = (arr, fn) => arr.map(fn).join('\n');

/* ------------------------------------------------------------ validation */
/* Fail loudly rather than shipping the kind of contradictions this rebuild
   was meant to remove. */

const problems = [];

const layerIds = new Set(projects.layers.map((l) => l.id));
for (const p of projects.projects) {
  if (!layerIds.has(p.layer)) problems.push(`project "${p.slug}" has unknown layer "${p.layer}"`);
  if (!p.repo) problems.push(`project "${p.slug}" has no repo URL`);
  if (!p.oneLiner) problems.push(`project "${p.slug}" has no oneLiner`);
}

// Every skill marked as evidenced must actually appear in a featured project's stack.
const evidencePool = new Set();
for (const p of projects.projects) {
  for (const s of p.stack) evidencePool.add(s.toLowerCase());
}
// Concepts demonstrated by a project without appearing verbatim in its stack list.
const evidenceAliases = {
  postgresql: 'postgres',
  'star schema': 'dbt',
  'apache iceberg': 'apache iceberg',
};
for (const g of skills.groups) {
  for (const s of g.skills) {
    if (!s.e) continue;
    const key = s.n.toLowerCase();
    const alias = evidenceAliases[key] || key;
    if (!evidencePool.has(key) && !evidencePool.has(alias)) {
      problems.push(`skill "${s.n}" claims repo evidence, but no featured project lists it`);
    }
  }
}

const declaredMonths = experience.roles.reduce((n, r) => n + (r.months || 0), 0);
if (declaredMonths !== experience.totalMonths) {
  problems.push(
    `experience.totalMonths is ${experience.totalMonths} but the roles sum to ${declaredMonths}`
  );
}

const projCount = projects.projects.length;
const declaredProj = (site.sections.find((s) => s.id === 'pipeline') || {}).type;
if (declaredProj !== `project[${projCount}]`) {
  problems.push(`site.json says pipeline is "${declaredProj}" but there are ${projCount} projects`);
}

if (problems.length) {
  console.error('\n  Build failed — content is inconsistent:\n');
  for (const p of problems) console.error(`   • ${p}`);
  console.error('');
  process.exit(1);
}

/* -------------------------------------------------------------- fragments */

const { identity, meta } = site;
const mailto = `mailto:${identity.email}`;

const railNav = list(
  site.sections,
  (s) => `          <li>
            <a href="#${attr(s.id)}" data-nav="${attr(s.id)}">
              <span class="rail-name">${esc(s.label)}</span>
              <span class="rail-type">${esc(s.type)}</span>
            </a>
          </li>`
);

/* The layer strip is informational, not a control. With five projects a filter
   would be a widget that does nothing without JavaScript and saves nobody a
   scroll; the classification itself is the point. */
const layerStrip = list(
  projects.layers,
  (l, i) => `        <li class="layer" data-layer="${attr(l.id)}" style="--i:${i}">
          <span class="layer-rule" aria-hidden="true"></span>
          <span class="layer-title">${esc(l.title)}</span>
          <span class="layer-count">${projects.projects.filter((p) => p.layer === l.id).length} ${projects.projects.filter((p) => p.layer === l.id).length === 1 ? 'repo' : 'repos'}</span>
          <span class="layer-blurb">${esc(l.blurb)}</span>
        </li>`
);

/* Architecture schematic, rendered only if the file is actually on disk — the
   page must build cleanly whether or not the figures have been generated. */
/* Real pixel dimensions straight out of the PNG IHDR chunk, so the browser can
   reserve the right box and the page never shifts as figures load. Hardcoding
   these would silently rot the moment an image is re-cropped. */
const pngSize = (file) => {
  const head = Buffer.alloc(24);
  const fd = fs.openSync(file, 'r');
  fs.readSync(fd, head, 0, 24, 0);
  fs.closeSync(fd);
  if (head.toString('ascii', 1, 4) !== 'PNG') return null;
  return { w: head.readUInt32BE(16), h: head.readUInt32BE(20) };
};

/* SVG has no text layout engine, so a label that outgrows its box just spills
   over the artwork and nothing complains. IBM Plex Mono is monospaced at
   0.6em per character, which makes label width predictable enough to check:
   find the box each centred label sits inside and fail the build if the text
   cannot fit. This is the only bug class in these diagrams that is invisible
   in code review and obvious to a reader. */
const MONO_ADVANCE = 0.6;

function checkDiagramFits(rel, svg) {
  const rects = [...svg.matchAll(/<rect[^>]*\sx="([\d.]+)"[^>]*\sy="([\d.]+)"[^>]*\swidth="([\d.]+)"[^>]*\sheight="([\d.]+)"/g)].map(
    (m) => ({ x: +m[1], y: +m[2], w: +m[3], h: +m[4] })
  );

  for (const m of svg.matchAll(/<text([^>]*)>([^<]*)<\/text>/g)) {
    const at = m[1];
    const text = m[2].trim();
    if (!text) continue;
    // only centred labels are box-bound; d-start / d-end run free in the margins
    if (/\bd-(start|end)\b/.test(at)) continue;

    const x = +(at.match(/\sx="([\d.]+)"/) || [])[1];
    const y = +(at.match(/\sy="([\d.]+)"/) || [])[1];
    if (Number.isNaN(x) || Number.isNaN(y)) continue;

    const size = /\bd-label\b/.test(at) ? 12 : 10;
    const width = [...text].length * size * MONO_ADVANCE;

    // the tightest box whose horizontal span contains the anchor and whose
    // vertical span contains the baseline
    const box = rects
      .filter((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h)
      .sort((a, b) => a.w - b.w)[0];
    if (!box) continue;

    if (width > box.w - 4) {
      problems.push(
        `${rel}: label "${text}" needs ~${Math.ceil(width)}px but its box is ${box.w}px wide`
      );
    }
  }
}

/* Diagrams default to authored SVG, inlined so they inherit the row's layer
   colour and cost no request. Set "figureStyle": "png" on a project to fall
   back to the generated raster in assets/images/projects/ instead. */
const figure = (p) => {
  if (p.figureStyle !== 'png') {
    const rel = `assets/diagrams/${p.slug}.svg`;
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) return '';
    const svg = fs.readFileSync(abs, 'utf8').trim();
    if (!/<title\b/.test(svg) || !/<desc\b/.test(svg)) {
      problems.push(`diagram "${rel}" is missing a <title> or <desc> for screen readers`);
    }
    checkDiagramFits(rel, svg);
    return `
            <figure class="row-fig">${svg}</figure>`;
  }

  const rel = `assets/images/projects/${p.slug}.png`;
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return '';
  const size = pngSize(abs);
  if (!size) {
    problems.push(`figure for "${p.slug}" is not a readable PNG`);
    return '';
  }
  return `
            <figure class="row-fig">
              <img src="${attr(rel)}" width="${size.w}" height="${size.h}" loading="lazy" decoding="async"
                   alt="Architecture schematic for ${attr(p.name)}. ${attr(p.oneLiner)}">
            </figure>`;
};

const ledger = list(
  projects.projects,
  (p) => `        <li class="row${p.flagship ? ' is-flagship' : ''}" data-layer="${attr(p.layer)}">
          <span class="row-spine" aria-hidden="true"></span>
          <p class="row-layer">${esc(p.layer)}</p>
          <div class="row-main">
            ${p.flagship ? '<p class="row-flag">most complete</p>' : ''}
            <h3 class="row-title">
              ${esc(p.name)}<span class="row-sub">${esc(p.subtitle)}</span>
            </h3>
            <p class="row-one">${esc(p.oneLiner)}</p>
            <p class="row-body">${esc(p.body)}</p>
            <p class="row-detail">${esc(p.detail)}</p>${figure(p)}
            <ul class="tags">
              ${p.stack.map((t) => `<li>${esc(t)}</li>`).join('\n              ')}
            </ul>
          </div>
          <p class="row-link">
            <a href="${attr(p.repo)}" rel="noopener noreferrer">
              <span class="row-slug">${esc(p.slug)}</span>
              <span class="arrow" aria-hidden="true">&#8599;</span>
              <span class="sr-only">— open ${esc(p.name)} on GitHub</span>
            </a>
          </p>
        </li>`
);

/* An employer mark. Uses an official logo if one has been dropped into
   `logo`, otherwise sets a typographic monogram from `initials`. No real
   company trademark is ever synthesised. */
/* Wordmarks have wildly different aspect ratios — CGI is ~2:1, Lumen ~7:1 — so a
   single height would make one a postage stamp and the other a banner. Height is
   derived from each viewBox to land them on a common optical width instead. */
const MARK_TARGET_W = 4.6; // rem
const MARK_MIN_H = 0.7;
const MARK_MAX_H = 1.5;

const inlineLogo = (item, name) => {
  const abs = path.join(ROOT, item.logo);
  if (!fs.existsSync(abs)) {
    problems.push(`logo "${item.logo}" for ${name} does not exist`);
    return '';
  }
  const svg = fs.readFileSync(abs, 'utf8').trim();
  const vb = svg.match(/viewBox="([\d.\-\s]+)"/);
  let h = MARK_MAX_H;
  if (vb) {
    const [, , w, hh] = vb[1].trim().split(/\s+/).map(Number);
    if (w > 0 && hh > 0) {
      h = Math.min(MARK_MAX_H, Math.max(MARK_MIN_H, MARK_TARGET_W / (w / hh)));
    }
  }
  return `<span class="mark-logo" style="--mark-h:${h.toFixed(2)}rem">${svg}</span>`;
};

const mark = (item, name) =>
  item.logo
    ? inlineLogo(item, name)
    : `<span class="mark" aria-hidden="true">${esc(item.initials || '')}</span>`;

const roles = list(
  experience.roles,
  (r) => `        <li class="role${r.current ? ' is-current' : ''}">
          <div class="role-when">
            ${mark(r, r.company)}
            <p class="role-period">${esc(r.period)}</p>
            <p class="role-len">${Math.floor(r.months / 12) ? Math.floor(r.months / 12) + ' yr ' : ''}${r.months % 12 ? (r.months % 12) + ' mo' : ''}</p>
          </div>
          <div class="role-what">
            <h3 class="role-title">${esc(r.title)}</h3>
            <p class="role-co">${esc(r.company)} <span>· ${esc(r.location)}</span></p>
            <ul class="role-bullets">
              ${r.bullets.map((b) => `<li>${esc(b)}</li>`).join('\n              ')}
            </ul>
            <ul class="tags">
              ${r.stack.map((t) => `<li>${esc(t)}</li>`).join('\n              ')}
            </ul>
          </div>
        </li>`
);

const education = list(
  experience.education,
  (e) => `        <li class="edu">
          <div class="edu-when">
            ${mark(e, e.institution)}
            <p class="edu-date">${esc(e.date)}</p>
          </div>
          <div>
            <h4 class="edu-degree">${esc(e.degree)}${e.field ? ', ' + esc(e.field) : ''}</h4>
            <p class="edu-where">${esc(e.institution)} <span>· ${esc(e.location)}</span></p>
          </div>
        </li>`
);

const skillGroups = list(
  skills.groups,
  (g) => `        <div class="skill-group">
          <h3 class="skill-name">${esc(g.name)}</h3>
          ${g.note ? `<p class="skill-note">${esc(g.note)}</p>` : ''}
          <ul class="tags">
            ${g.skills
              .map(
                (s) =>
                  `<li${s.e ? ' class="is-evidenced"' : ''}>${esc(s.n)}${s.e ? '<span class="sr-only"> (used by a repository above)</span>' : ''}</li>`
              )
              .join('\n            ')}
          </ul>
        </div>`
);

const heroBody = list(hero.body, (p) => `          <p>${esc(p)}</p>`);

const baseUrl = meta.url.replace(/\/+$/, '');

const jsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: identity.name,
  jobTitle: identity.role,
  email: identity.email,
  url: meta.url,
  address: { '@type': 'PostalAddress', addressLocality: 'Atlanta', addressRegion: 'GA' },
  sameAs: [identity.github, identity.linkedin].filter(Boolean),
  alumniOf: experience.education.map((e) => ({
    '@type': 'CollegeOrUniversity',
    name: e.institution,
  })),
  knowsAbout: ['Analytics engineering', 'Data engineering', 'dbt', 'SQL', 'Airflow', 'Change data capture'],
});

/* ------------------------------------------------------------------ page */

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<title>${esc(meta.title)}</title>
<meta name="description" content="${attr(meta.description)}">
<meta name="keywords" content="${attr(meta.keywords)}">
<meta name="author" content="${attr(identity.name)}">
<link rel="canonical" href="${attr(meta.url)}">

<meta property="og:type" content="profile">
<meta property="og:site_name" content="${attr(identity.name)}">
<meta property="og:title" content="${attr(meta.title)}">
<meta property="og:description" content="${attr(meta.description)}">
<meta property="og:url" content="${attr(meta.url)}">
<meta property="og:image" content="${attr(baseUrl)}/${attr(meta.ogImage)}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${attr(identity.name)} — ${attr(hero.thesis)}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${attr(meta.title)}">
<meta name="twitter:description" content="${attr(meta.description)}">
<meta name="twitter:image" content="${attr(baseUrl)}/${attr(meta.ogImage)}">

<meta name="theme-color" content="${attr(meta.themeColor)}" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="${attr(meta.themeColorDark)}" media="(prefers-color-scheme: dark)">

<link rel="icon" href="assets/images/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/images/apple-touch-icon.png">

<link rel="preload" href="assets/fonts/IBMPlexMono-600.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/IBMPlexSans-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/styles.css">

<script type="application/ld+json">${jsonLd}</script>
</head>

<body>
<a class="skip" href="#profile">Skip to content</a>

<div class="shell">

  <!-- ---------------------------------------------------------- rail -->
  <aside class="rail" id="rail">
    <div class="rail-inner">
      <a class="rail-brand" href="#profile">
        <span class="rail-brand-name">${esc(identity.name)}</span>
        <span class="rail-brand-role">${esc(identity.role)}</span>
      </a>

      <button class="rail-toggle" id="rail-toggle" aria-expanded="false" aria-controls="rail-nav">
        <span class="rail-toggle-bars" aria-hidden="true"><i></i><i></i></span>
        <span class="rail-toggle-label">Sections</span>
      </button>

      <nav class="rail-nav" id="rail-nav" aria-label="Sections">
        <p class="rail-schema">schema</p>
        <ol>
${railNav}
        </ol>
      </nav>

      <div class="rail-foot">
        <p class="rail-status"><span class="dot" aria-hidden="true"></span>${esc(identity.available)}</p>
        <p class="rail-loc">${esc(identity.location)}</p>
        <p class="rail-links">
          <a href="${attr(identity.github)}" rel="noopener noreferrer">GitHub</a>
          <a href="${attr(mailto)}">Email</a>
          <a href="resume.pdf" download>CV</a>
        </p>
      </div>
    </div>
  </aside>

  <!-- ---------------------------------------------------------- main -->
  <main class="main">

    <!-- profile -->
    <section class="sec sec-profile" id="profile" aria-labelledby="profile-h">
      <div class="sec-head">
        <p class="sec-mark">profile</p>
      </div>
      <div class="hero">
        <figure class="hero-portrait">
          <picture>
            <source type="image/webp"
                    srcset="assets/images/portrait/portrait-240.webp 1x, assets/images/portrait/portrait-480.webp 2x">
            <img src="assets/images/portrait/portrait-480.jpg" width="240" height="300"
                 decoding="async" alt="">
          </picture>
        </figure>
        <div class="hero-text">
          <p class="hero-kicker">${esc(hero.kicker)}</p>
          <h1 class="hero-name" id="profile-h">${esc(identity.name)}</h1>
          <p class="hero-thesis">${esc(hero.thesis)}</p>
          <div class="hero-body">
${heroBody}
          </div>
          <p class="hero-actions">
            <a class="btn btn-primary" href="${attr(hero.primaryAction.href)}">${esc(hero.primaryAction.label)}</a>
            <a class="btn btn-quiet" href="${attr(mailto)}">${esc(hero.secondaryAction.label)}</a>
          </p>
        </div>
      </div>
    </section>

    <!-- pipeline -->
    <section class="sec sec-pipeline" id="pipeline" aria-labelledby="pipeline-h">
      <div class="sec-head">
        <p class="sec-mark">pipeline</p>
        <h2 class="sec-title" id="pipeline-h">Ingest, model, serve</h2>
        <p class="sec-intro">${esc(projects.intro)}</p>
      </div>

      <ul class="layers" id="layers">
${layerStrip}
      </ul>

      <ol class="ledger" id="ledger">
${ledger}
      </ol>
    </section>

    <!-- record -->
    <section class="sec sec-record" id="record" aria-labelledby="record-h">
      <div class="sec-head">
        <p class="sec-mark">record</p>
        <h2 class="sec-title" id="record-h">${esc(experience.totalLabel)} of engineering</h2>
        <p class="sec-intro">Backend and platform work on the operational systems that the pipelines above are built to read.</p>
      </div>

      <ol class="roles">
${roles}
      </ol>

      <h3 class="sub-title">Education</h3>
      <ul class="edus">
${education}
      </ul>
    </section>

    <!-- stack -->
    <section class="sec sec-stack" id="stack" aria-labelledby="stack-h">
      <div class="sec-head">
        <p class="sec-mark">stack</p>
        <h2 class="sec-title" id="stack-h">Tools</h2>
        <p class="sec-intro">${esc(skills.legend)}</p>
      </div>
      <div class="skill-grid">
${skillGroups}
      </div>
    </section>

    <!-- contact -->
    <section class="sec sec-contact" id="contact" aria-labelledby="contact-h">
      <div class="sec-head">
        <p class="sec-mark">contact</p>
        <h2 class="sec-title" id="contact-h">Get in touch</h2>
      </div>
      <div class="contact">
        <p class="contact-lead">${esc(identity.available)}. The fastest way to reach me is email.</p>
        <p class="contact-row">
          <a class="contact-email" href="${attr(mailto)}">${esc(identity.email)}</a>
          <button type="button" class="copy" id="copy-email" data-email="${attr(identity.email)}" hidden>
            <span class="copy-label">Copy</span>
          </button>
        </p>
        <p class="contact-alt">
          Or find the code on <a href="${attr(identity.github)}" rel="noopener noreferrer">GitHub</a>,
          or take the one-page <a href="resume.pdf" download>r&eacute;sum&eacute; (PDF)</a>.
        </p>
      </div>
    </section>

    <footer class="foot">
      <p>${esc(site.footer.note)}</p>
      <p><a href="${attr(identity.github)}/${attr(identity.githubUser)}.github.io" rel="noopener noreferrer">${esc(site.footer.sourceLabel)}</a></p>
    </footer>

  </main>
</div>

<script src="assets/js/main.js" defer></script>
</body>
</html>
`;

/* ------------------------------------------------------------------ 404 */

const notFound = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page not found — ${esc(identity.name)}</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/assets/images/favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="${attr(meta.themeColor)}" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="${attr(meta.themeColorDark)}" media="(prefers-color-scheme: dark)">
<link rel="stylesheet" href="/assets/css/styles.css">
</head>
<body>
<main class="oops">
  <p class="oops-rule" aria-hidden="true"><i></i><i></i><i></i></p>
  <p class="sec-mark">404</p>
  <h1 class="oops-title">No such page</h1>
  <p class="oops-body">That address doesn't resolve to anything here. The pipeline, the record and the contact details are all on the front page.</p>
  <p class="hero-actions"><a class="btn btn-primary" href="/">Go to the front page</a></p>
</main>
</body>
</html>
`;

/* ------------------------------------------------------------------ resume */
/* Built from the same JSON as the page, so the CV and the site can never
   disagree about dates, employers or what a project does. `npm run resume`
   renders this to resume.pdf with headless Chrome. */

const resumeContact = [
  identity.location,
  identity.email,
  `github.com/${identity.githubUser}`,
  identity.linkedin,
]
  .filter(Boolean)
  .map(esc)
  .join('  ·  ');

const resume = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(identity.name)} — ${esc(identity.role)}</title>
<meta name="robots" content="noindex">
<style>
  @font-face { font-family:'IBM Plex Mono'; src:url('assets/fonts/IBMPlexMono-400.woff2') format('woff2'); font-weight:400; font-display:block; }
  @font-face { font-family:'IBM Plex Mono'; src:url('assets/fonts/IBMPlexMono-600.woff2') format('woff2'); font-weight:600; font-display:block; }
  @font-face { font-family:'IBM Plex Sans'; src:url('assets/fonts/IBMPlexSans-400.woff2') format('woff2'); font-weight:400; font-display:block; }
  @font-face { font-family:'IBM Plex Sans'; src:url('assets/fonts/IBMPlexSans-500.woff2') format('woff2'); font-weight:500; font-display:block; }

  @page { size: A4; margin: 11mm 14mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family:'IBM Plex Sans',sans-serif; font-size:8.6pt; line-height:1.32; color:#15171C; }
  ul { list-style: none; }
  a { color: inherit; text-decoration: none; }

  .r-name { font-family:'IBM Plex Mono',monospace; font-weight:600; font-size:18pt; letter-spacing:-0.04em; }
  .r-role { font-family:'IBM Plex Mono',monospace; font-size:9pt; color:#4A5260; margin-top:2pt; }
  .r-contact { font-family:'IBM Plex Mono',monospace; font-size:8pt; color:#4A5260; margin-top:5pt; }
  .r-thesis { font-size:10pt; font-weight:500; margin-top:6pt; padding-top:5.5pt; border-top:0.6pt solid #CDD3DC; }
  .r-intro { color:#4A5260; margin-top:4pt; }

  h2 { font-family:'IBM Plex Mono',monospace; font-size:8pt; font-weight:600; letter-spacing:0.13em;
       text-transform:uppercase; color:#5C6574; margin:8pt 0 3.5pt;
       padding-bottom:2.5pt; border-bottom:0.6pt solid #CDD3DC; }

  .r-item { margin-bottom:4pt; break-inside:avoid; }
  .r-head { display:flex; justify-content:space-between; align-items:baseline; gap:8pt; }
  .r-title { font-family:'IBM Plex Mono',monospace; font-weight:600; font-size:10pt; }
  .r-when { font-family:'IBM Plex Mono',monospace; font-size:8pt; color:#5C6574; white-space:nowrap; }
  .r-org { font-size:9pt; color:#4A5260; margin-top:1pt; }
  .r-bullets { margin-top:3pt; }
  .r-bullets li { position:relative; padding-left:9pt; color:#2C333F; margin-bottom:1pt; }
  .r-bullets li::before { content:''; position:absolute; left:0; top:5pt; width:4pt; height:0.6pt; background:#5C6574; }

  .r-proj { display:grid; grid-template-columns:60pt 1fr; gap:7pt; margin-bottom:3pt; break-inside:avoid; }
  .r-layer { font-family:'IBM Plex Mono',monospace; font-size:7.5pt; letter-spacing:0.1em;
             text-transform:uppercase; color:#5C6574; padding-top:1.5pt; }
  .r-pname { font-family:'IBM Plex Mono',monospace; font-weight:600; font-size:9.5pt; }
  .r-pone { color:#2C333F; }
  .r-stack { font-family:'IBM Plex Mono',monospace; font-size:7.5pt; color:#5C6574; margin-top:1pt; }

  .r-skills { display:grid; grid-template-columns:84pt 1fr; gap:2pt 8pt; }
  .r-sk-name { font-family:'IBM Plex Mono',monospace; font-size:8.5pt; font-weight:600; }
  .r-sk-list { font-size:8.7pt; color:#2C333F; }

  .r-foot { margin-top:8pt; padding-top:4pt; border-top:0.6pt solid #CDD3DC;
            font-family:'IBM Plex Mono',monospace; font-size:7.5pt; color:#5C6574; }
</style>
</head>
<body>
  <header>
    <p class="r-name">${esc(identity.name)}</p>
    <p class="r-role">${esc(identity.role)}</p>
    <p class="r-contact">${resumeContact}</p>
    <p class="r-thesis">${esc(hero.thesis)}</p>
    <p class="r-intro">${esc(hero.body[0])}</p>
  </header>

  <h2>Experience</h2>
  ${list(
    experience.roles,
    (r) => `<div class="r-item">
    <div class="r-head">
      <span class="r-title">${esc(r.title)}</span>
      <span class="r-when">${esc(r.period)}</span>
    </div>
    <p class="r-org">${esc(r.company)} · ${esc(r.location)}</p>
    <ul class="r-bullets">${r.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
  </div>`
  )}

  <h2>Selected projects</h2>
  ${list(
    projects.projects,
    (p) => `<div class="r-proj">
    <span class="r-layer">${esc(p.layer)}</span>
    <div>
      <span class="r-pname">${esc(p.name)}</span>
      <p class="r-pone">${esc(p.oneLiner)}</p>
      <p class="r-stack">${p.stack.map(esc).join(' · ')} · github.com/${esc(identity.githubUser)}/${esc(p.slug)}</p>
    </div>
  </div>`
  )}

  <h2>Tools</h2>
  <div class="r-skills">
    ${skills.groups
      .map(
        (g) => `<span class="r-sk-name">${esc(g.name)}</span>
    <span class="r-sk-list">${g.skills.map((s) => esc(s.n)).join(', ')}</span>`
      )
      .join('\n    ')}
  </div>

  <h2>Education</h2>
  ${list(
    experience.education,
    (e) => `<div class="r-head">
    <span class="r-title">${esc(e.degree)}${e.field ? ', ' + esc(e.field) : ''}</span>
    <span class="r-when">${esc(e.date)}</span>
  </div>
  <p class="r-org">${esc(e.institution)} · ${esc(e.location)}</p>`
  )}

  <p class="r-foot">Generated from ${esc(meta.url)} — the site and this document are built from the same source.</p>
</body>
</html>
`;

const RESUME_OUT = path.join(ROOT, 'resume.html');
const NOT_FOUND_OUT = path.join(ROOT, '404.html');

/* ------------------------------------------------- external-origin check */
/* The footer promises "no trackers, no analytics, no cookies". Nothing above
   could catch a stylesheet, font or script quietly reintroducing a third-party
   request and turning that promise into a lie — so check the rendered output
   directly. Only origins a visitor deliberately navigates to are allowed;
   anything the browser would fetch on its own fails the build. */
const ALLOWED_ORIGINS = [
  'https://github.com',        // repo links the visitor clicks
  'http://www.w3.org',         // SVG/XML namespaces, never fetched
  'https://schema.org',        // JSON-LD vocabulary, never fetched
  baseUrl,                     // this site's own canonical + og:image
];

for (const [label, doc] of [['index.html', html], ['404.html', notFound], ['resume.html', resume]]) {
  const origins = new Set(
    (doc.match(/https?:\/\/[^"'\s)]+/g) || []).map((u) => {
      const m = u.match(/^https?:\/\/[^/"'\s)]+/);
      return m ? m[0] : u;
    })
  );
  for (const o of origins) {
    if (!ALLOWED_ORIGINS.some((a) => o === a || o.startsWith(a))) {
      problems.push(`${label} references third-party origin ${o} — the footer claims none`);
    }
  }
}

if (problems.length) {
  console.error('\n  Build failed:\n');
  for (const p of problems) console.error(`   • ${p}`);
  console.error('');
  process.exit(1);
}

const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
const summary = `${kb} KB, ${projects.projects.length} projects, ${experience.roles.length} roles`;

// `npm run check` verifies the committed file matches data/ without rewriting it,
// so CI can catch a JSON edit that was never rebuilt.
if (process.argv.includes('--check')) {
  const stale = [
    [OUT, html, 'index.html'],
    [NOT_FOUND_OUT, notFound, '404.html'],
    [RESUME_OUT, resume, 'resume.html'],
  ].filter(([file, expected]) => {
    const committed = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    return committed !== expected;
  });

  if (stale.length) {
    for (const [, , name] of stale) console.error(`  ${name} is out of sync with data/.`);
    console.error('  Run `npm run build` and commit the result.');
    process.exit(1);
  }
  console.log(`  index.html, 404.html and resume.html are in sync with data/ — ${summary}`);
} else {
  fs.writeFileSync(OUT, html, 'utf8');
  fs.writeFileSync(NOT_FOUND_OUT, notFound, 'utf8');
  fs.writeFileSync(RESUME_OUT, resume, 'utf8');
  console.log(`  index.html + 404.html + resume.html written — ${summary}`);
}
