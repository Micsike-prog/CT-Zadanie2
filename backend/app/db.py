from contextlib import contextmanager
from pathlib import Path

import psycopg
from psycopg.rows import dict_row

from .config import get_settings


SCHEMA_PATH = Path(__file__).resolve().parents[1] / "db" / "schema.sql"


def run_migrations() -> None:
    with psycopg.connect(get_settings().database_url, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(SCHEMA_PATH.read_text(encoding="utf-8"))


@contextmanager
def get_conn():
    with psycopg.connect(get_settings().database_url, row_factory=dict_row) as conn:
        yield conn
