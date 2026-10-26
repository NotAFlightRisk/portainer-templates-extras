import base64
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

from smoke import STAND_IN, form_values

TEMPLATE = {
    "env": [
        {"name": "PUB_PORT", "label": "Port", "default": "8080"},
        {"name": "PUB_SECRET", "label": "Secret"},
        {"name": "PUB_URL", "label": "Address"},
    ]
}


class FormValuesTest(unittest.TestCase):
    def test_required_address_gets_a_real_address_not_the_stand_in(self):
        self.assertEqual(
            form_values(TEMPLATE, "http://127.0.0.1:8080"),
            {
                "PUB_PORT": "8080",
                "PUB_SECRET": STAND_IN,
                "PUB_URL": "http://127.0.0.1:8080",
            },
        )

    def test_secret_follows_its_openssl_hint(self):
        template = {
            "env": [
                {"name": "HEX", "description": "openssl rand -hex 32"},
                {"name": "B64", "description": "openssl rand -base64 32"},
            ]
        }
        values = form_values(template)
        self.assertEqual(len(bytes.fromhex(values["HEX"])), 32)
        self.assertEqual(len(base64.b64decode(values["B64"], validate=True)), 32)
