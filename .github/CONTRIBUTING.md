# Contributing

Thanks for taking the time 🎉<br />
New apps, fixes to existing templates and tweaks to the scripts are all welcome. By joining in, you agree to our [Code of Conduct](./CODE_OF_CONDUCT.md).

---

## Ways to contribute

- 📦 **Add an app** - see below, it's one JSON file
- 🙋 **Request an app** - open a [request](https://github.com/NotAFlightRisk/portainer-templates-extras/issues/new?template=request_app.yml) and someone else can write it
- 🐛 **Report a broken template** - open a [bug report](https://github.com/NotAFlightRisk/portainer-templates-extras/issues/new?template=broken_template.yml)
- 🔒 **Report a vulnerability** - please *don't* open a public issue, see [SECURITY.md](./SECURITY.md)

---

## Adding an app

### 1. Check it's not already out there

It shouldn't be in this list or the [main portainer-templates list](https://portainer-templates.as93.net). That one pulls this list in too, and drops any app it already has, so a duplicate here just vanishes.

---

### 2. Write the template

Make `apps/<name>/template.json`, where `<name>` is lowercase letters, numbers and dashes. The quickest way is to copy the closest existing app, like `apps/wallos` for a single container, and change everything. Leave out `id`, `type` and `repository`, the build fills those in.

The bits that trip people up:

- `title` is the app's own name, spelt the way the project spells it. `name` matches the folder.
- `description` is one or two plain sentences (Portainer doesn't render Markdown or HTML here), ending with `Source: https://github.com/...`.
- One to three `categories`, from the list in [`scripts/schema.json`](../scripts/schema.json). Portainer's filter matches exact names, so new ones fragment the list.
- `logo` is the project's own square logo, as an `https` link on its default branch.
- `image` is the official image with a tag. A major version tag like `:3` is best if they publish one, `:latest` if that's all there is.
- `ports` look like `8080:80/tcp`. Container port on the right, protocol always on, no host IP.
- Every path holding data that has to survive an update gets a volume, `{ "container": "/data" }`. Caches and temp folders can be skipped.
- Every `env` entry has a `label`, and every value is a string, `"8080"` not `8080`. One wrong type and Portainer refuses to load the whole list, not just your app.
- Portainer sends every variable you list, even blank ones. Don't list anything that breaks when it's empty, and never give a secret a default.
- A `select` needs exactly one option with `"default": true`, or Portainer sends nothing.
- `note` shows on the deploy form. Say which port to open, how the first login works, where the data lives, and link the docs. It takes basic HTML, so write `&lt;` for `<`.

---

### 3. Stacks

If the app needs a database or anything else alongside it, put a `compose.yml` next to the template and it becomes a stack. See `apps/etherpad` for one.

- The template's `env` fills in `${VARIABLES}` in the compose file and nothing else. Optional ones look like `${VAR:-default}` with the same default as the template, required ones like `${VAR:?say what's missing}`.
- Named volumes only. A relative bind like `./config` resolves somewhere inside Portainer's own data folder, not this repo, and an absolute one reaches into the host.
- `restart: unless-stopped` on every service, and no `container_name` or `build`.
- Give the database a healthcheck, make the app wait on it with `depends_on`, and pin the database to a major version (`postgres:17-alpine`).
- `image`, `ports` and `volumes` go in the compose file, not the template.

---

### 4. Check it, then open a PR

```bash
python scripts/build.py          # validates everything, then writes templates.json and the README table
python scripts/smoke.py <name>   # starts it in Docker with the defaults and checks it answers
python scripts/online.py         # logo, image tag, and no clash with the main list
```

The build tells you exactly what's wrong and where. Commit your app along with the regenerated `templates.json` and `.github/README.md`, and open a PR titled `feat: add <app>`. CI runs the same checks, and starts your app for real.

If you can, also deploy it from Portainer itself: point Settings --> App Templates at the raw `templates.json` on your fork, deploy with the defaults, then log in and check your data survives a redeploy. It's the only test that catches everything. One catch with stacks - the generated template always points at this repo's compose file, so to try your own, add it in Portainer as a Git stack from your fork instead.

---

## Pull requests

1. **Open an issue first** for anything bigger than an app. Saves you writing code we might not merge.
2. **Fork it**, and branch off `main`.
3. **Keep it focused.** One app, or one fix, per PR.
4. **Run the checks above**, plus `python -m unittest discover -s tests` and `ruff check` if you've touched the scripts.
5. **Open the PR**, fill in the template, and link the issue it closes.

Dont worry about getting it perfect first time, we're happy to help get it over the line.

---

### Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/), and the release notes are generated from them:

```
feat: add wallos
fix: give convertx a volume for its uploads
docs: clarify the stack rules
```

Types are `feat`, `fix`, `docs`, `refactor`, `test`, `perf`, `build`, `ci` and `chore`. Breaking changes get a `!` (like `feat!:`) plus a `BREAKING CHANGE:` footer.

---

## Licensing

By contributing, you agree that your work is licensed under the [MIT License](../LICENSE) that covers this project.
