# CLAUDE.md

Personal portfolio for shirishve.com: a static Astro site drawn as one line in a notebook, in the
style of doodle games (crayon doodles on paper).

## Stack

- Astro 7 with TypeScript (strict), static output. No UI framework, no UI kit.
- Plain CSS with custom properties in `src/styles/doodle.css`.
- Copy lives in `src/content/*.yaml`, read and validated by `src/lib/content.ts` (js-yaml + zod).
- Fonts are self-hosted Latin WOFF2 files in `public/fonts`: Caveat (titles, labels), Patrick Hand (body).
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

`GITHUB_OFFLINE=1` builds from `src/data/github.json` without the network.

## How the page works

The page is a chain of segments in one 760 px column: drawings (`Stage*.astro`) and notes (`Gap.astro`).
Each segment holds one piece of the red thread (`data-thread`). `src/scripts/thread.ts` draws each piece
as the page scrolls and moves the ball along it. Elements with `data-at="0.4"` appear when the ball is
40% along their segment's piece.

- Every stage is 600 units wide. The thread enters and leaves at x = 540 (`MARGIN_X`), so it runs down
  the right margin beside the notes. Two stages with no note between them may meet at another x.
- Build a thread with `route({ name: points, ... })` from `src/lib/doodle.ts`. It returns the path and
  how far along each named piece ends, for `data-at`.
- Draw every line with `hand()` or `stroke()`. The wobble is in the points.

## Design bar

It must read as a notebook page, not a website with a paper background.

- One thread, never lifted. A new scene continues the line from where the last one ended.
- Hand-written labels are dry and short. No exclamation marks.
- Colours: `src/lib/palette.ts` is the source of truth and `doodle.css` mirrors it. Change both, then
  run `npm run check:contrast`.
- The `.pencil` class sets stroke and stroke-width in CSS. A `stroke` attribute on the same element
  loses to it: use `style="stroke:..."`.

## Motion rules

- No SVG filters on anything that moves or sits under something that moves. Phones repaint a filter
  whenever its area changes, and that flickers. Today the page has no filters at all.
- Animate only `transform`, `opacity` and `stroke-dashoffset`.
- With `prefers-reduced-motion`, or without the script, the whole thread is already drawn.

## Guardrails

- **Original drawings only.** No photographs and no images of real people. The doodle of the owner is
  drawn in `Me.astro`.
- **The club is never named.** No crest, wordmark, kit or sponsor logos. It shows as the red thread and
  a red and white scarf.
- **Nothing from work that is confidential:** no employer, product, client, team size or figures.
- Copy marked `PLACEHOLDER:` in the YAML is not approved yet. `show()` strips the marker.
- Commit as `Shirish Veerabattini <shirish101k@gmail.com>`.
- **Brand icons stay unmodified.** A platform that Simple Icons lacks gets plain letters, not a copied logo.
- **Accessibility.** AA contrast, visible focus rings, a `<title>` on every drawing, reduced-motion support.
- **The page is public.** Placeholders in `src/content/` carry the word `PLACEHOLDER`. Do not invent real facts for them.
