import time

from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from apps.api.app.config import settings


engine = create_engine(settings.database_url, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    pass


def init_db(max_retries: int = 10, retry_interval_seconds: int = 3) -> None:
    # Em containers, a API pode subir antes do Postgres; por isso tentamos algumas vezes.
    for attempt in range(1, max_retries + 1):
        try:
            with engine.begin() as connection:
                Base.metadata.create_all(bind=connection)
            return
        except OperationalError:
            if attempt == max_retries:
                raise
            time.sleep(retry_interval_seconds)


def get_db():
    # Entrega uma sessão por request e garante o fechamento ao final.
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
