<h1 align="center">Portainer Templates Extras</h1>
<p align="center">
<i>One-click Portainer templates for self-hosted apps that aren't in the usual lists (yet)</i>
<br />
<b>📋 <a href="https://raw.githubusercontent.com/NotAFlightRisk/portainer-templates-extras/main/templates.json">templates.json</a></b><br />
</p>


## What's in it

<!-- apps -->
<!-- /apps -->


## Usage

In Portainer, head to Settings --> App Templates, paste this in as the URL, and save:

```
https://raw.githubusercontent.com/NotAFlightRisk/portainer-templates-extras/main/templates.json
```

---

## Adding an app

Each app is one JSON file in `apps/<name>/template.json`, plus a `compose.yml` next to it if it needs more than one container. The build fills in the rest. The [contributing guide](CONTRIBUTING.md) has the details, or just [request an app](https://github.com/NotAFlightRisk/portainer-templates-extras/issues/new?template=request_app.yml) if you'd rather someone else wrote it.

---

## Development

You'll need [Python](https://www.python.org/) 3.10 or newer, and [Docker](https://docs.docker.com/get-docker/) for the smoke test.

```bash
git clone git@github.com:NotAFlightRisk/portainer-templates-extras.git
cd portainer-templates-extras
python3 -m venv .venv && . .venv/bin/activate
pip install -r scripts/requirements.txt
```

Then the scripts you'll want:

```bash
python scripts/build.py          # validate every app and write templates.json
python scripts/readme.py         # list them in the README
python scripts/smoke.py wallos   # start an app in Docker with its defaults, check it answers
python scripts/online.py         # check logos, image tags, and clashes with the main list
python -m unittest discover -s tests
```

CI runs the build check, the tests, the online checks and `ruff`, and smoke tests whichever apps a PR touches, plus the lot every Monday.

---

## Credits

##### Contributors

[![contributors badge](https://readme-contribs.as93.net/contributors/NotAFlightRisk/portainer-templates-extras?shape=squircle)](https://github.com/NotAFlightRisk/portainer-templates-extras/graphs/contributors)

The apps themselves belong to their authors, and each template links back to its source

---

<!-- License + Copyright -->
<p  align="center">
  <a href="https://github.com/NotAFlightRisk"><img width="64" src="https://pixelflare.cc/iain/gif/penguin-dance.gif" /></a><br>
  <sup>
    <i>Licensed under <a href="../LICENSE">MIT</a>, © <a href="https://peng.ly">NotAFlightRisk</a> 2026</i>
  </sup>
</p>

<!--
oooh, hello there! hope you're having a nice day :)
   |\__      |\___
 (:> __)X  (:o ___(
   |/        |/
-->
