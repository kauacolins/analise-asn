from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MitigatorCreate(BaseModel):
    # Payload de entrada para criação de mitigadores.
    nome: str
    asn: int


class MitigatorRead(MitigatorCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


class MonitoredAsnCreate(BaseModel):
    # Payload de entrada para criação de ASN monitorados.
    nome: str
    asn: int


class MonitoredAsnRead(MonitoredAsnCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


class BgpRouteRead(BaseModel):
    # Representação de leitura para expor as rotas via API.
    id: int
    prefixo: str
    asn_origem: int | None
    as_path: str
    asn_mitigador: int | None
    is_mitigated: bool
    community: str | None
    source_id: str | None
    collected_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RouteFilters(BaseModel):
    # Filtros compartilhados para consultas analiticas e listagem de rotas.
    start: datetime | None = None
    end: datetime | None = None
    prefix: str | None = None
    origin_asn: int | None = None
    mitigator_asn: int | None = None
    is_mitigated: bool | None = None
    source_id: str | None = None
    community_contains: str | None = None
    as_path_contains: str | None = None


class CollectorRunResponse(BaseModel):
    # Resumo da execução de uma coleta manual.
    monitored_asns: int
    prefixes_seen: int
    routes_saved: int
    mitigated_routes: int


class AnalyticsSummary(BaseModel):
    # Resumo geral dos indicadores principais do dataset filtrado.
    total_routes: int
    mitigated_routes: int
    non_mitigated_routes: int
    mitigation_rate: float
    distinct_prefixes: int
    distinct_mitigators: int
    distinct_origin_asns: int
    latest_collection_at: datetime | None


class CountByLabel(BaseModel):
    # Série simples para rankings analíticos.
    label: str
    count: int


class CountByAsn(BaseModel):
    # Série simples para rankings por ASN.
    asn: int | None
    name: str | None = None
    count: int


class TimeBucketCount(BaseModel):
    # Série temporal agregada para gráficos.
    bucket: str
    count: int


class HourlyIncidencePoint(BaseModel):
    # Distribuição de ocorrências por hora do dia.
    hour: int
    count: int


class WeekdayIncidencePoint(BaseModel):
    # Distribuição de ocorrências por dia da semana.
    weekday: int
    label: str
    count: int
