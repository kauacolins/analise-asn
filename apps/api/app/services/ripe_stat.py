import time
from datetime import datetime, timezone

import requests
from requests import Response

from apps.api.app.config import settings


class RipeStatClient:
    base_url = "https://stat.ripe.net/data"

    def __init__(self, max_retries: int = 3, retry_delay_seconds: int = 2) -> None:
        self.timeout = settings.collection_timeout_seconds
        self.max_retries = max_retries
        self.retry_delay_seconds = retry_delay_seconds

    def get_announced_prefixes(self, asn: int) -> list[str]:
        # Busca os prefixos anunciados por um ASN na API do RIPE Stat.
        response = self._get_with_retry(
            endpoint="announced-prefixes/data.json",
            resource=f"AS{asn}",
        )
        payload = response.json()
        prefixes = payload.get("data", {}).get("prefixes", [])
        return [item["prefix"] for item in prefixes if item.get("prefix")]

    def get_bgp_state(self, prefix: str) -> list[dict]:
        # Recupera os caminhos BGP observados para um prefixo especifico.
        response = self._get_with_retry(
            endpoint="bgp-state/data.json",
            resource=prefix,
        )
        payload = response.json()
        return payload.get("data", {}).get("bgp_state", [])

    def _get_with_retry(self, endpoint: str, resource: str) -> Response:
        last_error: Exception | None = None
        for attempt in range(1, self.max_retries + 1):
            try:
                response = requests.get(
                    f"{self.base_url}/{endpoint}",
                    params={"resource": resource},
                    timeout=self.timeout,
                )
                response.raise_for_status()
                return response
            except requests.RequestException as exc:
                last_error = exc
                if attempt == self.max_retries:
                    break
                time.sleep(self.retry_delay_seconds)

        assert last_error is not None
        raise last_error


def extract_timestamp(raw_value: int | str | None) -> datetime:
    # Normaliza o timestamp da API para um datetime sem timezone no banco.
    if raw_value is None:
        return datetime.now(timezone.utc).replace(tzinfo=None)
    return datetime.fromtimestamp(int(raw_value), tz=timezone.utc).replace(tzinfo=None)
