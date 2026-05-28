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


class CollectorRunResponse(BaseModel):
    # Resumo da execução de uma coleta manual.
    monitored_asns: int
    prefixes_seen: int
    routes_saved: int
    mitigated_routes: int
