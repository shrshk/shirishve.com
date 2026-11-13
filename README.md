# shirishve.com

My portfolio, drawn as one line in a notebook. A doodle of me kicks a ball at the top of the page.
A red thread follows the ball through a parabola, gradient descent, Euler's identity, a binary tree,
a job queue, two slits, a light cone and the whole universe, and brings it back to my feet at the
bottom. The line never lifts.

Live at https://shirishve.com.

## How it is made

- **Static.** Astro builds plain HTML, CSS and one small script. There is no server and no database.
- **The drawings** (`src/lib/doodle.ts`, `src/components/doodle/`): every line is SVG made at build
  time. The hand wobble is in the points of each path, so there are no SVG filters and no images.
- **The thread** (`src/scripts/thread.ts`): scroll draws the red line and moves the ball along it.
  With reduced motion, or without the script, the whole line is already drawn.
- **The stars** in the night scene are my public GitHub contribution days. That data and the project
  details are fetched at build time (`src/lib/github.ts`). If GitHub is down, the build uses the last
  copy in `src/data/github.json`.
- **Colour** (`src/lib/palette.ts`): every text colour is checked against the surface it sits on.
  The build fails under WCAG AA.
- **Copy** lives in `src/content/*.yaml`. Changing a link or a line needs no code change.

## Run it

Needs Node 24.

```
npm install
npm run dev       # http://localhost:4321
npm run verify    # format, types, contrast, build
```

`GITHUB_OFFLINE=1 npm run build` builds from the cached GitHub data without the network.

## Deploy

GitHub Pages. `.github/workflows/deploy.yml` builds and deploys on every push to `main`, and once a
day so stars and dates stay current.

## Security

See [SECURITY.md](SECURITY.md).

## Licence

Code: MIT. Words, name and the doodle of me: not licensed for reuse. Fonts and icons: see
[CREDITS.md](CREDITS.md).
