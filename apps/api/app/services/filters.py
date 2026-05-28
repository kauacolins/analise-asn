from sqlalchemy.orm import Query

from apps.api.app.models import BgpRoute
from apps.api.app.schemas import RouteFilters


def apply_route_filters(query: Query, filters: RouteFilters) -> Query:
    # Centraliza a montagem dos filtros para manter consistencia entre endpoints.
    if filters.start is not None:
        query = query.filter(BgpRoute.collected_at >= filters.start)
    if filters.end is not None:
        query = query.filter(BgpRoute.collected_at <= filters.end)
    if filters.prefix:
        query = query.filter(BgpRoute.prefixo.ilike(f"%{filters.prefix}%"))
    if filters.origin_asn is not None:
        query = query.filter(BgpRoute.asn_origem == filters.origin_asn)
    if filters.mitigator_asn is not None:
        query = query.filter(BgpRoute.asn_mitigador == filters.mitigator_asn)
    if filters.is_mitigated is not None:
        query = query.filter(BgpRoute.is_mitigated.is_(filters.is_mitigated))
    if filters.source_id:
        query = query.filter(BgpRoute.source_id == filters.source_id)
    if filters.community_contains:
        query = query.filter(BgpRoute.community.ilike(f"%{filters.community_contains}%"))
    if filters.as_path_contains:
        query = query.filter(BgpRoute.as_path.ilike(f"%{filters.as_path_contains}%"))
    return query
