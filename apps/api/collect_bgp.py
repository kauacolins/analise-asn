from apps.api.app.bootstrap import seed_defaults
from apps.api.app.database import SessionLocal, init_db
from apps.api.app.services.collector import CollectorService


def main() -> None:
    # Ponto de entrada simples para rodar a coleta via linha de comando.
    init_db()
    db = SessionLocal()
    try:
        # Garante os cadastros mínimos antes de executar a primeira coleta automatizada.
        seed_defaults(db)
        result = CollectorService(db).run()
        print("[collector] JSON summary:", flush=True)
        print(result.model_dump_json(indent=2))
    finally:
        db.close()


if __name__ == "__main__":
    main()
