from datetime import datetime

from sqlalchemy import distinct, extract, func
from sqlalchemy.orm import Query, Session

from apps.api.app.models import BgpRoute, Mitigator
from apps.api.app.schemas import (
    AnalyticsSummary,
    CountByAsn,
    CountByLabel,
    HourlyIncidencePoint,
    TimeBucketCount,
    WeekdayIncidencePoint,
)


WEEKDAY_LABELS = {
    0: "domingo",
    1: "segunda",
    2: "terca",
    3: "quarta",
    4: "quinta",
    5: "sexta",
    6: "sabado",
}


class AnalyticsService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def summary(self, start: datetime | None = None, end: datetime | None = None) -> AnalyticsSummary:
        query = self._apply_date_filters(self.db.query(BgpRoute), start, end)
        total_routes = query.count()
        mitigated_routes = query.filter(BgpRoute.is_mitigated.is_(True)).count()
        distinct_prefixes = query.with_entities(func.count(distinct(BgpRoute.prefixo))).scalar() or 0
        distinct_mitigators = (
            query.filter(BgpRoute.asn_mitigador.is_not(None))
            .with_entities(func.count(distinct(BgpRoute.asn_mitigador)))
            .scalar()
            or 0
        )
        distinct_origin_asns = (
            query.filter(BgpRoute.asn_origem.is_not(None))
            .with_entities(func.count(distinct(BgpRoute.asn_origem)))
            .scalar()
            or 0
        )
        latest_collection_at = query.with_entities(func.max(BgpRoute.collected_at)).scalar()

        return AnalyticsSummary(
            total_routes=total_routes,
            mitigated_routes=mitigated_routes,
            non_mitigated_routes=max(total_routes - mitigated_routes, 0),
            mitigation_rate=(mitigated_routes / total_routes) if total_routes else 0.0,
            distinct_prefixes=distinct_prefixes,
            distinct_mitigators=distinct_mitigators,
            distinct_origin_asns=distinct_origin_asns,
            latest_collection_at=latest_collection_at,
        )

    def top_mitigators(
        self,
        start: datetime | None = None,
        end: datetime | None = None,
        limit: int = 10,
    ) -> list[CountByAsn]:
        query = self._apply_date_filters(
            self.db.query(
                BgpRoute.asn_mitigador,
                Mitigator.nome,
                func.count(BgpRoute.id).label("count"),
            )
            .outerjoin(Mitigator, Mitigator.asn == BgpRoute.asn_mitigador)
            .filter(BgpRoute.asn_mitigador.is_not(None))
            .group_by(BgpRoute.asn_mitigador, Mitigator.nome)
            .order_by(func.count(BgpRoute.id).desc(), BgpRoute.asn_mitigador.asc()),
            start,
            end,
        )
        return [
            CountByAsn(asn=row.asn_mitigador, name=row.nome, count=row.count)
            for row in query.limit(limit).all()
        ]

    def hourly_incidence(
        self,
        start: datetime | None = None,
        end: datetime | None = None,
        mitigated_only: bool = False,
    ) -> list[HourlyIncidencePoint]:
        query = self.db.query(
            extract("hour", BgpRoute.collected_at).label("hour"),
            func.count(BgpRoute.id).label("count"),
        )
        query = self._apply_date_filters(query, start, end)
        if mitigated_only:
            query = query.filter(BgpRoute.is_mitigated.is_(True))
        rows = (
            query.group_by("hour")
            .order_by("hour")
            .all()
        )
        return [HourlyIncidencePoint(hour=int(row.hour), count=row.count) for row in rows]

    def weekday_incidence(
        self,
        start: datetime | None = None,
        end: datetime | None = None,
        mitigated_only: bool = False,
    ) -> list[WeekdayIncidencePoint]:
        query = self.db.query(
            extract("dow", BgpRoute.collected_at).label("weekday"),
            func.count(BgpRoute.id).label("count"),
        )
        query = self._apply_date_filters(query, start, end)
        if mitigated_only:
            query = query.filter(BgpRoute.is_mitigated.is_(True))
        rows = (
            query.group_by("weekday")
            .order_by("weekday")
            .all()
        )
        return [
            WeekdayIncidencePoint(
                weekday=int(row.weekday),
                label=WEEKDAY_LABELS.get(int(row.weekday), str(int(row.weekday))),
                count=row.count,
            )
            for row in rows
        ]

    def top_prefixes(
        self,
        start: datetime | None = None,
        end: datetime | None = None,
        mitigated_only: bool = False,
        limit: int = 10,
    ) -> list[CountByLabel]:
        query = self.db.query(
            BgpRoute.prefixo.label("label"),
            func.count(BgpRoute.id).label("count"),
        )
        query = self._apply_date_filters(query, start, end)
        if mitigated_only:
            query = query.filter(BgpRoute.is_mitigated.is_(True))
        rows = (
            query.group_by(BgpRoute.prefixo)
            .order_by(func.count(BgpRoute.id).desc(), BgpRoute.prefixo.asc())
            .limit(limit)
            .all()
        )
        return [CountByLabel(label=row.label, count=row.count) for row in rows]

    def top_as_paths(
        self,
        start: datetime | None = None,
        end: datetime | None = None,
        mitigated_only: bool = False,
        limit: int = 10,
    ) -> list[CountByLabel]:
        query = self.db.query(
            BgpRoute.as_path.label("label"),
            func.count(BgpRoute.id).label("count"),
        )
        query = self._apply_date_filters(query, start, end)
        if mitigated_only:
            query = query.filter(BgpRoute.is_mitigated.is_(True))
        rows = (
            query.group_by(BgpRoute.as_path)
            .order_by(func.count(BgpRoute.id).desc())
            .limit(limit)
            .all()
        )
        return [CountByLabel(label=row.label, count=row.count) for row in rows]

    def volume_by_origin_asn(
        self,
        start: datetime | None = None,
        end: datetime | None = None,
        mitigated_only: bool = False,
        limit: int = 10,
    ) -> list[CountByAsn]:
        query = self.db.query(
            BgpRoute.asn_origem,
            func.count(BgpRoute.id).label("count"),
        )
        query = self._apply_date_filters(query, start, end)
        if mitigated_only:
            query = query.filter(BgpRoute.is_mitigated.is_(True))
        rows = (
            query.filter(BgpRoute.asn_origem.is_not(None))
            .group_by(BgpRoute.asn_origem)
            .order_by(func.count(BgpRoute.id).desc(), BgpRoute.asn_origem.asc())
            .limit(limit)
            .all()
        )
        return [CountByAsn(asn=row.asn_origem, count=row.count) for row in rows]

    def mitigation_frequency(
        self,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> list[TimeBucketCount]:
        query = self.db.query(
            func.date_trunc("day", BgpRoute.collected_at).label("bucket"),
            func.count(BgpRoute.id).label("count"),
        )
        query = self._apply_date_filters(query, start, end).filter(BgpRoute.is_mitigated.is_(True))
        rows = (
            query.group_by("bucket")
            .order_by("bucket")
            .all()
        )
        return [
            TimeBucketCount(bucket=row.bucket.strftime("%Y-%m-%d"), count=row.count)
            for row in rows
        ]

    @staticmethod
    def _apply_date_filters(
        query: Query,
        start: datetime | None,
        end: datetime | None,
    ) -> Query:
        if start is not None:
            query = query.filter(BgpRoute.collected_at >= start)
        if end is not None:
            query = query.filter(BgpRoute.collected_at <= end)
        return query
