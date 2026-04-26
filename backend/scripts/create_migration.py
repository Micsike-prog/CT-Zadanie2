from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[2]
MIGRATIONS_DIR = ROOT_DIR / "backend" / "db" / "migrations"


def slugify(value: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9]+", "_", value.strip().lower()).strip("_")
    return normalized or "migration"


def next_version() -> str:
    versions = []
    for path in MIGRATIONS_DIR.glob("*.sql"):
        prefix, _, _ = path.stem.partition("_")
        if prefix.isdigit():
            versions.append(int(prefix))
    return f"{(max(versions) + 1) if versions else 1:03d}"


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("Usage: py -3 backend/scripts/create_migration.py add_new_table")
        return 1

    MIGRATIONS_DIR.mkdir(parents=True, exist_ok=True)
    version = next_version()
    name = slugify(" ".join(argv[1:]))
    target = MIGRATIONS_DIR / f"{version}_{name}.sql"
    target.write_text("-- Write SQL here.\n", encoding="utf-8")
    print(target)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
