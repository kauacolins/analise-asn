from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.bootstrap import seed_defaults
from app.database import SessionLocal, get_db, init_db
from app.models import BgpRoute, Mitigator, MonitoredAsn
from app.schemas import (
    BgpRouteRead,
    CollectorRunResponse,
    MitigatorCreate,
    MitigatorRead,
    MonitoredAsnCreate,
    MonitoredAsnRead,
)
from app.services.collector import CollectorService

app = FastAPI(title="ASN Mitigation Analyzer", version="0.1.0")


@app.on_event("startup")
def startup_event() -> None:
    # Inicializa as tabelas e garante dados básicos antes de receber requests.
    init_db()
    db = SessionLocal()
    try:
        seed_defaults(db)
    finally:
        db.close()


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/mitigators", response_model=list[MitigatorRead])
def list_mitigators(db: Session = Depends(get_db)) -> list[Mitigator]:
    return db.query(Mitigator).order_by(Mitigator.nome).all()


@app.post("/mitigators", response_model=MitigatorRead, status_code=201)
def create_mitigator(payload: MitigatorCreate, db: Session = Depends(get_db)) -> Mitigator:
    mitigator = Mitigator(**payload.model_dump())
    db.add(mitigator)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="ASN mitigador já cadastrado.") from exc
    db.refresh(mitigator)
    return mitigator


@app.get("/monitored-asns", response_model=list[MonitoredAsnRead])
def list_monitored_asns(db: Session = Depends(get_db)) -> list[MonitoredAsn]:
    return db.query(MonitoredAsn).order_by(MonitoredAsn.nome).all()


@app.post("/monitored-asns", response_model=MonitoredAsnRead, status_code=201)
def create_monitored_asn(
    payload: MonitoredAsnCreate,
    db: Session = Depends(get_db),
) -> MonitoredAsn:
    monitored = MonitoredAsn(**payload.model_dump())
    db.add(monitored)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="ASN monitorado já cadastrado.") from exc
    db.refresh(monitored)
    return monitored


@app.get("/routes", response_model=list[BgpRouteRead])
def list_routes(
    mitigated_only: bool = False,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> list[BgpRoute]:
    # Lista as rotas mais recentes, com filtro opcional para mitigadas.
    query = db.query(BgpRoute).order_by(BgpRoute.collected_at.desc())
    if mitigated_only:
        query = query.filter(BgpRoute.is_mitigated.is_(True))
    return query.limit(min(limit, 500)).all()


@app.post("/collect", response_model=CollectorRunResponse)
def run_collection(db: Session = Depends(get_db)) -> CollectorRunResponse:
    # Dispara uma coleta manual sem depender do agendamento.
    service = CollectorService(db)
    return service.run()
