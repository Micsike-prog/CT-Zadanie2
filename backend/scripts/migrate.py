from __future__ import annotations

import sys
from pathlib import Path

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool


ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app.config import get_settings  # noqa: E402
from backend.app.migrations import apply_pending_migrations  # noqa: E402


def main() -> int:
    settings = get_settings()
    migrations_dir = ROOT_DIR / "backend" / "db" / "migrations"

    pool = ConnectionPool(conninfo=settings.database_url, min_size=1, max_size=2, kwargs={"row_factory": dict_row})
    pool.open(wait=True)
    try:
        with pool.connection() as conn:
            applied = apply_pending_migrations(conn, migrations_dir)
    finally:
        pool.close()

    if not applied:
        print("No pending migrations.")
        return 0

    print("Applied migrations:")
    for migration in applied:
        print(f"- {migration.path.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
