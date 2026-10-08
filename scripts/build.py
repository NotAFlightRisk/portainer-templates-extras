"""Builds templates.json from apps/, and refuses to write anything Portainer would choke on"""

import argparse
import json
import os
import re
import string
import sys
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parent.parent
APPS = ROOT / "apps"
OUTPUT = ROOT / "templates.json"
README = ROOT / ".github" / "README.md"
REPO_URL = "https://github.com/NotAFlightRisk/portainer-templates-extras"
SCHEMA = json.loads((Path(__file__).parent / "schema.json").read_text())
VALIDATOR = Draft202012Validator(SCHEMA, format_checker=FormatChecker())
TEMPLATE_VALIDATOR = VALIDATOR.evolve(
    schema={"$ref": "#/$defs/template", "$defs": SCHEMA["$defs"]}
)
BUILD_KEYS = {"id", "type", "repository"}
STACK_KEYS_FOR_COMPOSE = {"image", "ports", "volumes"}
HOST_ACCESS = {"privileged", "devices", "cap_add"}
HOST_NAMESPACES = ("network_mode", "pid", "ipc")
DOCKER_SOCKET = "/var/run/docker.sock"
SECRET_NAME = re.compile(r"PASSW(OR)?D|SECRET|TOKEN|(^|_)KEY$", re.IGNORECASE)
NAME = r"[A-Za-z_][A-Za-z0-9_]*"
COMPOSE_VAR = re.compile(rf"(?<!\$)\$(?:\{{({NAME})(?:(:?[-?+])([^}}]*))?\}}|({NAME}))")
APPS_TABLE = re.compile(r"(<!-- apps -->\n).*?(<!-- /apps -->)", re.DOTALL)


def title_key(title):
    """Same squashing the main list dedupes on, so a clash here is a clash there"""
    return (
        title.translate(str.maketrans("", "", string.punctuation))
        .replace(" ", "")
        .lower()
    )


def read_app(folder):
    """An app's template, with the bits the build owns filled in"""
    source = json.loads((folder / "template.json").read_text())
    if not isinstance(source, dict):
        raise TypeError("template.json must hold one template object")
    owned = sorted(BUILD_KEYS & source.keys())
    if owned:
        raise ValueError(f"leave {', '.join(owned)} out, the build fills them in")
    if not (folder / "compose.yml").exists():
        return {"type": 1, **source}
    stackfile = f"apps/{folder.name}/compose.yml"
    return {
        "type": 3,
        **source,
        "repository": {"url": REPO_URL, "stackfile": stackfile},
    }


def env_default(var):
    picked = [
        option["value"] for option in var.get("select", []) if option.get("default")
    ]
    return picked[0] if picked else var.get("default", "")


def env_problems(env):
    """Env rules the schema can't express"""
    names = [var["name"] for var in env]
    found = [
        f"env {name} is listed twice"
        for name in sorted(set(names))
        if names.count(name) > 1
    ]
    for var in env:
        name = var["name"]
        if "select" in var and "default" in var:
            found.append(f"env {name} has a select and a default, pick one")
        if (
            "select" in var
            and sum(o.get("default") is True for o in var["select"]) != 1
        ):
            found.append(f"env {name} needs exactly one select option marked default")
        if SECRET_NAME.search(name) and var.get("default"):
            found.append(f"env {name} looks like a secret, so it can't have a default")
    return found


def container_problems(template):
    """Port and host access rules for a single container"""
    found = [
        f"port {port} is out of range"
        for port in template.get("ports", [])
        if not all(1 <= int(n) <= 65535 for n in port.split("/")[0].split(":"))
    ]
    if template.get("privileged"):
        found.append("is privileged, which hands it the whole host")
    if any(
        volume.get("bind") == DOCKER_SOCKET for volume in template.get("volumes", [])
    ):
        found.append("mounts the Docker socket, which is root on the host")
    return found


def volume_source(volume):
    if isinstance(volume, dict):
        return str(volume.get("source", ""))
    return volume.split(":")[0] if isinstance(volume, str) and ":" in volume else ""


def service_problems(name, service):
    if not isinstance(service, dict):
        return [f"{name} is empty"]
    found = []
    if "build" in service:
        found.append(f"{name} uses build, Portainer needs a published image")
    if "container_name" in service:
        found.append(f"{name} sets container_name, so the stack could only run once")
    if service.get("restart") != "unless-stopped":
        found.append(f"{name} needs restart: unless-stopped")
    risky = sorted(HOST_ACCESS & service.keys())
    risky += [key for key in HOST_NAMESPACES if service.get(key) == "host"]
    if risky:
        found.append(f"{name} asks for host access ({', '.join(risky)})")
    if any(
        volume_source(v).startswith((".", "~", "/"))
        for v in service.get("volumes") or []
    ):
        found.append(f"{name} binds a host path, use a named volume")
    return found


