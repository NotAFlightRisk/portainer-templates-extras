"""Fills in the README's list of apps from templates.json"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEMPLATES = ROOT / "templates.json"
README = ROOT / ".github" / "README.md"
APPS_TABLE = re.compile(r"(<!-- apps -->\n).*?(<!-- /apps -->)", re.DOTALL)


def apps_table(templates):
    rows = ["| App | Type | What it is |", "| --- | --- | --- |"]
    for template in templates:
        about, _, source = template["description"].rpartition(" Source: ")
        kind = "stack" if template["type"] == 3 else "container"
        about = about.replace("|", "\\|")
        icon = f'<img src="{template["logo"]}" width="16" alt="" />'
        rows.append(f"| {icon} [{template['title']}]({source}) | {kind} | {about} |")
    return "\n".join(rows) + "\n"


def main():
    templates = json.loads(TEMPLATES.read_text())["templates"]
    table = apps_table(templates)
    README.write_text(APPS_TABLE.sub(lambda m: m[1] + table + m[2], README.read_text()))
    print(f"✓ listed {len(templates)} apps in the README")


if __name__ == "__main__":
    main()
