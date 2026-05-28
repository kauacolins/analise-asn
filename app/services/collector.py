from collections.abc import Iterable
from time import perf_counter

from requests import RequestException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import BgpRoute, Mitigator, MonitoredAsn
from app.config import settings
from app.schemas import CollectorRunResponse
from app.services.ripe_stat import RipeStatClient, extract_timestamp


class CollectorService:
    def __init__(self, db: Session, ripe_client: RipeStatClient | None = None) -> None:
        self.db = db
        self.ripe_client = ripe_client or RipeStatClient()

    def run(self) -> CollectorRunResponse:
        # Percorre ASN monitorados, filtra /24, consulta o estado BGP e persiste os snapshots.
        started_at = perf_counter()
        monitored = self.db.query(MonitoredAsn).order_by(MonitoredAsn.asn).all()
        mitigator_map = {
            mitigator.asn: mitigator.nome
            for mitigator in self.db.query(Mitigator).order_by(Mitigator.asn).all()
        }

        prefixes_seen = 0
        prefixes_attempted = 0
        prefixes_failed = 0
        routes_saved = 0
        mitigated_routes = 0
        asns_completed = 0
        asns_failed = 0

        for item in monitored:
            print(f"[collector] Processing ASN {item.asn} ({item.nome})", flush=True)
            try:
                prefixes = self.ripe_client.get_announced_prefixes(item.asn)
            except RequestException as exc:
                print(f"[collector] Failed to fetch announced prefixes for AS{item.asn}: {exc}", flush=True)
                asns_failed += 1
                continue

            ipv4_slash24 = [prefix for prefix in prefixes if prefix.endswith("/24")]
            limited_prefixes = ipv4_slash24[: settings.collection_prefix_limit]
            prefixes_seen += len(limited_prefixes)
            print(
                f"[collector] AS{item.asn} returned {len(ipv4_slash24)} /24 prefixes; "
                f"processing first {len(limited_prefixes)}",
                flush=True,
            )

            for index, prefix in enumerate(limited_prefixes, start=1):
                prefixes_attempted += 1
                print(
                    f"[collector] AS{item.asn} prefix {index}/{len(limited_prefixes)}: {prefix}",
                    flush=True,
                )
                try:
                    bgp_states = self.ripe_client.get_bgp_state(prefix)
                except RequestException as exc:
                    prefixes_failed += 1
                    print(f"[collector] Skipping prefix {prefix} after RIPE Stat failure: {exc}", flush=True)
                    continue

                print(
                    f"[collector] Prefix {prefix} returned {len(bgp_states)} bgp_state entries",
                    flush=True,
                )

                for state in bgp_states:
                    as_path = self._normalize_path(state.get("path", []))
                    if not as_path:
                        continue

                    # Evita duplicar o mesmo snapshot quando a coleta roda novamente.
                    source_id = str(state.get("source_id") or "")
                    collected_at = extract_timestamp(state.get("timestamp"))
                    already_exists = self.db.execute(
                        select(BgpRoute.id).where(
                            BgpRoute.prefixo == prefix,
                            BgpRoute.source_id == source_id,
                            BgpRoute.collected_at == collected_at,
                        )
                    ).scalar_one_or_none()
                    if already_exists is not None:
                        continue

                    detected_mitigator = next(
                        (asn for asn in as_path if asn in mitigator_map),
                        None,
                    )
                    route = BgpRoute(
                        prefixo=prefix,
                        asn_origem=as_path[-1],
                        as_path=",".join(str(asn) for asn in as_path),
                        asn_mitigador=detected_mitigator,
                        is_mitigated=detected_mitigator is not None,
                        community=self._normalize_communities(state.get("communities", [])),
                        source_id=source_id,
                        collected_at=collected_at,
                    )
                    self.db.add(route)
                    routes_saved += 1
                    if detected_mitigator is not None:
                        mitigated_routes += 1

                # Em modo de teste, persistimos por prefixo para enxergar progresso no banco.
                self.db.commit()
                print(
                    f"[collector] Prefix {prefix} persisted; "
                    f"routes_saved={routes_saved}, mitigated_routes={mitigated_routes}",
                    flush=True,
                )

            asns_completed += 1
            print(
                f"[collector] Finished AS{item.asn}: "
                f"routes_saved={routes_saved}, mitigated_routes={mitigated_routes}",
                flush=True,
            )

        elapsed_seconds = perf_counter() - started_at
        print(
            "[collector] Run summary: "
            f"monitored_asns={len(monitored)}, "
            f"asns_completed={asns_completed}, "
            f"asns_failed={asns_failed}, "
            f"prefixes_selected={prefixes_seen}, "
            f"prefixes_attempted={prefixes_attempted}, "
            f"prefixes_failed={prefixes_failed}, "
            f"routes_saved={routes_saved}, "
            f"mitigated_routes={mitigated_routes}, "
            f"duration_seconds={elapsed_seconds:.2f}",
            flush=True,
        )

        return CollectorRunResponse(
            monitored_asns=len(monitored),
            prefixes_seen=prefixes_seen,
            routes_saved=routes_saved,
            mitigated_routes=mitigated_routes,
        )

    @staticmethod
    def _normalize_path(raw_path: Iterable[int | str]) -> list[int]:
        # Converte o path em uma lista de inteiros para facilitar analise e persistencia.
        parsed = []
        for item in raw_path:
            try:
                parsed.append(int(item))
            except (TypeError, ValueError):
                continue
        return parsed

    @staticmethod
    def _normalize_communities(raw_communities: list[dict] | list[str]) -> str | None:
        # Compacta communities em texto simples para armazenamento inicial.
        if not raw_communities:
            return None
        values = []
        for item in raw_communities:
            if isinstance(item, dict):
                value = item.get("community")
                if value:
                    values.append(str(value))
            else:
                values.append(str(item))
        return ",".join(values) if values else None
