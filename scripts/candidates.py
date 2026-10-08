"""Lists popular awesome-selfhosted apps that ship Docker but aren't in either list yet"""

import argparse
import io
import tarfile

import yaml
from build import build, title_key
from online import fetch, main_list_titles

DATA = "https://codeload.github.com/awesome-selfhosted/awesome-selfhosted-data/tar.gz/refs/heads/master"


def listed_apps():
    _, body = fetch(DATA)
    with tarfile.open(fileobj=io.BytesIO(body)) as archive:
        for member in archive:
            if "/software/" in member.name and member.name.endswith(".yml"):
                yield yaml.safe_load(archive.extractfile(member))


def is_known(name, known):
    """Loose on purpose, so 'Navidrome Music Server' counts as the 'Navidrome' we've got"""
    key = title_key(name)
    return any(
        key.startswith(k) or k.startswith(key)
        for k in known
        if min(len(k), len(key)) > 4
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "-n", type=int, default=30, help="how many to list (default 30)"
    )
    args = parser.parse_args()
    output, _ = build()
    known = main_list_titles() | {title_key(t["title"]) for t in output["templates"]}
    fresh = [
        app
        for app in listed_apps()
        if "Docker" in app["platforms"]
        and not app.get("archived")
        and not is_known(app["name"], known)
    ]
    fresh.sort(key=lambda app: app.get("stargazers_count", 0), reverse=True)
    for app in fresh[: args.n]:
        updated = str(app.get("updated_at", ""))[:10]
        print(
            f"{app.get('stargazers_count', 0):>7}  {updated:<10}  {app['name']}  "
            f"{app['source_code_url']}"
        )


if __name__ == "__main__":
    main()
