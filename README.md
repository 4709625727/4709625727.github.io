# 4709625727.github.io

Personal site for **Prudhvi Vuppalapati**, analytics engineer (Atlanta, GA).

Static HTML with no framework and no runtime dependencies. Content lives in
`data/*.json`; `build.js` renders it into `index.html` and `404.html` at build
time, so the page is fully readable with JavaScript disabled and link previews
show real content instead of an empty shell.

## Edit and publish

```bash
npm run build     # rewrite index.html, 404.html and resume.html from data/
npm run check     # fail if the committed HTML is stale (this is what CI runs)
npm run resume    # rebuild, then render resume.pdf with headless Chrome
npm run dev       # build, then serve on http://localhost:8000
```

**Editing content means editing `data/`, then running `npm run build` and
committing the regenerated HTML.** Editing `index.html` directly will be
overwritten on the next build.

| File | Holds |
|---|---|
| `data/site.json` | Name, role, contact details, meta tags, the rail schema |
| `data/hero.json` | The opening thesis and body copy |
| `data/projects.json` | Medallion layers and the featured repositories |
| `data/experience.json` | Roles and education |
| `data/skills.json` | Tool groups, and which tools have public code behind them |

## Build-time integrity checks

`build.js` refuses to produce a page that contradicts itself. It exits non-zero if:

- a project references a layer that doesn't exist, or has no repo URL or one-liner;
- a skill is marked `"e": true` (has repo evidence) but no featured project's stack
  actually lists it;
- `experience.totalMonths` disagrees with the sum of the individual roles;
- `site.json` advertises a different project count than `projects.json` contains;
- a diagram label is too wide for the box it sits in (SVG has no text layout
  engine, so an overflowing label silently spills across the artwork);
- a diagram is missing its `<title>` or `<desc>` for screen readers;
- **any page references a third-party origin.** The footer promises no
  third-party requests; nothing else could catch a stylesheet or font quietly
  making that promise false, so the rendered output is scanned directly.

The previous version of this site displayed "2+ years" and "3+ years" of
experience in the same scroll, and "0+ Certifications" as an achievement. These
checks exist so that class of error fails the build rather than the interview.

## Structure

```
build.js                 renders index.html + 404.html from data/
data/*.json              all content — the only files you normally edit
assets/css/styles.css    the design system
assets/js/main.js        progressive enhancement only (~160 lines)
assets/images/           favicon, apple touch icon, Open Graph card
.github/workflows/ci.yml runs npm run check on every push
```

## Design notes

The page is laid out the way a warehouse is. A schema rail on the left lists the
sections with their types; the work itself is classified into a medallion
pipeline — **ingest → model → serve** — drawn as one continuous rule that changes
colour at each layer boundary. Each project row carries a spine in its layer's
colour.

Those three colours (`--ingest`, `--model`, `--serve`) are semantic: they mean a
pipeline layer and are used for nothing else. Everything else is ink on paper.
Every foreground/background pair is at least 4.5:1 in both light and dark
schemes.

Type is the IBM Plex superfamily in three roles: Plex Mono for identifiers and
headings, Plex Sans for prose, Plex Mono at small sizes for labels and tags.

## Figures and marks

Each project row carries a hand-authored SVG architecture diagram in
`assets/diagrams/`. They are inlined into the HTML, so they cost no request,
inherit the row's layer colour through `currentColor` (exact in both schemes,
with no filter approximation), stay crisp at any size, and carry **real labels** —
about 2.5KB each against the 60KB generated bitmaps they replaced. An unlabelled
schematic is texture; a labelled one is information.

The earlier generated rasters are still in `assets/images/projects/`. Set
`"figureStyle": "png"` on a project in `data/projects.json` to switch that row
back to its bitmap.

**Employer marks are the real wordmarks.** CGI and Lumen Technologies come from
Wikimedia Commons, where both are public domain as text logos — see
[`assets/images/logos/SOURCES.md`](assets/images/logos/SOURCES.md). They are
inlined with every fill rewritten to `currentColor` and reproduced in one colour
deliberately: colour on this page denotes a pipeline layer, so a brand red would
assert a meaning that isn't there. Because wordmarks differ wildly in proportion,
`build.js` reads each `viewBox` and derives a height that lands them on a common
optical width.

Kennesaw State University renders a typographic monogram — no freely licensed
academic mark exists, and the only public-domain option is the athletics logo.

## Portrait

`assets/images/portrait/` holds a 4:5 crop at 1x and 2x in WebP with a JPEG
fallback, served through `<picture>` and framed with the same hairline as every
other object on the page. It sits in the right-hand column of the profile
section, top-aligned with the name, and collapses above the copy at 8.5rem on
narrow screens. It carries `alt=""`: the name is directly beside it, so a screen
reader should not announce the person twice. The same crop is composited into the
Open Graph card, which is where a face earns the most — it is what a recruiter
sees when the link is pasted into LinkedIn or an email.

It is deliberately **not** on `resume.pdf`. US hiring convention is against
photos on a CV: they invite bias complaints and confuse applicant-tracking
parsers. The site is the right place for a face; the CV is not.

## Fonts

Self-hosted and subset. The site previously pulled a render-blocking Google
Fonts stylesheet: 21 files, 147KB, including an IBM Plex Sans 600 that the page
never painted, and every visitor's IP going to Google while the footer promised
no third-party requests. It now ships five same-origin woff2 files totalling
80KB, subset to Basic Latin plus the handful of extra glyphs the content uses.

## Résumé

`npm run resume` renders a one-page `resume.pdf` from the same `data/*.json` as
the site, so the CV and the page can never disagree about a date, an employer or
what a project does.

## Accessibility

- Renders and reads completely without JavaScript.
- All text meets WCAG AA contrast in light and dark schemes.
- `prefers-reduced-motion` disables the one animation and smooth scrolling.
- The small-screen menu is removed from the tab order when closed, closes on
  Escape and on outside click, and reports state via `aria-expanded`.
- Visible focus rings throughout; skip link to main content.
- No trackers, no analytics, no cookies, no third-party JavaScript.
