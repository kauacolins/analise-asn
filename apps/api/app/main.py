from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from apps.api.app.bootstrap import seed_defaults
from apps.api.app.database import SessionLocal, get_db, init_db
from apps.api.app.models import BgpRoute, Mitigator, MonitoredAsn
from apps.api.app.schemas import (
    AnalyticsSummary,
    BgpRouteRead,
    CountByAsn,
    CountByLabel,
    CollectorRunResponse,
    HourlyIncidencePoint,
    MitigatorCreate,
    MitigatorRead,
    MonitoredAsnCreate,
    MonitoredAsnRead,
    RouteFilters,
    TimeBucketCount,
    WeekdayIncidencePoint,
)
from apps.api.app.services.analytics import AnalyticsService
from apps.api.app.services.collector import CollectorService
from apps.api.app.services.filters import apply_route_filters

app = FastAPI(title="ASN Mitigation Analyzer", version="0.1.0")


def get_route_filters(
    start: datetime | None = None,
    end: datetime | None = None,
    prefix: str | None = Query(default=None, min_length=1),
    origin_asn: int | None = Query(default=None, ge=1),
    mitigator_asn: int | None = Query(default=None, ge=1),
    is_mitigated: bool | None = None,
    source_id: str | None = Query(default=None, min_length=1),
    community_contains: str | None = Query(default=None, min_length=1),
    as_path_contains: str | None = Query(default=None, min_length=1),
) -> RouteFilters:
    return RouteFilters(
        start=start,
        end=end,
        prefix=prefix,
        origin_asn=origin_asn,
        mitigator_asn=mitigator_asn,
        is_mitigated=is_mitigated,
        source_id=source_id,
        community_contains=community_contains,
        as_path_contains=as_path_contains,
    )


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
    filters: RouteFilters = Depends(get_route_filters),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[BgpRoute]:
    # Lista as rotas mais recentes com o mesmo mecanismo de filtragem usado nos analytics.
    query = apply_route_filters(db.query(BgpRoute), filters).order_by(BgpRoute.collected_at.desc())
    return query.offset(offset).limit(limit).all()


@app.get("/routes/{route_id}", response_model=BgpRouteRead)
def get_route_detail(route_id: int, db: Session = Depends(get_db)) -> BgpRoute:
    # Retorna um evento individual para telas de detalhe e investigação.
    route = db.query(BgpRoute).filter(BgpRoute.id == route_id).first()
    if route is None:
        raise HTTPException(status_code=404, detail="Evento de rota não encontrado.")
    return route


@app.post("/collect", response_model=CollectorRunResponse)
def run_collection(db: Session = Depends(get_db)) -> CollectorRunResponse:
    # Dispara uma coleta manual sem depender do agendamento.
    service = CollectorService(db)
    return service.run()


@app.get("/analytics/summary", response_model=AnalyticsSummary)
def get_analytics_summary(
    filters: RouteFilters = Depends(get_route_filters),
    db: Session = Depends(get_db),
) -> AnalyticsSummary:
    # Retorna um resumo geral da base coletada no período informado.
    return AnalyticsService(db).summary(filters=filters)


@app.get("/analytics/top-mitigators", response_model=list[CountByAsn])
def get_top_mitigators(
    filters: RouteFilters = Depends(get_route_filters),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[CountByAsn]:
    # Lista os ASN mitigadores mais recorrentes no período.
    return AnalyticsService(db).top_mitigators(filters=filters, limit=limit)


@app.get("/analytics/hourly-incidence", response_model=list[HourlyIncidencePoint])
def get_hourly_incidence(
    filters: RouteFilters = Depends(get_route_filters),
    db: Session = Depends(get_db),
) -> list[HourlyIncidencePoint]:
    # Agrega as ocorrências por hora para alimentar histogramas e heatmaps.
    return AnalyticsService(db).hourly_incidence(filters=filters)


@app.get("/analytics/weekday-incidence", response_model=list[WeekdayIncidencePoint])
def get_weekday_incidence(
    filters: RouteFilters = Depends(get_route_filters),
    db: Session = Depends(get_db),
) -> list[WeekdayIncidencePoint]:
    # Agrega as ocorrências por dia da semana.
    return AnalyticsService(db).weekday_incidence(filters=filters)


@app.get("/analytics/top-prefixes", response_model=list[CountByLabel])
def get_top_prefixes(
    filters: RouteFilters = Depends(get_route_filters),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[CountByLabel]:
    # Mostra os prefixos mais recorrentes no período.
    return AnalyticsService(db).top_prefixes(filters=filters, limit=limit)


@app.get("/analytics/top-as-paths", response_model=list[CountByLabel])
def get_top_as_paths(
    filters: RouteFilters = Depends(get_route_filters),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[CountByLabel]:
    # Lista os AS-PATH mais frequentes, úteis para identificar recorrência.
    return AnalyticsService(db).top_as_paths(filters=filters, limit=limit)


@app.get("/analytics/volume-by-origin-asn", response_model=list[CountByAsn])
def get_volume_by_origin_asn(
    filters: RouteFilters = Depends(get_route_filters),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[CountByAsn]:
    # Agrupa o volume de ocorrências por ASN de origem.
    return AnalyticsService(db).volume_by_origin_asn(filters=filters, limit=limit)


@app.get("/analytics/mitigation-frequency", response_model=list[TimeBucketCount])
def get_mitigation_frequency(
    filters: RouteFilters = Depends(get_route_filters),
    db: Session = Depends(get_db),
) -> list[TimeBucketCount]:
    # Entrega a frequência diária de rotas mitigadas para séries temporais.
    return AnalyticsService(db).mitigation_frequency(filters=filters)
