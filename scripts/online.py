"""Checks the bits of each template that live elsewhere: logos, images and the main list"""

import json
import re
import sys
import urllib.parse
import urllib.request
from urllib.error import HTTPError, URLError

import yaml
from build import APPS, REPO_URL, build, report, title_key

MAIN_LIST = "https://portainer-templates.as93.net/templates.json"
TYPE_SUFFIX = re.compile(r"\s*\((container|stack|swarm|edge)\)$", re.IGNORECASE)
MANIFESTS = ", ".join(
    f"application/vnd.{kind}"
    for kind in (
        "oci.image.index.v1+json",
        "docker.distribution.manifest.list.v2+json",
        "oci.image.manifest.v1+json",
        "docker.distribution.manifest.v2+json",
    )
)


def fetch(url, headers=None, body=True):
    request = urllib.request.Request(
        url, headers={"User-Agent": "curl/8", **(headers or {})}
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.headers, response.read() if body else b""


def split_image(image):
    """'ghcr.io/you/app:1' -> ('ghcr.io', 'you/app', '1'), Docker Hub's shorthand included"""
    name, _, tag = (
        image.rpartition(":") if ":" in image.split("/")[-1] else (image, "", "latest")
    )
    first, _, rest = name.partition("/")
    if first == "docker.io":
        name = rest
    elif rest and ("." in first or ":" in first):
        return first, rest, tag
    return "registry-1.docker.io", name if "/" in name else f"library/{name}", tag


def anonymous_token(err):
    """The pull token a registry's 401 challenge points at"""
    challenge = dict(
        re.findall(r'(\w+)="([^"]*)"', err.headers.get("WWW-Authenticate", ""))
    )
    query = urllib.parse.urlencode(
        {k: challenge[k] for k in ("service", "scope") if k in challenge}
    )
    token = json.loads(fetch(f"{challenge['realm']}?{query}")[1])
    return token.get("token") or token["access_token"]


def platforms(image):
    """Linux arches the tag is built for, reading the config blob of a single-arch image"""
    registry, repo, tag = split_image(image)
    headers = {"Accept": MANIFESTS}

    def get(path):
        return json.loads(fetch(f"https://{registry}/v2/{repo}/{path}", headers)[1])

    try:
        found = get(f"manifests/{tag}")
    except HTTPError as err:
        if err.code != 401:
            raise
        headers["Authorization"] = f"Bearer {anonymous_token(err)}"
        found = get(f"manifests/{tag}")
    if "manifests" in found:
        return {
            m["platform"]["architecture"]
            for m in found["manifests"]
            if m.get("platform", {}).get("os") == "linux"
        }
    if "config" not in found:
        return set()
    config = get(f"blobs/{found['config']['digest']}")
    return {config["architecture"]} if config.get("os") == "linux" else set()


def image_problems(image):
    """(errors, warnings) for one image: it has to exist and run on amd64, arm64 is a bonus"""
    try:
        arches = platforms(image)
    except HTTPError as err:
        if err.code == 429:
            return [], [f"{image}: registry rate limited us, so not checked"]
        return [f"{image}: registry says {err.code}, does the tag exist?"], []
    except URLError as err:
        return [], [f"{image}: registry unreachable ({err.reason})"]
    if not arches:
        return [f"{image}: no linux build that Docker can still pull"], []
    if "amd64" not in arches:
        return [f"{image}: no amd64 build, only {', '.join(sorted(arches))}"], []
    return [], [] if "arm64" in arches else [
        f"{image}: no arm64 build, so no Raspberry Pi"
    ]


def logo_problems(url):
    try:
        headers, _ = fetch(url, body=False)
    except (HTTPError, URLError) as err:
        return [f"logo {url} failed ({err})"]
    kind = headers.get("Content-Type", "")
    return [] if kind.startswith("image/") else [f"logo {url} is {kind}, not an image"]


def main_list_titles():
    """Titles already in the main list, minus the ones it got from us"""
    _, body = fetch(MAIN_LIST)
    return {
        title_key(TYPE_SUFFIX.sub("", t["title"]))
        for t in json.loads(body)["templates"]
        if REPO_URL not in t.get("maintainer", "")
    }


def stack_images(slug):
    services = yaml.safe_load((APPS / slug / "compose.yml").read_text())["services"]
    return [service["image"] for service in services.values()]


def main():
    output, problems = build()
    if problems:
        sys.exit("fix what python3 scripts/build.py reports first")
    theirs = main_list_titles()
    errors = warnings = 0
    for template in output["templates"]:
        slug = template["name"]
        found, noted = logo_problems(template["logo"]), []
        if title_key(template["title"]) in theirs:
            found.append(
                f"{template['title']} is already in the main list, so ours would be dropped"
            )
        images = stack_images(slug) if template["type"] == 3 else [template["image"]]
        for image in images:
            image_errors, image_warnings = image_problems(image)
            found += image_errors
            noted += image_warnings
        for message in found:
            report(f"apps/{slug}/template.json", message)
        for message in noted:
            print(f"⚠ apps/{slug}: {message}")
        errors += len(found)
        warnings += len(noted)
        print(f"{'✗' if found else '✓'} {template['title']}")
    if errors:
        sys.exit(f"{errors} problems, {warnings} warnings")
    print(f"✓ {len(output['templates'])} templates checked, {warnings} warnings")


if __name__ == "__main__":
    main()
