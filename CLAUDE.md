# CLAUDE.md

Personal portfolio for shirishve.com: a static Astro site painted in a Van Gogh style.
`PLAN.md` is the full brief. It is kept out of git (it is a private planning doc); read it before any phase of work if it is present.

## Stack

- Astro 7 with TypeScript (strict), static output. No UI framework, no UI kit.
- Plain CSS with custom properties. Tokens live in `src/styles/tokens.css`.
- Copy lives in `src/content/*.yaml`, read and validated by `src/lib/content.ts` (js-yaml + zod).
- Fonts are self-hosted Latin WOFF2 files in `public/fonts`.
- Icons come from the `simple-icons` package and are inlined at build time.
- Hosting: GitHub Pages, deployed by `.github/workflows/deploy.yml` on every push to `main` and once a day. DNS for shirishve.com is at Cloudflare.
- Node 24. npm.

## Commands

| Command                           | What it does                                              |
| --------------------------------- | --------------------------------------------------------- |
| `npm run dev`                     | Dev server on :4321 (`astro dev --background` for agents) |
| `npm run build`                   | Static build to `dist/`                                   |
| `npm run preview`                 | Serve `dist/`                                             |
| `npm run check`                   | `astro check` (types)                                     |
| `npm run check:contrast`          | WCAG AA check of every text and surface pair              |
| `npm run format` / `format:check` | Prettier                                                  |
| `npm run verify`                  | All checks plus a build. Run it before every commit.      |

## Design tokens

| Token       | Hex     | Role                                     |
| ----------- | ------- | ---------------------------------------- |
| `night`     | #101B3B | Hero sky, footer, dark surfaces          |
| `cobalt`    | #1F4E8C | Swirl strokes, links on light surfaces   |
| `sky`       | #4F86C6 | Lighter swirl strokes, hover states      |
| `chrome`    | #F2C230 | Stars, headings on dark, primary buttons |
| `ochre`     | #C98A1B | Wheat, borders, frame edges              |
| `cypress`   | #23402B | Deep green shapes and dividers           |
| `blossom`   | #7DBDB4 | Tags, secondary accents                  |
| `canvas`    | #F3E9CF | Light surfaces and body background       |
| `vermilion` | #E0201B | Arsenal accent: one use per screen       |

`src/lib/palette.ts` is the source of truth for surfaces and their stroke colours.
`tokens.css` mirrors it. Change both together, then run `npm run check:contrast`.

Type: Fraunces (display), Newsreader (body), Caveat (margin notes), JetBrains Mono (code and stats).

## Design bar

It must read as a painting, not a website with a blue and yellow theme.

- Brushwork, texture and ragged edges everywhere.
- No stock UI components, no straight dividers, no default (blurred) shadows.
- Rough edges go on a background layer (`.paint::before`), never on the text itself.
- Vermilion is one stroke per section until the Terrace section.
- Margin notes are dry and precise. No exclamation marks.

## Guardrails

- **Original artwork only by default.** Evoke Van Gogh through technique. If a real painting is ever used, take it only from a museum open-access download marked public domain or CC0, and record the source URL in `CREDITS.md`.
- **No Arsenal crest, wordmark, kit or sponsor logos.** The club is shown through red and white, original illustration and words.
- **Brand icons stay unmodified inside their seals.** If a platform is missing from Simple Icons, draw a plain lettered seal instead of copying a logo from elsewhere.
- **Nothing confidential.** No employer code, client names or internal metrics; Work copy uses only what Shirish clears.
- **Performance budget.** Under 200 KB of JavaScript and under 1 MB total on first load; fonts subset and preloaded; canvas capped by device pixel ratio.
- **Accessibility.** AA contrast, visible focus rings in `chrome`, alt text on every painted scene, full keyboard navigation, reduced-motion support.

## Process

- `main` deploys. Work on a branch and merge when `npm run verify` passes.
- The page is public. Nothing goes into `src/content/` that has not been cleared: no employer code, client names or internal numbers.
- Placeholders in `src/content/` carry the word `PLACEHOLDER`. Do not invent real facts for them.
