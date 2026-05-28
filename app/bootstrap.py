from sqlalchemy.orm import Session

from app.models import Mitigator, MonitoredAsn


DEFAULT_MITIGATORS = [
    {"nome": "Cloudflare", "asn": 13335},
    {"nome": "Akamai", "asn": 20940},
    {"nome": "Imperva", "asn": 19551},
    {"nome": "Voxility", "asn": 3223},
]

DEFAULT_MONITORED = [
    {"nome": "Google", "asn": 15169},
    {"nome": "AWS", "asn": 16509},
    {"nome": "Meta", "asn": 32934},
]


def seed_defaults(db: Session) -> None:
    # Popula o banco com dados mínimos para facilitar os primeiros testes.
    if not db.query(Mitigator).first():
        db.add_all(Mitigator(**item) for item in DEFAULT_MITIGATORS)
    if not db.query(MonitoredAsn).first():
        db.add_all(MonitoredAsn(**item) for item in DEFAULT_MONITORED)
    db.commit()
