# shirishve.com

My portfolio, painted in code: one page that runs from a starry night to a sunlit field and back.
No painting is pasted in. The brushwork is SVG drawn when the site is built, and one canvas that
paints the night sky in the browser.

Live at https://shirishve.com.

## How it is made

- **Static.** Astro builds plain HTML, CSS and two small scripts. There is no server and no database.
- **Brushwork** (`src/lib/brush.ts`): seeded stroke fields, ragged section edges, daubs and seals, all
  generated at build time.
- **The sky** (`src/lib/sky.ts`): strokes drift along the curl of a slow noise field, with one vortex per
  star. Hover or tap a star and the ten stars join into a B-tree.
- **Projects** (`src/lib/github.ts`): repo details and the public contribution year are fetched from
  GitHub at build time. If GitHub is down, the build uses the last copy in `src/data/github.json`.
- **Colour** (`src/lib/palette.ts`): every text colour is checked against every surface it can sit on.
  The build fails under WCAG AA.
- **Copy** lives in `src/content/*.yaml`. Changing a link or a line needs no code change.

## Run it

Needs Node 24.

```
npm install
npm run dev       # http://localhost:4321, design system at /styleguide/
npm run verify    # format, types, contrast, build
```

`GITHUB_OFFLINE=1 npm run build` builds from the cached GitHub data without the network.

## Deploy

GitHub Pages. `.github/workflows/deploy.yml` builds and deploys on every push to `main`, and once a
day so stars and dates stay current.

## Security

See [SECURITY.md](SECURITY.md).

## Licence

Code: MIT. Words, name and photographs: not licensed for reuse. Fonts and icons: see
[CREDITS.md](CREDITS.md).
