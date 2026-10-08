"""Starts apps the way Portainer would, with the form left at its defaults, and checks they answer"""

import argparse
import json
import os
import shlex
import subprocess
import sys
import time
import urllib.request
from urllib.error import HTTPError, URLError

from build import APPS, build, env_default

STAND_IN = "smoke-test-only"


def docker(*args, **kwargs):
    return subprocess.run(
        ["docker", *args], check=True, text=True, capture_output=True, **kwargs
    )


def form_values(template):
    """What a deploy with the defaults sends, with a stand-in for anything required"""
    return {
        var["name"]: env_default(var) or STAND_IN for var in template.get("env", [])
    }


def start_container(template, name):
    """docker run with what Portainer builds from a container template, on a random host port"""
    args = ["run", "-d", "--name", name]
    for port in template.get("ports", []):
        args += ["-p", f"127.0.0.1::{port.split(':', 1)[1]}"]
    for volume in template.get("volumes", []):
        mount = (
            f"{volume['bind']}:{volume['container']}"
            if "bind" in volume
            else volume["container"]
        )
        args += ["-v", mount + (":ro" if volume.get("readonly") else "")]
    for key, value in form_values(template).items():
        args += ["-e", f"{key}={value}"]
    if template.get("privileged"):
        args.append("--privileged")
    args.append(template["image"])
    docker(*args, *shlex.split(template.get("command", "")))
    if not template.get("ports"):
        return None
    target = template["ports"][0].split(":", 1)[1]
    return docker("port", name, target).stdout.splitlines()[0].rsplit(":", 1)[1]


def start_stack(slug, template, name):
    """docker compose up with the form's values, the way Portainer deploys a stack"""
    env = os.environ | form_values(template)
    compose = ["compose", "-p", name, "-f", str(APPS / slug / "compose.yml")]
    config = json.loads(docker(*compose, "config", "--format", "json", env=env).stdout)
    docker(*compose, "up", "-d", env=env)
    ports = [
        p for service in config["services"].values() for p in service.get("ports", [])
    ]
    return ports[0]["published"] if ports else None


def answers(port, name, timeout):
    """True once anything answers on the port, False if the app dies or time runs out"""
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            urllib.request.urlopen(f"http://127.0.0.1:{port}/", timeout=5)
            return True
        except HTTPError as err:
            if err.code < 500:
                return True
        except (URLError, ConnectionError, TimeoutError):
            pass
        running = docker(
            "ps", "-q", "--filter", f"name={name}", "--filter", "status=running"
        )
        if not running.stdout.strip():
            return False
        time.sleep(3)
    return False


def logs(name, is_stack):
    where = ["compose", "-p", name] if is_stack else []
    command = ["docker", *where, "logs", "--tail", "40", *([] if is_stack else [name])]
    return subprocess.run(
        command,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    ).stdout


def tidy(name, is_stack):
    command = (
        ["compose", "-p", name, "down", "-v"] if is_stack else ["rm", "-f", "-v", name]
    )
    subprocess.run(["docker", *command], capture_output=True, check=False)


def smoke(template, timeout):
    slug, is_stack = template["name"], template["type"] == 3
    name = f"smoke-{slug}"
    try:
        port = (
            start_stack(slug, template, name)
            if is_stack
            else start_container(template, name)
        )
        if port is None:
            print(f"✓ {template['title']} started, no port to check")
            return True
        if answers(port, name, timeout):
            print(f"✓ {template['title']} answers on port {port}")
            return True
        print(
            f"✗ {template['title']} never answered on port {port}\n{logs(name, is_stack)}"
        )
        return False
    except subprocess.CalledProcessError as err:
        print(f"✗ {template['title']} wouldn't start\n{err.stderr}")
        return False
    finally:
        tidy(name, is_stack)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "apps", nargs="*", help="folder names under apps/ (default: all)"
    )
    parser.add_argument("--timeout", type=int, default=240, help="seconds per app")
    args = parser.parse_args()
    output, problems = build()
    if problems:
        sys.exit("fix what python3 scripts/build.py reports first")
    picked = [t for t in output["templates"] if not args.apps or t["name"] in args.apps]
    unknown = set(args.apps) - {t["name"] for t in picked}
    if unknown:
        sys.exit(f"no such app: {', '.join(sorted(unknown))}")
    failed = [t["title"] for t in picked if not smoke(t, args.timeout)]
    if failed:
        sys.exit(f"{len(failed)} didn't come up: {', '.join(failed)}")


if __name__ == "__main__":
    main()
