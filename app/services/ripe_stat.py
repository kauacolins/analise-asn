from datetime import datetime, timezone

import requests

from app.config import settings


class RipeStatClient:
    base_url = "https://stat.ripe.net/data"

    def __init__(self) -> None:
        self.timeout = settings.collection_timeout_seconds

    def get_announced_prefixes(self, asn: int) -> list[str]:
        # Busca os prefixos anunciados por um ASN na API do RIPE Stat.
        response = requests.get(
            f"{self.base_url}/announced-prefixes/data.json",
            params={"resource": f"AS{asn}"},
            timeout=self.timeout,
        )
        response.raise_for_status()
        payload = response.json()
        prefixes = payload.get("data", {}).get("prefixes", [])
        return [item["prefix"] for item in prefixes if item.get("prefix")]

    def get_bgp_state(self, prefix: str) -> list[dict]:
        # Recupera os caminhos BGP observados para um prefixo específico.
        response = requests.get(
            f"{self.base_url}/bgp-state/data.json",
            params={"resource": prefix},
            timeout=self.timeout,
        )
        response.raise_for_status()
        payload = response.json()
        return payload.get("data", {}).get("bgp_state", [])


def extract_timestamp(raw_value: int | str | None) -> datetime:
    # Normaliza o timestamp da API para um datetime sem timezone no banco.
    if raw_value is None:
        return datetime.now(timezone.utc).replace(tzinfo=None)
    return datetime.fromtimestamp(int(raw_value), tz=timezone.utc).replace(tzinfo=None)