def compose_problems(text, env):
    """Things that make a stack fail in Portainer, fail quietly, or reach into the host"""
    compose = yaml.safe_load(text)
    services = compose.get("services") if isinstance(compose, dict) else None
    if not isinstance(services, dict) or not services:
        return ["no services"]
    found = ["has a top-level version key, drop it"] if "version" in compose else []
    for name, service in services.items():
        found += service_problems(name, service)
    defaults = {var["name"]: env_default(var) for var in env}
    used = set()
    for braced, op, value, bare in COMPOSE_VAR.findall(text):
        name = braced or bare
        used.add(name)
        if name not in defaults and op not in ("-", ":-", "+", ":+"):
            found.append(f"needs ${{{name}}} but the template has no env for it")
        if name in defaults and op in ("-", ":-") and value != defaults[name]:
            found.append(
                f"defaults {name} to {value!r} but the template says {defaults[name]!r}"
            )
    found += [f"never uses env {name}" for name in defaults if name not in used]
    return sorted(set(found))


def app_problems(folder, template):
    """Everything wrong with one assembled template, as (file, problem)"""
    where = f"apps/{folder.name}/template.json"
    errors = [
        f"{e.json_path}: {e.message}" for e in TEMPLATE_VALIDATOR.iter_errors(template)
    ]
    if errors:
        return [(where, error) for error in errors]
    found = env_problems(template.get("env", []))
    if template["name"] != folder.name:
        found.append(f"name should match the folder name, {folder.name}")
    compose = folder / "compose.yml"
    if not compose.exists():
        return [(where, problem) for problem in found + container_problems(template)]
    found += [
        f"{key} goes in compose.yml for a stack"
        for key in sorted(STACK_KEYS_FOR_COMPOSE & template.keys())
    ]
    try:
        stack = compose_problems(compose.read_text(), template.get("env", []))
    except yaml.YAMLError as err:
        stack = [f"is not valid YAML ({err})"]
    stack_where = f"apps/{folder.name}/compose.yml"
    return [(where, problem) for problem in found] + [(stack_where, p) for p in stack]


def build(apps=APPS):
    """templates.json's contents, plus a (file, problem) for everything wrong on the way"""
    found, problems = [], []
    for folder in sorted(path for path in apps.iterdir() if path.is_dir()):
        try:
            found.append((folder, read_app(folder)))
        except (OSError, TypeError, ValueError) as err:
            problems.append((f"apps/{folder.name}/template.json", str(err)))
    found.sort(key=lambda app: str(app[1].get("title", "")).lower())
    templates, titles = [], {}
    for index, (folder, template) in enumerate(found, start=1):
        template = {"id": index, **template}
        problems += app_problems(folder, template)
        clash = titles.setdefault(
            title_key(str(template.get("title", ""))), folder.name
        )
        if clash != folder.name:
            problems.append(
                (f"apps/{folder.name}/template.json", f"same title as apps/{clash}")
            )
        templates.append(template)
    output = {"version": "3", "templates": templates}
    if not problems:
        problems = [
            ("templates.json", error.message) for error in VALIDATOR.iter_errors(output)
        ]
    return output, problems


def apps_table(templates):
    """The README's list of apps, so it can't drift from templates.json"""
    rows = ["| App | Type | What it is |", "| --- | --- | --- |"]
    for template in templates:
        about, _, source = template["description"].rpartition(" Source: ")
        kind = "stack" if template["type"] == 3 else "container"
        about = about.replace("|", "\\|")
        rows.append(f"| [{template['title']}]({source}) | {kind} | {about} |")
    return "\n".join(rows) + "\n"


def generated(output):
    """Every file the build writes, and what it should hold"""
    table = apps_table(output["templates"])
    readme = APPS_TABLE.sub(lambda m: m[1] + table + m[2], README.read_text())
    return {
        OUTPUT: json.dumps(output, indent=2, ensure_ascii=False) + "\n",
        README: readme,
    }


def report(where, message):
    if os.environ.get("GITHUB_ACTIONS"):
        print(f"::error file={where}::{message}")
    else:
        print(f"✗ {where}: {message}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check", action="store_true", help="fail if anything is stale"
    )
    args = parser.parse_args()
    output, problems = build()
    for where, message in problems:
        report(where, message)
    if problems:
        sys.exit(f"{len(problems)} problems, nothing written")
    files = generated(output)
    count = len(output["templates"])
    if not args.check:
        for path, text in files.items():
            path.write_text(text)
        print(f"✓ wrote {count} templates to templates.json")
        return
    stale = [p for p, text in files.items() if not p.exists() or p.read_text() != text]
    for path in stale:
        report(
            path.relative_to(ROOT),
            "out of date, run python3 scripts/build.py and commit it",
        )
    if stale:
        sys.exit(1)
    print(f"✓ {count} templates, all valid, and everything generated is up to date")


if __name__ == "__main__":
    main()
