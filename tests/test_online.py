import json
import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

import online


class SplitImageTest(unittest.TestCase):
    def test_docker_hub_shorthand_and_registries_resolve(self):
        cases = {
            "postgres:17-alpine": (
                "registry-1.docker.io",
                "library/postgres",
                "17-alpine",
            ),
            "docker.io/you/app:1": ("registry-1.docker.io", "you/app", "1"),
            "ghcr.io/you/app:latest": ("ghcr.io", "you/app", "latest"),
            "host:5000/app:2": ("host:5000", "app", "2"),
            "you/app": ("registry-1.docker.io", "you/app", "latest"),
        }
        for image, expected in cases.items():
            with self.subTest(image=image):
                self.assertEqual(online.split_image(image), expected)


class MainListTest(unittest.TestCase):
    def test_suffixes_are_ignored_and_our_own_copies_are_skipped(self):
        main_list = {
            "templates": [
                {"title": "Ad-Guard Home (container)"},
                {"title": "Wallos", "maintainer": f"{online.REPO_URL}/"},
            ]
        }
        with mock.patch.object(
            online, "fetch", return_value=({}, json.dumps(main_list))
        ):
            self.assertEqual(online.main_list_titles(), {"adguardhome"})


if __name__ == "__main__":
    unittest.main()
