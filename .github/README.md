<h1 align="center">Portainer Templates Extras</h1>
<p align="center">
<i>One-click Portainer templates for self-hosted apps that aren't in the usual lists (yet)</i>
<br />
<b>📋 <a href="https://raw.githubusercontent.com/NotAFlightRisk/portainer-templates-extras/main/templates.json">templates.json</a></b><br />
</p>


## What's in it

<!-- apps -->
| App | Type | What it is |
| --- | --- | --- |
| <img src="https://raw.githubusercontent.com/alam00000/bentopdf/main/public/images/favicon-512x512.png" width="16" alt="" /> [BentoPDF](https://github.com/alam00000/bentopdf) | container | PDF toolkit that runs in your browser, so files never leave your machine. Merge, split, compress, convert, sign and edit. |
| <img src="https://raw.githubusercontent.com/C4illin/ConvertX/main/public/apple-touch-icon.png" width="16" alt="" /> [ConvertX](https://github.com/C4illin/ConvertX) | container | File converter for over a thousand formats, covering images, documents, audio, video and ebooks. |
| <img src="https://raw.githubusercontent.com/ether/etherpad/develop/admin/public/brand.svg" width="16" alt="" /> [Etherpad](https://github.com/ether/etherpad) | stack | Collaborative text editor where everyone types in the same document at once, with history, chat and plugins. This one runs on Postgres. |
| <img src="https://raw.githubusercontent.com/seerr-team/seerr/develop/public/android-chrome-512x512.png" width="16" alt="" /> [Seerr](https://github.com/seerr-team/seerr) | container | Request manager for Jellyfin, Plex and Emby, where people ask for films and shows and Sonarr and Radarr fetch them. It's the merged successor to Overseerr and Jellyseerr. |
| <img src="https://raw.githubusercontent.com/super-productivity/super-productivity/master/src/assets/icons/icon-512x512.png" width="16" alt="" /> [Super Productivity](https://github.com/super-productivity/super-productivity) | container | To-do list with timeboxing and time tracking built in, and it can pull in issues from Jira, GitHub and GitLab. |
| <img src="https://raw.githubusercontent.com/Termix-SSH/Termix/main/public/icon.svg" width="16" alt="" /> [Termix](https://github.com/Termix-SSH/Termix) | container | SSH terminal and server manager in the browser, with saved hosts, tunnels and a file editor. |
| <img src="https://raw.githubusercontent.com/ellite/wallos/main/images/icon/android-chrome-512x512.png" width="16" alt="" /> [Wallos](https://github.com/ellite/wallos) | container | Subscription tracker for keeping an eye on recurring bills, with stats, multiple currencies and reminders before things renew. |
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
python scripts/smoke.py wallos   # start an app in Docker with its defaults, check it answers
python scripts/online.py         # check logos, image tags, and clashes with the main list
python scripts/candidates.py     # popular awesome-selfhosted apps nobody's templated yet
python -m unittest discover -s tests
```

CI runs the build check, the tests, the online checks and `ruff`, and smoke tests whichever apps a PR touches.

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
