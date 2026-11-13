# Security

## What there is to attack

Very little, on purpose.

- The site is static files on GitHub Pages. There is no server of mine, no database, no login, no
  form, no cookie and no browser storage.
- Nothing is hosted at home. No request to shirishve.com reaches a machine I own.
- The pages load only their own files: one small script, one stylesheet and two fonts. A
  Content-Security-Policy in every page allows nothing else, and no inline script.
- No analytics and no third-party request at run time.

## Build and deploy

- GitHub data is fetched when the site is built, not in the browser. It is public data only: the
  listed public repos and the contribution calendar as the public profile shows it.
- The deploy workflow has no secrets. Its build job gets a read-only token; only the deploy job can
  publish to Pages. Actions are pinned to commit hashes.
- Pull requests build offline from cached data and get no token.
- `npm ci --ignore-scripts`: dependency install scripts do not run in CI.
- Dependabot watches npm packages and Actions.

## Audit, 2026-11-12

Checked before the repository was made public:

| Check                                                                                | Result          |
| ------------------------------------------------------------------------------------ | --------------- |
| Secrets, keys, private paths or private email in tracked files and in the built site | None            |
| Inline scripts or inline event handlers in built pages                               | None            |
| `eval`, `innerHTML`, `document.write` in shipped scripts                             | None            |
| Hosts contacted by the pages in a browser                                            | Own origin only |
| Console errors under the Content-Security-Policy                                     | None            |
| Cookies or local storage set                                                         | None            |
| `npm audit`, runtime and dev dependencies                                            | 0 advisories    |
| Employer code, client names, internal numbers                                        | None            |

Known limits: GitHub Pages cannot send custom response headers, so the policy is a `<meta>` tag and
cannot include `frame-ancestors`. The page has no login or action to hijack, so framing it gains an
attacker nothing.

## Reporting a problem

Open a private report with GitHub's "Report a vulnerability" button on this repository.
