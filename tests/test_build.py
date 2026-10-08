import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

from build import build

CONTAINER = {
    "title": "Thing",
    "name": "thing",
    "description": "Does a thing. Source: https://github.com/you/thing",
    "categories": ["Tools"],
    "platform": "linux",
    "logo": "https://example.com/logo.png",
    "image": "you/thing:1",
    "restart_policy": "unless-stopped",
    "ports": ["8080:8080/tcp"],
    "note": "Open port 8080",
}

STACK = {
    key: value for key, value in CONTAINER.items() if key not in ("image", "ports")
} | {
    "env": [{"name": "THING_PORT", "label": "Port", "default": "8080"}],
}

COMPOSE = """services:
  app:
    image: you/thing:1
    restart: unless-stopped
    ports:
      - "${THING_PORT:-8080}:8080"
"""


class BuildTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.apps = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def add(self, slug, template, compose=None):
        folder = self.apps / slug
        folder.mkdir()
        text = template if isinstance(template, str) else json.dumps(template)
        (folder / "template.json").write_text(text)
        if compose is not None:
            (folder / "compose.yml").write_text(compose)

    def problems(self):
        return [message for _, message in build(self.apps)[1]]

    def test_container_builds_clean_with_an_id_and_type(self):
        self.add("thing", CONTAINER)
        output, problems = build(self.apps)
        self.assertEqual(problems, [])
        self.assertEqual(output["version"], "3")
        self.assertEqual(output["templates"][0], {"id": 1, "type": 1, **CONTAINER})

    def test_stack_points_portainer_at_its_compose_file(self):
        self.add("thing", STACK, COMPOSE)
        output, problems = build(self.apps)
        self.assertEqual(problems, [])
        self.assertEqual(output["templates"][0]["type"], 3)
        self.assertEqual(
            output["templates"][0]["repository"]["stackfile"], "apps/thing/compose.yml"
        )

    def test_ids_follow_title_order(self):
        self.add("zed", CONTAINER | {"title": "Zed", "name": "zed"})
        self.add("able", CONTAINER | {"title": "able", "name": "able"})
        titles = [(t["id"], t["title"]) for t in build(self.apps)[0]["templates"]]
        self.assertEqual(titles, [(1, "able"), (2, "Zed")])

    def test_number_where_portainer_wants_a_string_is_caught(self):
        self.add(
            "thing",
            CONTAINER | {"env": [{"name": "PORT", "label": "Port", "default": 8080}]},
        )
        self.assertIn("$.env[0].default: 8080 is not of type 'string'", self.problems())

    def test_untagged_image_and_host_ip_port_are_caught(self):
        self.add(
            "thing",
            CONTAINER | {"image": "you/thing", "ports": ["127.0.0.1:80:80/tcp"]},
        )
        problems = " ".join(self.problems())
        self.assertIn("$.image", problems)
        self.assertIn("$.ports[0]", problems)

    def test_select_needs_exactly_one_default(self):
        options = [{"text": "A", "value": "a"}, {"text": "B", "value": "b"}]
        self.add(
            "thing",
            CONTAINER | {"env": [{"name": "MODE", "label": "Mode", "select": options}]},
        )
        self.assertEqual(
            self.problems(), ["env MODE needs exactly one select option marked default"]
        )

    def test_build_owned_keys_are_refused(self):
        self.add("thing", CONTAINER | {"id": 7})
        self.assertEqual(self.problems(), ["leave id out, the build fills them in"])

    def test_broken_json_is_reported_not_raised(self):
        self.add("thing", '{"title": ')
        self.assertEqual(len(self.problems()), 1)

    def test_titles_that_only_differ_by_case_and_punctuation_clash(self):
        self.add("thing", CONTAINER)
        self.add("thing-two", CONTAINER | {"title": "THING!", "name": "thing-two"})
        self.assertEqual(self.problems(), ["same title as apps/thing"])

    def test_stack_env_and_compose_have_to_agree(self):
        compose = COMPOSE.replace("${THING_PORT:-8080}", "${THING_PORT:-9090}")
        compose += "    environment:\n      SECRET: ${THING_SECRET:?set it}\n"
        env = STACK["env"] + [{"name": "THING_UNUSED", "label": "Unused"}]
        self.add("thing", STACK | {"env": env}, compose)
        self.assertEqual(
            sorted(self.problems()),
            [
                "defaults THING_PORT to '9090' but the template says '8080'",
                "needs ${THING_SECRET} but the template has no env for it",
                "never uses env THING_UNUSED",
            ],
        )

    def test_stack_that_portainer_would_mangle_is_caught(self):
        compose = COMPOSE.replace("restart: unless-stopped", "container_name: thing")
        compose += "    volumes:\n      - ./data:/data\n"
        self.add("thing", STACK | {"image": "you/thing:1"}, compose)
        self.assertEqual(
            sorted(self.problems()),
            [
                "app binds a relative path, use a named volume",
                "app needs restart: unless-stopped",
                "app sets container_name, so the stack could only run once",
                "image goes in compose.yml for a stack",
            ],
        )


if __name__ == "__main__":
    unittest.main()
