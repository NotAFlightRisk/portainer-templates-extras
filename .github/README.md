<h1 align="center">Portainer Templates Extras: website</h1>
<p align="center">
<i>The site for <a href="https://github.com/NotAFlightRisk/portainer-templates-extras">Portainer Templates Extras</a>, with a page for every app and the ways to install it</i>
<br />
<b>🌐 <a href="https://portainer-templates-extras.peng.ly">portainer-templates-extras.peng.ly</a></b><br />
</p>

## What's this branch

Just the website. The templates themselves live on [`main`](https://github.com/NotAFlightRisk/portainer-templates-extras), and this branch has none of that history, so the two never get in each others way.

The site reads `templates.json` (and each stack's `compose.yml`) straight from `main` when a page is rendered, and Vercel keeps each page for an hour. So a new template turns up here by itself within the hour - nothing in this branch needs touching.

For each app it checks whether the [main Portainer Templates list](https://github.com/lissy93/portainer-templates) has it yet. If so that's the URL it recommends, if not it points at ours, since Portainer only takes one.

---

## Development

You'll need [Node](https://nodejs.org/) 22 or newer.

```bash
git clone -b website git@github.com:NotAFlightRisk/portainer-templates-extras.git
cd portainer-templates-extras
npm ci
npm run dev
```

Then the checks CI runs:

```bash
npm run format:check
npm run check
npm test
npm run build && npm run preview
```

---

## Deploying

It's built for [Vercel](https://vercel.com/), as the hourly refresh is Vercel's ISR. Import the repo, and since the site isn't on the default branch, set the Ignored Build Step to `test ! -f package.json` so commits to `main` don't try to build it. Then point your domain at the `website` branch.

All the settings are optional, and they're read at build time:

| Variable                                                          | What it does                                                    |
| ----------------------------------------------------------------- | --------------------------------------------------------------- |
| `PUBLIC_PLAUSIBLE_SCRIPT`                                         | Plausible script URL, for visitor counts                        |
| `PUBLIC_SENTRY_DSN`                                               | Sentry (or Bugsink) DSN, for error reports                      |
| `SENTRY_AUTH_TOKEN`, `SENTRY_URL`, `SENTRY_ORG`, `SENTRY_PROJECT` | Uploads sourcemaps, so those reports have readable stack traces |

Leave them out and the site loads no analytics or error reporting at all.

---

<p align="center">
  <sup><i>Licensed under <a href="../LICENSE">MIT</a>, © <a href="https://github.com/NotAFlightRisk">NotAFlightRisk</a> 2026</i></sup>
</p>
