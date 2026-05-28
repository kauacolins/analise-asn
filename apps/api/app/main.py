from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from apps.api.app.bootstrap import seed_defaults
from apps.api.app.database import SessionLocal, get_db, init_db
from apps.api.app.models import BgpRoute, Mitigator, MonitoredAsn
from apps.api.app.schemas import (
    BgpRouteRead,
    CountByAsn,
    CountByLabel,
    CollectorRunResponse,
    HourlyIncidencePoint,
    MitigatorCreate,
    MitigatorRead,
    MonitoredAsnCreate,
    MonitoredAsnRead,
    AnalyticsSummary,
    TimeBucketCount,
    WeekdayIncidencePoint,
)
from apps.api.app.services.analytics import AnalyticsService
from apps.api.app.services.collector import CollectorService

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


@app.get("/analytics/summary", response_model=AnalyticsSummary)
def get_analytics_summary(
    start: datetime | None = None,
    end: datetime | None = None,
    db: Session = Depends(get_db),
) -> AnalyticsSummary:
    # Retorna um resumo geral da base coletada no período informado.
    return AnalyticsService(db).summary(start=start, end=end)


@app.get("/analytics/top-mitigators", response_model=list[CountByAsn])
def get_top_mitigators(
    start: datetime | None = None,
    end: datetime | None = None,
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[CountByAsn]:
    # Lista os ASN mitigadores mais recorrentes no período.
    return AnalyticsService(db).top_mitigators(start=start, end=end, limit=limit)


@app.get("/analytics/hourly-incidence", response_model=list[HourlyIncidencePoint])
def get_hourly_incidence(
    start: datetime | None = None,
    end: datetime | None = None,
    mitigated_only: bool = False,
    db: Session = Depends(get_db),
) -> list[HourlyIncidencePoint]:
    # Agrega as ocorrências por hora para alimentar histogramas e heatmaps.
    return AnalyticsService(db).hourly_incidence(
        start=start,
        end=end,
        mitigated_only=mitigated_only,
    )


@app.get("/analytics/weekday-incidence", response_model=list[WeekdayIncidencePoint])
def get_weekday_incidence(
    start: datetime | None = None,
    end: datetime | None = None,
    mitigated_only: bool = False,
    db: Session = Depends(get_db),
) -> list[WeekdayIncidencePoint]:
    # Agrega as ocorrências por dia da semana.
    return AnalyticsService(db).weekday_incidence(
        start=start,
        end=end,
        mitigated_only=mitigated_only,
    )


@app.get("/analytics/top-prefixes", response_model=list[CountByLabel])
def get_top_prefixes(
    start: datetime | None = None,
    end: datetime | None = None,
    mitigated_only: bool = False,
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[CountByLabel]:
    # Mostra os prefixos mais recorrentes no período.
    return AnalyticsService(db).top_prefixes(
        start=start,
        end=end,
        mitigated_only=mitigated_only,
        limit=limit,
    )


@app.get("/analytics/top-as-paths", response_model=list[CountByLabel])
def get_top_as_paths(
    start: datetime | None = None,
    end: datetime | None = None,
    mitigated_only: bool = False,
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[CountByLabel]:
    # Lista os AS-PATH mais frequentes, úteis para identificar recorrência.
    return AnalyticsService(db).top_as_paths(
        start=start,
        end=end,
        mitigated_only=mitigated_only,
        limit=limit,
    )


@app.get("/analytics/volume-by-origin-asn", response_model=list[CountByAsn])
def get_volume_by_origin_asn(
    start: datetime | None = None,
    end: datetime | None = None,
    mitigated_only: bool = False,
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[CountByAsn]:
    # Agrupa o volume de ocorrências por ASN de origem.
    return AnalyticsService(db).volume_by_origin_asn(
        start=start,
        end=end,
        mitigated_only=mitigated_only,
        limit=limit,
    )


@app.get("/analytics/mitigation-frequency", response_model=list[TimeBucketCount])
def get_mitigation_frequency(
    start: datetime | None = None,
    end: datetime | None = None,
    db: Session = Depends(get_db),
) -> list[TimeBucketCount]:
    # Entrega a frequência diária de rotas mitigadas para séries temporais.
    return AnalyticsService(db).mitigation_frequency(start=start, end=end)
